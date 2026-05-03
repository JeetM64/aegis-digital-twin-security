from flask import Blueprint, jsonify, request
from models import db, VM, Vulnerability, Scan
from sqlalchemy import func, case

insights_bp = Blueprint("insights", __name__, url_prefix="/api")


# ── GET /api/network/insights ────────────────────────────────────────────────
@insights_bp.route("/network/insights", methods=["GET"])
def get_network_insights():
    total_hosts = VM.query.count()
    total_vulns = Vulnerability.query.count()
    total_ports = db.session.query(
        func.count(func.distinct(Vulnerability.port))
    ).scalar() or 0

    service_counts = (
        db.session.query(
            Vulnerability.service,
            func.count(Vulnerability.id).label("count")
        )
        .filter(Vulnerability.service.isnot(None))
        .group_by(Vulnerability.service)
        .order_by(func.count(Vulnerability.id).desc())
        .limit(5)
        .all()
    )

    avg_risk    = db.session.query(func.avg(Vulnerability.risk_score)).scalar() or 0
    exploitable = Vulnerability.query.filter_by(exploit_available=True).count()

    return jsonify({
        "total_hosts":           total_hosts,
        "total_ports":           total_ports,
        "total_vulnerabilities": total_vulns,
        "exploitable":           exploitable,
        "avg_risk_score":        round(float(avg_risk), 2),
        "top_services": [
            {"name": s.service, "count": s.count}
            for s in service_counts
        ],
    })


# ── GET /api/scans/recent ─────────────────────────────────────────────────────
@insights_bp.route("/scans/recent", methods=["GET"])
def recent_scans():
    limit = min(int(request.args.get("limit", 5)), 20)
    scans = (
        Scan.query
        .order_by(Scan.start_time.desc())
        .limit(limit)
        .all()
    )
    return jsonify([s.to_dict() for s in scans])


# ── GET /api/vulnerabilities/by-severity ─────────────────────────────────────
@insights_bp.route("/vulnerabilities/by-severity", methods=["GET"])
def vulns_by_severity():
    result = db.session.query(
        func.lower(Vulnerability.severity).label("sev"),
        func.count(Vulnerability.id).label("count")
    ).group_by(func.lower(Vulnerability.severity)).all()

    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for row in result:
        sev = (row.sev or "low").strip()
        if sev in counts:
            counts[sev] = row.count

    return jsonify(counts)


# ── GET /api/top-vulnerabilities ─────────────────────────────────────────────
@insights_bp.route("/top-vulnerabilities", methods=["GET"])
def top_vulnerabilities():
    limit = min(int(request.args.get("limit", 10)), 50)

    vulns = (
        Vulnerability.query
        .order_by(Vulnerability.risk_score.desc())
        .all()
    )

    best = {}
    for v in vulns:
        key = (v.port, (v.service or "").lower())
        if key not in best or (v.risk_score or 0) > (best[key].risk_score or 0):
            best[key] = v

    sorted_vulns = sorted(
        best.values(),
        key=lambda v: v.risk_score or 0,
        reverse=True
    )[:limit]

    result = []
    for v in sorted_vulns:
        cve_list = [c.strip() for c in (v.cve_ids or "").split(",") if c.strip()]
        result.append({
            "id":                v.id,
            "scan_id":           v.scan_id,
            "port":              v.port,
            "service":           v.service,
            "severity":          v.severity,
            "cvss_score":        v.cvss_score,
            "risk_score":        round(v.risk_score, 2) if v.risk_score else 0,
            "cve_ids":           v.cve_ids,
            "cve_list":          cve_list,
            "top_cve":           cve_list[0] if cve_list else None,
            "cve_count":         v.cve_count or len(cve_list),
            "description":       v.description,
            "exploit_available": v.exploit_available,
            "remediation":       v.remediation,
        })

    return jsonify({
        "top_vulnerabilities": result,
        "total": len(best),
    })


# ── GET /api/vulnerabilities/trend ───────────────────────────────────────────
@insights_bp.route("/vulnerabilities/trend", methods=["GET"])
def vuln_trend():
    scans = (
        Scan.query
        .filter_by(status="completed")
        .order_by(Scan.start_time.desc())
        .limit(10)
        .all()
    )

    trend = []
    for s in reversed(scans):
        trend.append({
            "scan_id":     s.id,
            "target":      s.target,
            "date":        s.start_time.strftime("%Y-%m-%d") if s.start_time else "",
            "total":       s.total_vulns or 0,
            "critical":    s.critical_count or 0,
            "high":        s.high_count or 0,
            "medium":      getattr(s, "medium_count", 0) or 0,
            "low":         getattr(s, "low_count", 0) or 0,
            "exploitable": getattr(s, "exploitable_count", 0) or 0,
        })

    return jsonify({"trend": trend})


# ── GET /api/vulnerabilities/by-service ──────────────────────────────────────
@insights_bp.route("/vulnerabilities/by-service", methods=["GET"])
def vulns_by_service():
    limit = min(int(request.args.get("limit", 10)), 20)

    rows = (
        db.session.query(
            Vulnerability.service,
            func.count(Vulnerability.id).label("total"),
            func.sum(case(
                (func.lower(Vulnerability.severity) == "critical", 1), else_=0
            )).label("critical"),
            func.sum(case(
                (func.lower(Vulnerability.severity) == "high", 1), else_=0
            )).label("high"),
            func.avg(Vulnerability.cvss_score).label("avg_cvss"),
        )
        .filter(Vulnerability.service.isnot(None))
        .group_by(Vulnerability.service)
        .order_by(func.count(Vulnerability.id).desc())
        .limit(limit)
        .all()
    )

    return jsonify({
        "by_service": [
            {
                "service":  r.service,
                "total":    r.total,
                "critical": r.critical or 0,
                "high":     r.high or 0,
                "avg_cvss": round(float(r.avg_cvss or 0), 2),
            }
            for r in rows
        ]
    })