import json
import datetime
from flask import Blueprint, jsonify, request
from models import db, VM, Vulnerability, Scan, DigitalTwin

vm_bp = Blueprint("vm", __name__)


# ── GET /api/vms ──────────────────────────────────────────────────────────────
@vm_bp.route("/api/vms", methods=["GET"])
def get_vms():
    vms    = VM.query.order_by(VM.id.desc()).all()
    result = []
    for vm in vms:
        twin = DigitalTwin.query.filter_by(vm_id=vm.id).first()
        result.append({
            **vm.to_dict(),
            "vuln_counts": _vuln_counts(vm.id),
            "twin":        twin.to_dict() if twin else None,
        })
    return jsonify({"vms": result, "total": len(result)})


# ── GET /api/vm/<id> ──────────────────────────────────────────────────────────
@vm_bp.route("/api/vm/<int:vm_id>", methods=["GET"])
def get_vm(vm_id):
    vm = db.session.get(VM, vm_id)
    if not vm:
        return jsonify({"error": "VM not found"}), 404
    vulns = (
        Vulnerability.query
        .filter_by(vm_id=vm_id)
        .order_by(Vulnerability.risk_score.desc())
        .all()
    )
    twin = DigitalTwin.query.filter_by(vm_id=vm_id).first()
    return jsonify({
        **vm.to_dict(),
        "vuln_counts":     _vuln_counts(vm_id),
        "vulnerabilities": [v.to_dict() for v in vulns],
        "twin":            twin.to_dict() if twin else None,
    })


# ── PATCH /api/vm/<id> ────────────────────────────────────────────────────────
@vm_bp.route("/api/vm/<int:vm_id>", methods=["PATCH"])
def update_vm(vm_id):
    vm = db.session.get(VM, vm_id)
    if not vm:
        return jsonify({"error": "VM not found"}), 404
    data = request.get_json(force=True, silent=True) or {}
    for field in ("hostname", "os", "os_family", "status"):
        if field in data:
            setattr(vm, field, data[field])
    db.session.commit()
    return jsonify(vm.to_dict())


# ── DELETE /api/vm/<id> ───────────────────────────────────────────────────────
@vm_bp.route("/api/vm/<int:vm_id>", methods=["DELETE"])
def delete_vm(vm_id):
    vm = db.session.get(VM, vm_id)
    if not vm:
        return jsonify({"error": "VM not found"}), 404
    DigitalTwin.query.filter_by(vm_id=vm_id).delete()
    Vulnerability.query.filter_by(vm_id=vm_id).delete()
    db.session.delete(vm)
    db.session.commit()
    return jsonify({"deleted": vm_id})


# ── GET /api/vm/<id>/vulnerabilities ─────────────────────────────────────────
@vm_bp.route("/api/vm/<int:vm_id>/vulnerabilities", methods=["GET"])
def get_vm_vulnerabilities(vm_id):
    vm = db.session.get(VM, vm_id)
    if not vm:
        return jsonify({"error": "VM not found"}), 404

    sev  = request.args.get("severity")
    page = int(request.args.get("page", 1))
    per  = min(int(request.args.get("per_page", 50)), 200)

    q = Vulnerability.query.filter_by(vm_id=vm_id)
    if sev:
        q = q.filter(db.func.lower(Vulnerability.severity) == sev.lower())

    total = q.count()
    vulns = (
        q.order_by(Vulnerability.risk_score.desc())
        .offset((page - 1) * per)
        .limit(per)
        .all()
    )
    return jsonify({
        "vm_id":           vm_id,
        "total":           total,
        "page":            page,
        "per_page":        per,
        "vuln_counts":     _vuln_counts(vm_id),
        "vulnerabilities": [v.to_dict() for v in vulns],
    })


# ── GET /api/assets/summary ───────────────────────────────────────────────────
@vm_bp.route("/api/assets/summary", methods=["GET"])
def assets_summary():
    vms = VM.query.all()
    summary = {
        "total":     len(vms),
        "critical":  0,
        "high":      0,
        "medium":    0,
        "low":       0,
        "clean":     0,
        "with_twin": 0,
    }
    for vm in vms:
        level = (vm.risk_level or "").upper()
        if level in ("CRITICAL", "HIGH", "MEDIUM", "LOW"):
            summary[level.lower()] += 1
        else:
            summary["clean"] += 1
        if vm.has_twin:
            summary["with_twin"] += 1
    return jsonify(summary)


# ═════════════════════════════════════════════════════════════════════════════
#  DIGITAL TWIN ENDPOINTS
# ═════════════════════════════════════════════════════════════════════════════

@vm_bp.route("/api/twin/create/<int:vm_id>", methods=["POST"])
def create_twin(vm_id):
    vm = db.session.get(VM, vm_id)
    if not vm:
        return jsonify({"error": "VM not found"}), 404

    existing = DigitalTwin.query.filter_by(vm_id=vm_id).first()
    if existing:
        return jsonify({"error": "Digital twin already exists", "twin": existing.to_dict()}), 409

    vulns      = Vulnerability.query.filter_by(vm_id=vm_id).all()
    ports      = []
    seen_ports = set()
    for v in vulns:
        if v.port and v.port not in seen_ports:
            seen_ports.add(v.port)
            ports.append({
                "port":     v.port,
                "service":  v.service or "unknown",
                "version":  v.version or "",
                "protocol": v.protocol or "tcp",
            })

    twin = DigitalTwin(
        vm_id           = vm_id,
        ip_address      = vm.ip_address,
        hostname        = vm.hostname,
        os              = vm.os,
        open_ports_json = json.dumps(ports),
        status          = "active",
        risk_level      = vm.risk_level,
        sync_count      = 1,
    )
    db.session.add(twin)
    vm.has_twin = True
    db.session.commit()

    return jsonify({
        "message":        f"Digital Twin created for {vm.ip_address}",
        "twin":           twin.to_dict(),
        "ports_captured": len(ports),
    }), 201


@vm_bp.route("/api/twin/sync/<int:vm_id>", methods=["POST"])
def sync_twin(vm_id):
    vm   = db.session.get(VM, vm_id)
    twin = DigitalTwin.query.filter_by(vm_id=vm_id).first()

    if not vm:
        return jsonify({"error": "VM not found"}), 404
    if not twin:
        return jsonify({"error": "No digital twin found. Create one first."}), 404

    vulns      = Vulnerability.query.filter_by(vm_id=vm_id).all()
    ports      = []
    seen_ports = set()
    for v in vulns:
        if v.port and v.port not in seen_ports:
            seen_ports.add(v.port)
            ports.append({
                "port":     v.port,
                "service":  v.service or "unknown",
                "version":  v.version or "",
                "protocol": v.protocol or "tcp",
            })

    twin.ip_address      = vm.ip_address
    twin.hostname        = vm.hostname
    twin.os              = vm.os
    twin.open_ports_json = json.dumps(ports)
    twin.risk_level      = vm.risk_level
    twin.status          = "active"
    twin.last_synced     = datetime.datetime.utcnow()
    twin.sync_count      = (twin.sync_count or 0) + 1
    db.session.commit()

    return jsonify({
        "message":        f"Digital Twin synced for {vm.ip_address}",
        "twin":           twin.to_dict(),
        "ports_captured": len(ports),
    })


@vm_bp.route("/api/twin/scan/<int:vm_id>", methods=["POST"])
def scan_twin(vm_id):
    import threading
    from flask import current_app

    twin = DigitalTwin.query.filter_by(vm_id=vm_id).first()
    if not twin:
        return jsonify({"error": "No digital twin found. Create one first."}), 404

    try:
        ports = json.loads(twin.open_ports_json or "[]")
    except Exception:
        ports = []

    if not ports:
        return jsonify({"error": "Digital twin has no port data. Sync it first."}), 400

    scan = Scan(
        target       = f"[TWIN] {twin.ip_address}",
        mode         = "twin",
        status       = "queued",
        progress     = 0,
        phase        = "queued",
        eta          = "~1 min (virtual)",
        is_twin_scan = True,
        start_time   = datetime.datetime.utcnow(),
    )
    db.session.add(scan)
    db.session.commit()
    scan_id = scan.id

    app = current_app._get_current_object()

    def worker():
        with app.app_context():
            _run_twin_scan(scan_id, twin, ports)

    threading.Thread(target=worker, daemon=True).start()

    return jsonify({
        "scan_id": scan_id,
        "target":  f"[TWIN] {twin.ip_address}",
        "mode":    "twin",
        "message": "Virtual twin scan started — no packets sent to real network",
        "ports":   len(ports),
    }), 202


@vm_bp.route("/api/twins", methods=["GET"])
def list_twins():
    twins = DigitalTwin.query.all()
    return jsonify({"twins": [t.to_dict() for t in twins], "total": len(twins)})


@vm_bp.route("/api/twin/<int:vm_id>", methods=["DELETE"])
def delete_twin(vm_id):
    twin = DigitalTwin.query.filter_by(vm_id=vm_id).first()
    if not twin:
        return jsonify({"error": "Twin not found"}), 404
    vm = db.session.get(VM, vm_id)
    if vm:
        vm.has_twin = False
    db.session.delete(twin)
    db.session.commit()
    return jsonify({"deleted": vm_id})


# ═════════════════════════════════════════════════════════════════════════════
#  Twin Scan Engine
# ═════════════════════════════════════════════════════════════════════════════

def _run_twin_scan(scan_id: int, twin, ports: list):
    import logging
    from scanner.cve_parser import fetch_cves_for_service
    from ml.risk_model import predict_risk
    from ai.prioritization import prioritize_vulnerabilities

    logger = logging.getLogger(__name__)

    # FIX: was db.session.get(scan, scan_id) — wrong model reference
    scan = db.session.get(Scan, scan_id)
    if not scan:
        return

    try:
        _scan_update(scan, status="running", phase="initialising virtual twin", progress=5)

        total        = len(ports)
        AUTH_REQUIRED = {3306, 5432, 1433, 1521, 27017, 6379, 9200}

        _scan_update(scan, phase="analysing virtual ports", progress=20)

        for i, port_info in enumerate(ports):
            port    = int(port_info.get("port", 0))
            service = port_info.get("service", "unknown")
            version = port_info.get("version", "")

            if not port:
                continue

            try:
                cves = fetch_cves_for_service(service, version, max_results=3)
                cvss = max(
                    (c["cvss_score"] for c in cves if c.get("cvss_score")),
                    default=_heuristic_cvss(port, service)
                )

                # FIX: predict_risk already returns [0,20] — don't multiply again
                risk_score = predict_risk(
                    port           = port,
                    cvss           = cvss,
                    service        = service,
                    cve_count      = len(cves),
                    exploit_found  = False,
                    misconfig      = False,
                    network_depth  = 1,
                    critical_asset = port in AUTH_REQUIRED,
                    patch_age      = 2.0,
                )
                severity  = _cvss_to_severity(cvss)
                cve_ids   = ",".join(c["cve_id"] for c in cves[:5])

                existing = Vulnerability.query.filter_by(
                    scan_id=scan_id, port=port, service=service
                ).first()

                if existing:
                    existing.cvss_score = cvss
                    existing.risk_score = round(risk_score, 2)
                    existing.severity   = severity
                    existing.cve_ids    = cve_ids
                    existing.cve_count  = len(cves)
                    existing.from_twin  = True
                else:
                    vuln = Vulnerability(
                        scan_id     = scan_id,
                        vm_id       = twin.vm_id,
                        port        = port,
                        service     = service,
                        version     = version,
                        severity    = severity,
                        cvss_score  = cvss,
                        risk_score  = round(risk_score, 2),
                        cve_ids     = cve_ids,
                        cve_count   = len(cves),
                        from_twin   = True,
                        description = f"[Digital Twin] Virtual scan of {service}:{port}",
                    )
                    db.session.add(vuln)

                db.session.commit()

            except Exception as e:
                logger.warning("Twin port %s error: %s", port, e)

            progress = 20 + int(((i + 1) / total) * 60)
            _scan_update(scan, progress=min(progress, 80))

        _scan_update(scan, phase="running AI prioritization", progress=85)

        vulns  = Vulnerability.query.filter_by(scan_id=scan_id).all()
        ranked = prioritize_vulnerabilities(vulns)
        for (v, score) in ranked:
            v.risk_score = round(score, 2)
        db.session.commit()

        # Update scan counts
        scan.total_vulns      = len(vulns)
        scan.critical_count   = sum(1 for v in vulns if (v.severity or "").lower() == "critical")
        scan.high_count       = sum(1 for v in vulns if (v.severity or "").lower() == "high")
        scan.medium_count     = sum(1 for v in vulns if (v.severity or "").lower() == "medium")
        scan.low_count        = sum(1 for v in vulns if (v.severity or "").lower() == "low")
        scan.exploitable_count = sum(1 for v in vulns if v.exploit_available)

        # Update twin risk level
        severities = [(v.severity or "").lower() for v in vulns]
        if "critical" in severities:   twin.risk_level = "CRITICAL"
        elif "high" in severities:     twin.risk_level = "HIGH"
        elif "medium" in severities:   twin.risk_level = "MEDIUM"
        else:                          twin.risk_level = "LOW"
        twin.last_synced = datetime.datetime.utcnow()

        scan.status   = "completed"
        scan.progress = 100
        scan.phase    = "completed (virtual twin)"
        scan.end_time = datetime.datetime.utcnow()
        db.session.commit()

        logger.info("Twin scan %s completed — %d vulns", scan_id, len(vulns))

    except Exception as e:
        logger.exception("Twin scan %s failed: %s", scan_id, e)
        scan.status   = "failed"
        scan.phase    = f"failed: {str(e)[:200]}"
        scan.end_time = datetime.datetime.utcnow()
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()


def _scan_update(scan, **kwargs):
    for k, v in kwargs.items():
        setattr(scan, k, v)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()


def _heuristic_cvss(port: int, service: str) -> float:
    svc = (service or "unknown").lower()
    table = {
        "mysql": 7.2, "postgresql": 7.0, "mssql": 7.2, "oracle": 7.2,
        "http": 6.1, "https": 5.5, "ssh": 5.0, "ftp": 7.5,
        "rdp": 8.8, "smb": 9.0, "telnet": 9.8, "vnc": 8.5,
        "redis": 8.0, "mongodb": 7.5, "elasticsearch": 7.5,
    }
    return table.get(svc, 4.0)


def _cvss_to_severity(score: float) -> str:
    if score >= 9.0: return "critical"
    if score >= 7.0: return "high"
    if score >= 4.0: return "medium"
    return "low"


# ── Helper: efficient DB-level counts ────────────────────────────────────────
def _vuln_counts(vm_id: int) -> dict:
    """Use DB aggregation instead of loading all vulns into memory."""
    from sqlalchemy import func, case

    result = db.session.query(
        func.count(Vulnerability.id).label("total"),
        func.sum(
            case((func.lower(Vulnerability.severity) == "critical", 1), else_=0)
        ).label("critical"),
        func.sum(
            case((func.lower(Vulnerability.severity) == "high", 1), else_=0)
        ).label("high"),
        func.sum(
            case((func.lower(Vulnerability.severity) == "medium", 1), else_=0)
        ).label("medium"),
        func.sum(
            case((func.lower(Vulnerability.severity) == "low", 1), else_=0)
        ).label("low"),
    ).filter(Vulnerability.vm_id == vm_id).one()

    return {
        "total":    result.total    or 0,
        "critical": result.critical or 0,
        "high":     result.high     or 0,
        "medium":   result.medium   or 0,
        "low":      result.low      or 0,
    }