from flask import Blueprint, jsonify, request
from datetime import datetime

from models import db, Scan, Vulnerability

scan_bp = Blueprint("scan", __name__)


# ── GET /api/scans ── list all scans ─────────────────────────────────────────
@scan_bp.route("/api/scans", methods=["GET"])
def list_scans():
    scans = Scan.query.order_by(Scan.id.desc()).limit(50).all()
    return jsonify([_scan_dict(s) for s in scans])


# ── GET /api/scan/<id> ── poll scan status ────────────────────────────────────
@scan_bp.route("/api/scan/<int:scan_id>", methods=["GET"])
def get_scan(scan_id):
    scan = db.session.get(Scan, scan_id)
    if not scan:
        return jsonify({"error": "scan not found"}), 404
    return jsonify(_scan_dict(scan))


# ── GET /api/scan/<id>/vulnerabilities ── results ────────────────────────────
@scan_bp.route("/api/scan/<int:scan_id>/vulnerabilities", methods=["GET"])
def get_scan_vulnerabilities(scan_id):
    scan = db.session.get(Scan, scan_id)
    if not scan:
        return jsonify({"error": "scan not found"}), 404

    severity = request.args.get("severity")
    q = Vulnerability.query.filter_by(scan_id=scan_id)
    if severity:
        q = q.filter_by(severity=severity.lower())

    vulns = q.order_by(Vulnerability.risk_score.desc()).all()
    return jsonify({
        "scan_id": scan_id,
        "total":   len(vulns),
        "vulnerabilities": [v.to_dict() for v in vulns],
    })


# ── GET /api/top-vulnerabilities ── dashboard widget ─────────────────────────
@scan_bp.route("/api/top-vulnerabilities", methods=["GET"])
def top_vulnerabilities():
    from ai.prioritization import prioritize_vulnerabilities, build_priority_report
    vulns  = Vulnerability.query.all()
    ranked = prioritize_vulnerabilities(vulns)
    return jsonify({"top_vulnerabilities": build_priority_report(ranked[:10])})


# ── DELETE /api/scan/<id> ── remove scan + its vulns ─────────────────────────
@scan_bp.route("/api/scan/<int:scan_id>", methods=["DELETE"])
def delete_scan(scan_id):
    scan = db.session.get(Scan, scan_id)
    if not scan:
        return jsonify({"error": "scan not found"}), 404
    Vulnerability.query.filter_by(scan_id=scan_id).delete()
    db.session.delete(scan)
    db.session.commit()
    return jsonify({"deleted": scan_id})


# ── PATCH /api/scan/<id>/cancel ── cancel a running scan ─────────────────────
@scan_bp.route("/api/scan/<int:scan_id>/cancel", methods=["PATCH"])
def cancel_scan(scan_id):
    scan = db.session.get(Scan, scan_id)
    if not scan:
        return jsonify({"error": "scan not found"}), 404
    if scan.status not in ("queued", "running"):
        return jsonify({"error": f"Cannot cancel scan in state: {scan.status}"}), 400
    scan.status   = "cancelled"
    scan.phase    = "cancelled by user"
    scan.end_time = datetime.utcnow()
    db.session.commit()
    return jsonify({"cancelled": scan_id})


# ── Helper ─────────────────────────────────────────────────────────────────────
def _scan_dict(s) -> dict:
    return {
        "id":             s.id,
        "target":         s.target,
        "mode":           getattr(s, "mode", "fast"),
        "status":         s.status,
        "progress":       s.progress,
        "phase":          s.phase,
        "total_vulns":    getattr(s, "total_vulns", 0),
        "critical_count": getattr(s, "critical_count", 0),
        "high_count":     getattr(s, "high_count", 0),
        "start_time":     s.start_time.isoformat() if s.start_time else None,
        "end_time":       s.end_time.isoformat()   if s.end_time   else None,
    }














