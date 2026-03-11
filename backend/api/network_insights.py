from flask import Blueprint, jsonify
from models import db, VM, Vulnerability, Scan

insights_bp = Blueprint("insights", __name__, url_prefix="/api")


# ----------------------------
# NETWORK INSIGHTS
# ----------------------------
@insights_bp.route("/network/insights", methods=["GET"])
def get_network_insights():

    total_hosts = VM.query.count()

    vulns = Vulnerability.query.all()

    total_vulns = len(vulns)

    total_ports = len([v for v in vulns if v.port])

    services = {}

    for v in vulns:
        if v.service:
            services[v.service] = services.get(v.service, 0) + 1

    top_services = sorted(services.items(), key=lambda x: x[1], reverse=True)[:5]

    risk_score = sum([(v.risk_score or 0) for v in vulns])

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
            "start_time": s.start_time,
            "end_time": s.end_time
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
            "progress": s.progress
        }
        for s in scans
    ])


# ----------------------------
# VULNERABILITIES BY SEVERITY
# ----------------------------
@insights_bp.route("/vulnerabilities/by-severity", methods=["GET"])
def vulns_by_severity():

    vulns = Vulnerability.query.all()

    severity = {
        "low": 0,
        "medium": 0,
        "high": 0,
        "critical": 0
    }

    for v in vulns:

        score = v.risk_score or 0

        if score <= 5:
            severity["low"] += 1
        elif score <= 10:
            severity["medium"] += 1
        elif score <= 15:
            severity["high"] += 1
        else:
            severity["critical"] += 1

    return jsonify(severity)