from flask import Blueprint, jsonify
from models import db, VM, Vulnerability, Scan
from sqlalchemy import func
 
insights_bp = Blueprint("insights", __name__, url_prefix="/api")
 
 
# ----------------------------
# NETWORK INSIGHTS
# ----------------------------
@insights_bp.route("/network/insights", methods=["GET"])
def get_network_insights():
 
    total_hosts = VM.query.count()
 
    vulns = (
        Vulnerability.query
        .distinct(Vulnerability.port, Vulnerability.service)
        .all()
    )
 
    total_vulns = len(vulns)
    total_ports = len([v for v in vulns if v.port])
 
    services = {}
    for v in vulns:
        if v.service:
            services[v.service] = services.get(v.service, 0) + 1
 
    top_services = sorted(services.items(), key=lambda x: x[1], reverse=True)[:5]
    risk_score   = sum([(v.risk_score or 0) for v in vulns])
 
    return jsonify({
        "total_hosts": total_hosts,
        "total_ports": total_ports,
        "total_vulnerabilities": total_vulns,
        "risk_score": risk_score,
        "top_services": [
            {"name": s[0], "count": s[1]} for s in top_services
        ]
    })
 
 
# ----------------------------
# ALL SCANS
# ----------------------------
@insights_bp.route("/scans", methods=["GET"])
def get_scans():
 
    scans = Scan.query.order_by(Scan.start_time.desc()).all()
 
    return jsonify([
        {
            "id": s.id,
            "target": s.target,
            "status": s.status,
            "progress": s.progress,
            "start_time": str(s.start_time) if s.start_time else None,
            "end_time":   str(s.end_time)   if s.end_time   else None,
        }
        for s in scans
    ])
 
 
# ----------------------------
# RECENT SCANS
# ----------------------------
@insights_bp.route("/scans/recent", methods=["GET"])
def recent_scans():
 
    scans = Scan.query.order_by(Scan.start_time.desc()).limit(5).all()
 
    return jsonify([
        {
            "id": s.id,
            "target": s.target,
            "status": s.status,
            "progress": s.progress,
        }
        for s in scans
    ])
 
 
# ----------------------------
# VULNERABILITIES BY SEVERITY
# ----------------------------
@insights_bp.route("/vulnerabilities/by-severity", methods=["GET"])
def vulns_by_severity():
 
    vulns = (
        Vulnerability.query
        .distinct(Vulnerability.port, Vulnerability.service)
        .all()
    )
 
    severity = {"low": 0, "medium": 0, "high": 0, "critical": 0}
 
    for v in vulns:
        sev = (v.severity or "").lower()
        if sev in severity:
            severity[sev] += 1
        else:
            score = v.risk_score or 0
            if score <= 5:       severity["low"]      += 1
            elif score <= 10:    severity["medium"]   += 1
            elif score <= 15:    severity["high"]     += 1
            else:                severity["critical"] += 1
 
    return jsonify(severity)
 
 
# ----------------------------
# TOP VULNERABILITIES (for dashboard)
# Now includes real CVE IDs + CVSS scores
# ----------------------------
@insights_bp.route("/top-vulnerabilities", methods=["GET"])
def top_vulnerabilities():
 
    # Get ALL vulns ordered by risk score descending
    vulns = (
        Vulnerability.query
        .order_by(Vulnerability.risk_score.desc())
        .all()
    )
 
    # Deduplicate — keep only the HIGHEST risk score per port+service combination
    # This prevents same service from multiple scans showing multiple times
    best = {}
    for v in vulns:
        key = (v.port, (v.service or '').lower())
        if key not in best:
            best[key] = v
        else:
            # Keep whichever has higher risk score
            if (v.risk_score or 0) > (best[key].risk_score or 0):
                best[key] = v
 
    # Sort by risk score and take top 10
    sorted_vulns = sorted(best.values(), key=lambda v: v.risk_score or 0, reverse=True)[:10]
 
    result = []
    for v in sorted_vulns:
        cve_list = []
        if v.cve_ids:
            cve_list = [c.strip() for c in v.cve_ids.split(",") if c.strip()]
 
        top_cve = cve_list[0] if cve_list else None
 
        result.append({
            "id":          v.id,
            "port":        v.port,
            "service":     v.service,
            "severity":    v.severity,
            "cvss_score":  v.cvss_score,
            "risk_score":  v.risk_score,
            "cve_ids":     v.cve_ids,
            "cve_list":    cve_list,
            "top_cve":     top_cve,
            "cve_count":   v.cve_count or len(cve_list),
            "description": v.description,
        })
 
    return jsonify({"top_vulnerabilities": result})