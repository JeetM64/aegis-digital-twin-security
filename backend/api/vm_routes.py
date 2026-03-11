from flask import Blueprint, jsonify, request
import datetime

from models import db, VM, Vulnerability

vm_bp = Blueprint("vm", __name__)


# ── GET /api/vms ── list all discovered assets ────────────────────────────────
@vm_bp.route("/api/vms", methods=["GET"])
def get_vms():
    vms = VM.query.order_by(VM.id.desc()).all()

    result = []
    for vm in vms:
        # Count vulns per VM
        vuln_counts = _vuln_counts(vm.id)
        result.append({
            "id":          vm.id,
            "ip_address":  vm.ip_address,
            "hostname":    vm.hostname or vm.ip_address,
            "os":          vm.os or "Unknown",
            "os_family":   vm.os_family or "Unknown",
            "status":      vm.status or "active",
            "risk_level":  vm.risk_level or "UNKNOWN",
            "last_seen":   vm.last_seen.isoformat() if vm.last_seen else None,
            "vuln_counts": vuln_counts,
        })

    return jsonify({"vms": result, "total": len(result)})


# ── GET /api/vm/<id> ── single VM detail ──────────────────────────────────────
@vm_bp.route("/api/vm/<int:vm_id>", methods=["GET"])
def get_vm(vm_id):
    vm = db.session.get(VM, vm_id)
    if not vm:
        return jsonify({"error": "VM not found"}), 404

    vulns = Vulnerability.query.filter_by(vm_id=vm_id)\
                .order_by(Vulnerability.risk_score.desc()).all()

    return jsonify({
        **vm.to_dict(),
        "vuln_counts":    _vuln_counts(vm_id),
        "vulnerabilities": [v.to_dict() for v in vulns],
    })


# ── PATCH /api/vm/<id> ── update VM metadata ──────────────────────────────────
@vm_bp.route("/api/vm/<int:vm_id>", methods=["PATCH"])
def update_vm(vm_id):
    vm = db.session.get(VM, vm_id)
    if not vm:
        return jsonify({"error": "VM not found"}), 404

    data = request.get_json(force=True, silent=True) or {}
    allowed = ("hostname", "os", "os_family", "status")
    for field in allowed:
        if field in data:
            setattr(vm, field, data[field])

    db.session.commit()
    return jsonify(vm.to_dict())


# ── DELETE /api/vm/<id> ── remove a VM ───────────────────────────────────────
@vm_bp.route("/api/vm/<int:vm_id>", methods=["DELETE"])
def delete_vm(vm_id):
    vm = db.session.get(VM, vm_id)
    if not vm:
        return jsonify({"error": "VM not found"}), 404
    Vulnerability.query.filter_by(vm_id=vm_id).delete()
    db.session.delete(vm)
    db.session.commit()
    return jsonify({"deleted": vm_id})


# ── GET /api/vm/<id>/vulnerabilities ── all vulns for one VM ──────────────────
@vm_bp.route("/api/vm/<int:vm_id>/vulnerabilities", methods=["GET"])
def get_vm_vulnerabilities(vm_id):
    vm = db.session.get(VM, vm_id)
    if not vm:
        return jsonify({"error": "VM not found"}), 404

    severity_filter = request.args.get("severity")
    status_filter   = request.args.get("status")

    q = Vulnerability.query.filter_by(vm_id=vm_id)
    if severity_filter:
        q = q.filter_by(severity=severity_filter.lower())
    if status_filter:
        q = q.filter_by(remediation_status=status_filter)

    vulns = q.order_by(Vulnerability.risk_score.desc()).all()
    return jsonify({
        "vm_id":           vm_id,
        "total":           len(vulns),
        "vulnerabilities": [v.to_dict() for v in vulns],
    })


# ── GET /api/assets/summary ── grouped severity overview ─────────────────────
@vm_bp.route("/api/assets/summary", methods=["GET"])
def assets_summary():
    vms = VM.query.all()
    summary = {
        "total":    len(vms),
        "critical": 0,
        "high":     0,
        "medium":   0,
        "low":      0,
        "clean":    0,
    }
    for vm in vms:
        level = (vm.risk_level or "").upper()
        if level in summary:
            summary[level.lower()] += 1
        else:
            summary["clean"] += 1
    return jsonify(summary)


# ── Helper ────────────────────────────────────────────────────────────────────
def _vuln_counts(vm_id: int) -> dict:
    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "total": 0}
    vulns = Vulnerability.query.filter_by(vm_id=vm_id).all()
    for v in vulns:
        sev = (v.severity or "low").lower()
        if sev in counts:
            counts[sev] += 1
        counts["total"] += 1
    return counts














