import os
import threading
import datetime
import logging
import shutil
import subprocess
import re
from ipaddress import ip_network, ip_address

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from flask_migrate import Migrate
from flask_socketio import SocketIO
from flask_mail import Mail
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity

from config import Config
from models import db, User, ROLE_ADMIN, Scan, Vulnerability, VM
from auth import auth_bp

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("digital_twin")

# Track in-progress scans to prevent duplicates
running_scans: set = set()
running_lock  = threading.Lock()

MODE_ESTIMATE = {
    "fast":   "~2 min per host",
    "medium": "~6 min per host",
    "deep":   "~15 min per host",
}


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # ── Extensions ──────────────────────────────────────────────────────────────
    db.init_app(app)
    Migrate(app, db)
    CORS(app, supports_credentials=True)
    Mail(app)
    JWTManager(app)

    socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")
    app.socketio = socketio

    # ── Blueprints ───────────────────────────────────────────────────────────────
    app.register_blueprint(auth_bp)

    from api.vm_routes       import vm_bp
    from api.scan_routes     import scan_bp
    from api.network_insights import insights_bp

    app.register_blueprint(vm_bp)
    app.register_blueprint(scan_bp)
    app.register_blueprint(insights_bp)

    # ── Health ───────────────────────────────────────────────────────────────────
    @app.route("/api/health")
    def health():
        return jsonify({
            "status": "ok",
            "time":   datetime.datetime.utcnow().isoformat(),
            "nmap":   bool(shutil.which("nmap")),
        })

    # ── Dashboard summary ────────────────────────────────────────────────────────
    @app.route("/api/summary")
    def summary():
        total_vms = VM.query.count()

        # A VM is "at risk" if it has any high/critical vulnerability
        at_risk_ids = (
            db.session.query(Vulnerability.vm_id)
            .filter(Vulnerability.severity.in_(["critical", "high"]))
            .filter(Vulnerability.vm_id.isnot(None))
            .distinct()
            .subquery()
        )
        at_risk = db.session.query(at_risk_ids).count()

        total_vulns    = Vulnerability.query.count()
        critical_vulns = Vulnerability.query.filter_by(severity="critical").count()
        high_vulns     = Vulnerability.query.filter_by(severity="high").count()
        exploitable    = Vulnerability.query.filter_by(exploit_available=True).count()

        return jsonify({
            "totalVMs":      total_vms,
            "atRiskVMs":     at_risk,
            "healthyVMs":    max(0, total_vms - at_risk),
            "totalVulns":    total_vulns,
            "criticalVulns": critical_vulns,
            "highVulns":     high_vulns,
            "exploitable":   exploitable,
        })

    # ── Network risk score ───────────────────────────────────────────────────────
    @app.route("/api/network-risk")
    def network_risk():
        from ai.network_risk import calculate_network_risk
        vulns  = Vulnerability.query.all()
        assets = VM.query.all()
        score  = calculate_network_risk(vulns, assets)

        if score >= 70:
            level = "HIGH"
        elif score >= 40:
            level = "MEDIUM"
        else:
            level = "LOW"

        return jsonify({
            "network_risk_score":    round(score, 1),
            "risk_level":            level,
            "total_vulnerabilities": len(vulns),
            "total_assets":          len(assets),
        })

    # ── Top vulnerabilities (AI ranked) ─────────────────────────────────────────
    @app.route("/api/top-vulnerabilities")
    def top_vulnerabilities():
        from ai.prioritization import prioritize_vulnerabilities, build_priority_report
        vulns  = Vulnerability.query.all()
        ranked = prioritize_vulnerabilities(vulns)
        return jsonify({"top_vulnerabilities": build_priority_report(ranked[:10])})

    # ── Start scan ───────────────────────────────────────────────────────────────
    @app.route("/api/scan/start", methods=["POST"])
    def start_scan():
        from scanner.scanner import run_scan

        data   = request.get_json(force=True, silent=True) or {}
        target = (data.get("target") or "").strip()
        mode   = data.get("mode", "fast")

        if not target:
            return jsonify({"error": "target is required"}), 400

        if mode not in ("fast", "medium", "deep"):
            mode = "fast"

        if not shutil.which("nmap"):
            return jsonify({"error": "nmap is not installed on the server"}), 500

        with running_lock:
            if target in running_scans:
                return jsonify({"error": f"Scan already running for {target}"}), 409
            running_scans.add(target)

        scan = Scan(
            target     = target,
            mode       = mode,
            status     = "queued",
            progress   = 0,
            phase      = "queued",
            eta        = MODE_ESTIMATE.get(mode, ""),
            start_time = datetime.datetime.utcnow(),
        )
        db.session.add(scan)
        db.session.commit()
        scan_id = scan.id

        def worker():
            try:
                with app.app_context():
                    run_scan(scan_id, target, mode)
                    socketio.emit("scan_update", {
                        "scan_id": scan_id,
                        "status":  "completed",
                        "progress": 100,
                    })
            except Exception as e:
                logger.exception("Scan worker failed: %s", e)
                try:
                    with app.app_context():
                        s = db.session.get(Scan, scan_id)
                        if s:
                            s.status   = "failed"
                            s.phase    = f"error: {str(e)[:200]}"
                            s.end_time = datetime.datetime.utcnow()
                            db.session.commit()
                except Exception:
                    pass
            finally:
                with running_lock:
                    running_scans.discard(target)

        threading.Thread(target=worker, daemon=True).start()

        return jsonify({
            "scan_id": scan_id,
            "target":  target,
            "mode":    mode,
            "eta":     MODE_ESTIMATE.get(mode, ""),
            "message": "Scan queued",
        }), 202

    # ── Network discovery (ping sweep) ──────────────────────────────────────────
    @app.route("/api/vm/discover", methods=["POST"])
    def discover():
        data    = request.get_json(force=True, silent=True) or {}
        network = (data.get("network") or "").strip()

        if not network:
            return jsonify({"error": "network is required"}), 400

        try:
            ip_network(network, strict=False)
        except ValueError:
            return jsonify({"error": f"Invalid network: {network}"}), 400

        if not shutil.which("nmap"):
            return jsonify({"error": "nmap not installed"}), 500

        try:
            result = subprocess.run(
                ["nmap", "-sn", "-T4", "--open", "-oG", "-", network],
                capture_output=True, text=True, timeout=120
            )
        except subprocess.TimeoutExpired:
            return jsonify({"error": "Discovery timed out"}), 504
        except Exception as e:
            return jsonify({"error": str(e)}), 500

        discovered = []
        for line in result.stdout.splitlines():
            if "Status: Up" not in line:
                continue
            m = re.search(r"Host:\s*([\d\.a-fA-F:]+)", line)
            if not m:
                continue
            ip = m.group(1)

            # hostname from same line
            hn_m = re.search(r"\(([^)]+)\)", line)
            hostname = hn_m.group(1) if hn_m else f"host-{ip}"

            existing = VM.query.filter_by(ip_address=ip).first()
            if existing:
                existing.last_seen = datetime.datetime.utcnow()
            else:
                vm = VM(ip_address=ip, hostname=hostname, status="active")
                db.session.add(vm)
                discovered.append(ip)

        db.session.commit()
        return jsonify({"total": len(discovered), "hosts": discovered})

    # ── Scan progress (real-time poll) ───────────────────────────────────────────
    @app.route("/api/scan/<int:scan_id>/progress")
    def scan_progress(scan_id):
        scan = db.session.get(Scan, scan_id)
        if not scan:
            return jsonify({"error": "not found"}), 404
        return jsonify({
            "scan_id":  scan.id,
            "status":   scan.status,
            "progress": scan.progress,
            "phase":    scan.phase,
        })

    # ── PDF report download ──────────────────────────────────────────────────────
    @app.route("/api/scan/<int:scan_id>/report/pdf")
    def download_report(scan_id):
        try:
            from reporting.pdf_generator import generate_scan_report
            file_path = generate_scan_report(scan_id)
            if not os.path.exists(file_path):
                return jsonify({"error": "Report not found"}), 404
            return send_file(file_path, as_attachment=True)
        except Exception as e:
            logger.error("PDF generation error: %s", e)
            return jsonify({"error": str(e)}), 500

    # ── Vulnerability remediation update ────────────────────────────────────────
    @app.route("/api/vulnerability/<int:vuln_id>/remediate", methods=["PATCH"])
    def update_remediation(vuln_id):
        v = db.session.get(Vulnerability, vuln_id)
        if not v:
            return jsonify({"error": "not found"}), 404
        data = request.get_json(force=True, silent=True) or {}
        if "remediation_status" in data:
            v.remediation_status = data["remediation_status"]
        if "assigned_to" in data:
            v.assigned_to = data["assigned_to"]
        if "remediation_notes" in data:
            v.remediation_notes = data["remediation_notes"]
        if data.get("remediation_status") == "resolved":
            v.resolved_at = datetime.datetime.utcnow()
        db.session.commit()
        return jsonify({"updated": vuln_id})

    return app, socketio


if __name__ == "__main__":
    app, socketio = create_app()

    with app.app_context():
        db.create_all()

        if not User.query.filter_by(username="admin").first():
            admin = User(username="admin", role=ROLE_ADMIN)
            admin.set_password("admin123")
            db.session.add(admin)
            db.session.commit()
            logger.info("Default admin user created (change password!)")

    socketio.run(app, host="0.0.0.0", port=5000, debug=False)














