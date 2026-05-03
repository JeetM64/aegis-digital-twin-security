from flask import Blueprint, jsonify, request
from datetime import datetime

from models import db, Scan, Vulnerability

scan_bp = Blueprint("scan", __name__)


# ── GET /api/scans ── list all scans ─────────────────────────────────────────
@scan_bp.route("/api/scans", methods=["GET"])
def list_scans():
    limit  = min(int(request.args.get("limit", 50)), 200)
    offset = int(request.args.get("offset", 0))
    status = request.args.get("status")

    q = Scan.query.order_by(Scan.id.desc())
    if status:
        q = q.filter_by(status=status)

    scans = q.offset(offset).limit(limit).all()

    # Return plain array — frontend expects this format
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

    severity    = request.args.get("severity")
    page        = int(request.args.get("page", 1))
    per_page    = min(int(request.args.get("per_page", 50)), 200)
    sort_by     = request.args.get("sort", "risk_score")
    exploitable = request.args.get("exploitable")

    q = Vulnerability.query.filter_by(scan_id=scan_id)
    if severity:
        q = q.filter(db.func.lower(Vulnerability.severity) == severity.lower())
    if exploitable == "true":
        q = q.filter_by(exploit_available=True)

    if sort_by == "cvss_score":
        q = q.order_by(Vulnerability.cvss_score.desc())
    elif sort_by == "severity":
        q = q.order_by(Vulnerability.severity.asc())
    else:
        q = q.order_by(Vulnerability.risk_score.desc())

    total = q.count()
    vulns = q.offset((page - 1) * per_page).limit(per_page).all()

    # Severity counts for ALL vulns in this scan
    severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for v in Vulnerability.query.filter_by(scan_id=scan_id).all():
        sev = (v.severity or "").lower()
        if sev in severity_counts:
            severity_counts[sev] += 1

    return jsonify({
        "scan_id":         scan_id,
        "total":           total,
        "page":            page,
        "per_page":        per_page,
        "severity_counts": severity_counts,
        "vulnerabilities": [v.to_dict() for v in vulns],
    })


# ── GET /api/scan/<id>/summary ────────────────────────────────────────────────
@scan_bp.route("/api/scan/<int:scan_id>/summary", methods=["GET"])
def get_scan_summary(scan_id):
    scan = db.session.get(Scan, scan_id)
    if not scan:
        return jsonify({"error": "scan not found"}), 404

    vulns = Vulnerability.query.filter_by(scan_id=scan_id).all()
    severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    exploitable = 0
    for v in vulns:
        sev = (v.severity or "").lower()
        if sev in severity_counts:
            severity_counts[sev] += 1
        if v.exploit_available:
            exploitable += 1

    return jsonify({
        **_scan_dict(scan),
        "severity_counts": severity_counts,
        "exploitable":     exploitable,
        "total_vulns":     len(vulns),
    })


# ── DELETE /api/scan/<id> ─────────────────────────────────────────────────────
@scan_bp.route("/api/scan/<int:scan_id>", methods=["DELETE"])
def delete_scan(scan_id):
    scan = db.session.get(Scan, scan_id)
    if not scan:
        return jsonify({"error": "scan not found"}), 404
    Vulnerability.query.filter_by(scan_id=scan_id).delete()
    db.session.delete(scan)
    db.session.commit()
    return jsonify({"deleted": scan_id})


# ── PATCH /api/scan/<id>/cancel ──────────────────────────────────────────────
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


# ── Helper ────────────────────────────────────────────────────────────────────
def _scan_dict(s) -> dict:
    if hasattr(s, "to_dict"):
        return s.to_dict()
    return {
        "id":                s.id,
        "target":            s.target,
        "mode":              getattr(s, "mode", "fast"),
        "status":            s.status,
        "progress":          s.progress,
        "phase":             s.phase,
        "is_twin_scan":      getattr(s, "is_twin_scan", False),
        "total_vulns":       getattr(s, "total_vulns", 0),
        "critical_count":    getattr(s, "critical_count", 0),
        "high_count":        getattr(s, "high_count", 0),
        "medium_count":      getattr(s, "medium_count", 0),
        "low_count":         getattr(s, "low_count", 0),
        "exploitable_count": getattr(s, "exploitable_count", 0),
        "start_time":        s.start_time.isoformat() if s.start_time else None,
        "end_time":          s.end_time.isoformat()   if s.end_time   else None,
    }