import logging
from datetime import datetime
from typing import Optional
 
from models import db, Scan, Vulnerability, VM
 
from scanner.nmap_runner  import build_nmap_cmd, run_nmap_and_capture_xml
from scanner.xml_parser   import parse_nmap_xml
from scanner.cve_parser   import (
    extract_cves_from_text,
    enrich_cves,
    fetch_cves_for_service,
)
from ml.risk_model import predict_risk, SERVICE_RISK_MAP, INTERNET_PORTS
from ai.prioritization import prioritize_vulnerabilities
 
logger = logging.getLogger(__name__)
 
OPEN_BY_DEFAULT = {21, 23, 25, 53, 80, 2379, 6379, 9200, 11211, 27017}
AUTH_REQUIRED   = {3306, 5432, 1433, 1521, 27017, 6379, 9200, 2379, 11211}
 
 
# ─────────────────────────────────────────────────────────────────────────────
def run_scan(scan_id: int, target: str, mode: str = "fast"):
    scan = db.session.get(Scan, scan_id)
    if not scan:
        logger.error("Scan %s not found", scan_id)
        return
 
    try:
        _update(scan, status="running", phase="initialising", progress=2)
 
        cmd = build_nmap_cmd(target, mode=mode)
        logger.info("[scan %s] nmap cmd: %s", scan_id, " ".join(cmd))
 
        _update(scan, phase="scanning", progress=10)
 
        timeout_map = {"fast": 300, "medium": 600, "deep": 1800}
        rc, xml_output, stderr = run_nmap_and_capture_xml(
            cmd,
            stderr_line_cb=lambda line: logger.debug("[nmap] %s", line),
            timeout=timeout_map.get(mode, 300),
        )
 
        if not xml_output:
            raise RuntimeError(
                f"nmap returned no XML output (rc={rc}). stderr tail:\n{stderr[-500:]}"
            )
 
        _update(scan, phase="parsing results", progress=40)
 
        hosts = parse_nmap_xml(xml_output)
        logger.info("[scan %s] parsed %d host(s)", scan_id, len(hosts))
 
        if not hosts:
            _finish(scan, status="completed", progress=100,
                    phase="completed – no hosts found")
            return
 
        _update(scan, phase="analysing vulnerabilities", progress=55)
 
        total_ports = sum(
            1 for h in hosts
            for p in h.get("ports", [])
            if p.get("state") == "open"
        )
        processed = 0
 
        # Track IPs found in this scan to update VM risk after
        scanned_ips = []
 
        for host in hosts:
            ip       = host.get("ip", target)
            hostname = host.get("hostname") or ip
            os_name  = host.get("os") or "Unknown"
 
            _upsert_vm(ip, hostname, os_name)
            scanned_ips.append(ip)
 
            for port_data in host.get("ports", []):
                if port_data.get("state") != "open":
                    continue
 
                try:
                    _process_port(scan_id, ip, port_data)
                except Exception as e:
                    logger.warning(
                        "[scan %s] port %s processing error: %s",
                        scan_id, port_data.get("port"), e,
                    )
 
                processed += 1
                progress = 55 + int((processed / max(total_ports, 1)) * 35)
                _update(scan, progress=min(progress, 90))
 
        _update(scan, phase="prioritising", progress=92)
        _reprioritize_scan(scan_id)
 
        # ── Update VM risk_level based on scan results ────────────────────────
        _update_vm_risk_levels(scanned_ips, scan_id)
 
        # ── Update scan summary counts ────────────────────────────────────────
        _update_scan_counts(scan, scan_id)
 
        _finish(scan, status="completed", progress=100, phase="completed")
        logger.info("[scan %s] finished successfully", scan_id)
 
    except Exception as e:
        logger.exception("[scan %s] fatal error: %s", scan_id, e)
        scan = db.session.get(Scan, scan_id)
        if scan:
            _finish(scan, status="failed",
                    phase=f"failed: {str(e)[:200]}", progress=scan.progress or 0)
 
 
# ─────────────────────────────────────────────────────────────────────────────
def _process_port(scan_id: int, ip: str, port_data: dict):
    port        = int(port_data["port"])
    svc_info    = port_data.get("service", {})
    service     = svc_info.get("name", "unknown")
    version     = _build_version_string(svc_info)
    scripts     = port_data.get("scripts", {})
 
    script_text = "\n".join(scripts.values())
    cves        = extract_cves_from_text(script_text)
 
    if cves:
        cves = enrich_cves(cves)
    else:
        cves = fetch_cves_for_service(service, version, max_results=3)
 
    cvss          = _best_cvss(cves, port, service)
    exploit_found = _has_exploit(script_text)
    misconfig     = _is_misconfigured(port, service, script_text)
    cve_count     = len(cves)
    cve_ids_str   = ",".join(c["cve_id"] for c in cves[:10])
 
    ml_prob = predict_risk(
        port          = port,
        cvss          = cvss,
        service       = service,
        cve_count     = cve_count,
        exploit_found = exploit_found,
        misconfig     = misconfig,
        network_depth = 0,
        critical_asset= port in AUTH_REQUIRED,
        patch_age     = _estimate_patch_age(version),
    )
    ai_risk_score = round(ml_prob * 20, 2)
    severity      = _cvss_to_severity(cvss)
    description   = _build_description(port, service, version, cves, exploit_found, misconfig)
 
    # ── Deduplication ────────────────────────────────────────────────────────
    existing = Vulnerability.query.filter_by(
        scan_id = scan_id,
        port    = port,
        service = service,
    ).first()
 
    if existing:
        existing.version     = version
        existing.severity    = severity
        existing.description = description
        existing.cvss_score  = cvss
        existing.risk_score  = ai_risk_score
        existing.cve_ids     = cve_ids_str
        existing.cve_count   = cve_count
        db.session.commit()
        return
 
    vuln = Vulnerability(
        scan_id     = scan_id,
        port        = port,
        service     = service,
        version     = version,
        severity    = severity,
        description = description,
        cvss_score  = cvss,
        risk_score  = ai_risk_score,
        cve_ids     = cve_ids_str,
        cve_count   = cve_count,
    )
    db.session.add(vuln)
    db.session.commit()
 
 
# ─────────────────────────────────────────────────────────────────────────────
def _reprioritize_scan(scan_id: int):
    vulns  = Vulnerability.query.filter_by(scan_id=scan_id).all()
    ranked = prioritize_vulnerabilities(vulns)
    for (v, score) in ranked:
        v.risk_score = round(score, 2)
    db.session.commit()
 
 
def _update_vm_risk_levels(ips: list, scan_id: int):
    """
    After scan completes, calculate and set risk_level on each VM
    based on the worst vulnerability severity found.
    """
    for ip in ips:
        vm = VM.query.filter_by(ip_address=ip).first()
        if not vm:
            continue
 
        # Get all vulns for this scan
        vulns = Vulnerability.query.filter_by(scan_id=scan_id).all()
 
        if not vulns:
            vm.risk_level = "LOW"
        else:
            severities = [v.severity for v in vulns if v.severity]
            if "critical" in severities:
                vm.risk_level = "CRITICAL"
            elif "high" in severities:
                vm.risk_level = "HIGH"
            elif "medium" in severities:
                vm.risk_level = "MEDIUM"
            else:
                vm.risk_level = "LOW"
 
        try:
            db.session.commit()
        except Exception as e:
            logger.warning("VM risk_level update failed for %s: %s", ip, e)
            db.session.rollback()
 
 
def _update_scan_counts(scan, scan_id: int):
    """Update summary counts on the scan record."""
    vulns = Vulnerability.query.filter_by(scan_id=scan_id).all()
    scan.total_vulns    = len(vulns)
    scan.critical_count = sum(1 for v in vulns if v.severity == "critical")
    scan.high_count     = sum(1 for v in vulns if v.severity == "high")
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
 
 
def _upsert_vm(ip: str, hostname: str, os_name: str):
    try:
        vm = VM.query.filter_by(ip_address=ip).first()
        if vm:
            vm.hostname = hostname or vm.hostname
            vm.os       = os_name  or vm.os
        else:
            vm = VM(ip_address=ip, hostname=hostname, os=os_name, status="active")
            db.session.add(vm)
        db.session.commit()
    except Exception as e:
        logger.warning("VM upsert failed for %s: %s", ip, e)
        db.session.rollback()
 
 
def _build_version_string(svc_info: dict) -> str:
    parts = [
        svc_info.get("product", ""),
        svc_info.get("version", ""),
        svc_info.get("extrainfo", ""),
    ]
    return " ".join(p for p in parts if p).strip()
 
 
def _best_cvss(cves: list, port: int, service: str) -> float:
    scores = [c["cvss_score"] for c in cves if c.get("cvss_score") is not None]
    if scores:
        return max(scores)
    return _heuristic_cvss(port, service)
 
 
def _heuristic_cvss(port: int, service: str) -> float:
    svc   = (service or "unknown").lower()
    table = {
        "telnet": 9.8, "rsh": 9.8, "rlogin": 9.5,
        "ftp": 7.5, "tftp": 7.0,
        "smb": 9.0, "rdp": 8.8, "vnc": 8.5,
        "redis": 8.0, "memcached": 7.8, "mongodb": 7.5,
        "mysql": 7.2, "mssql": 7.2, "oracle": 7.2, "postgresql": 7.0,
        "elasticsearch": 7.5, "etcd": 7.5,
        "http": 6.1, "https": 5.5,
        "ssh": 5.0, "smtp": 5.5, "dns": 5.3,
        "snmp": 7.5, "ldap": 6.5,
        "unknown": 4.0,
    }
    if svc in table:
        return table[svc]
    if port in {21, 23}:             return 9.0
    if port in {3306, 5432, 1433, 1521}: return 7.5
    if port in {80, 8080}:           return 6.1
    if port in {443, 8443}:          return 5.5
    return 4.0
 
 
def _cvss_to_severity(score: float) -> str:
    if score >= 9.0: return "critical"
    if score >= 7.0: return "high"
    if score >= 4.0: return "medium"
    return "low"
 
 
def _has_exploit(script_text: str) -> bool:
    text = script_text.lower()
    return any(kw in text for kw in (
        "exploit", "rce", "remote code execution",
        "arbitrary command", "buffer overflow", "metasploit",
        "proof of concept", "poc", "shellcode",
    ))
 
 
def _is_misconfigured(port: int, service: str, script_text: str) -> bool:
    text = script_text.lower()
    if port in OPEN_BY_DEFAULT and "anonymous" in text:
        return True
    if "default credential" in text or "default password" in text:
        return True
    if port in AUTH_REQUIRED and "authentication: none" in text:
        return True
    if "misconfigur" in text or "insecure config" in text:
        return True
    return False
 
 
def _estimate_patch_age(version_str: str) -> float:
    import re
    years = re.findall(r'\b(20\d{2}|19\d{2})\b', version_str)
    if years:
        latest = max(int(y) for y in years)
        age    = datetime.utcnow().year - latest
        return float(max(0, min(age, 10)))
    return 2.0
 
 
def _build_description(port, service, version, cves, exploit_found, misconfig) -> str:
    parts = [f"Open port {port}/{service}"]
    if version:
        parts.append(f"version: {version}")
    if exploit_found:
        parts.append("⚠ Known exploit found in scan output")
    if misconfig:
        parts.append("⚠ Possible misconfiguration detected")
    if cves:
        top = cves[0]
        parts.append(
            f"Top CVE: {top['cve_id']} (CVSS {top.get('cvss_score', 'N/A')}) — "
            f"{top.get('description', '')[:120]}"
        )
    return " | ".join(parts)
 
 
def _update(scan, **kwargs):
    for k, v in kwargs.items():
        setattr(scan, k, v)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
 
 
def _finish(scan, status, progress, phase):
    scan.status   = status
    scan.progress = progress
    scan.phase    = phase
    scan.end_time = datetime.utcnow()
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()