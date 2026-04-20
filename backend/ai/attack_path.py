"""
Attack Path Simulation Engine for Aegis.
Simulates how an attacker would move through the network
from internet to internal assets using graph-based pathfinding.
"""
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

# Risk scores per service — higher = easier to exploit
SERVICE_EXPLOIT_EASE = {
    'telnet': 9.8, 'rsh': 9.5, 'rlogin': 9.0,
    'ftp': 8.5, 'tftp': 8.0,
    'smb': 9.0, 'rdp': 8.8, 'vnc': 8.5,
    'redis': 8.0, 'memcached': 7.8, 'mongodb': 7.5,
    'mysql': 7.2, 'mssql': 7.2, 'postgresql': 7.0,
    'elasticsearch': 7.5, 'http': 6.5, 'https': 5.5,
    'ssh': 5.0, 'smtp': 5.5, 'dns': 5.3, 'snmp': 7.5,
}

# Attack techniques per service
ATTACK_TECHNIQUES = {
    'ssh':          'Brute-force credentials / CVE exploit',
    'ftp':          'Anonymous login / clear-text credentials',
    'http':         'Web application exploit / SQL injection',
    'https':        'Web application exploit / TLS vulnerability',
    'mysql':        'Default credentials / SQL injection',
    'postgresql':   'Default credentials / privilege escalation',
    'mssql':        'Default credentials / xp_cmdshell exploit',
    'rdp':          'BlueKeep / DejaBlue / brute-force',
    'smb':          'EternalBlue / credential relay',
    'redis':        'Unauthenticated access / RCE via config write',
    'mongodb':      'Unauthenticated access / data exfiltration',
    'elasticsearch':'Unauthenticated REST API access',
    'telnet':       'Clear-text sniffing / brute-force',
    'vnc':          'Weak password / unauthenticated access',
    'snmp':         'Default community string / information disclosure',
    'smtp':         'Open relay / user enumeration',
    'dns':          'Zone transfer / cache poisoning',
    'memcached':    'UDP amplification / unauthenticated access',
}

# What attacker gains per service
ATTACKER_GAIN = {
    'ssh':          'Remote shell access',
    'ftp':          'File system access',
    'http':         'Web server compromise',
    'https':        'Web server compromise',
    'mysql':        'Database access — data exfiltration',
    'postgresql':   'Database access — data exfiltration',
    'mssql':        'Database access + possible OS command execution',
    'rdp':          'Full desktop access',
    'smb':          'Lateral movement + credential harvesting',
    'redis':        'Cache poisoning + possible RCE',
    'mongodb':      'Full database read/write access',
    'elasticsearch':'Full index read — sensitive data exposure',
    'telnet':       'Remote shell — all traffic visible',
    'vnc':          'Full desktop access',
    'snmp':         'Network topology mapping',
    'smtp':         'Email spoofing + relay abuse',
    'dns':          'Traffic redirection',
}


def simulate_attack_paths(vulnerabilities: list, vms: list) -> Dict[str, Any]:
    """
    Simulate attack paths from internet to internal assets.
    Returns a graph of attack steps with risk scores.
    """
    if not vulnerabilities or not vms:
        return {"paths": [], "nodes": [], "edges": [], "summary": {}}

    # Build VM lookup
    vm_map = {vm.ip_address: vm for vm in vms}

    # Group vulns by IP
    vuln_by_ip: Dict[str, list] = {}
    for v in vulnerabilities:
        vm = None
        if v.vm_id:
            vm = next((m for m in vms if m.id == v.vm_id), None)
        ip = vm.ip_address if vm else "unknown"
        if ip not in vuln_by_ip:
            vuln_by_ip[ip] = []
        vuln_by_ip[ip].append(v)

    # Build nodes — internet + each device
    nodes = [{
        "id":       "INTERNET",
        "label":    "Internet",
        "type":     "gateway",
        "risk":     0,
        "ip":       "0.0.0.0",
        "color":    "#00e5ff",
        "icon":     "🌐",
    }]

    for ip, vulns in vuln_by_ip.items():
        if ip == "unknown":
            continue
        vm = vm_map.get(ip)
        max_cvss = max((v.cvss_score or 0 for v in vulns), default=0)
        risk_level = vm.risk_level if vm else "UNKNOWN"

        color = "#ff4d4d" if risk_level in ("CRITICAL", "HIGH") else \
                "#ffa726" if risk_level == "MEDIUM" else \
                "#51cf66" if risk_level == "LOW" else "#546e7a"

        nodes.append({
            "id":       ip,
            "label":    vm.hostname if vm and vm.hostname else ip,
            "type":     "host",
            "risk":     round(max_cvss, 1),
            "ip":       ip,
            "os":       vm.os if vm else "Unknown",
            "risk_level": risk_level,
            "vuln_count": len(vulns),
            "color":    color,
            "icon":     "🖥",
        })

    # Build edges — attack steps
    edges = []
    paths = []

    for ip, vulns in vuln_by_ip.items():
        if ip == "unknown":
            continue

        # Sort vulns by ease of exploit
        sorted_vulns = sorted(
            vulns,
            key=lambda v: SERVICE_EXPLOIT_EASE.get((v.service or "").lower(), 4.0),
            reverse=True
        )

        # Top 3 attack vectors for this host
        attack_steps = []
        for v in sorted_vulns[:3]:
            svc = (v.service or "unknown").lower()
            technique = ATTACK_TECHNIQUES.get(svc, f"Exploit {svc} vulnerability")
            gain      = ATTACKER_GAIN.get(svc, "System access")
            ease      = SERVICE_EXPLOIT_EASE.get(svc, 4.0)

            step = {
                "port":       v.port,
                "service":    v.service or "unknown",
                "cvss":       round(v.cvss_score or 0, 1),
                "cve":        v.cve_ids.split(",")[0].strip() if v.cve_ids else None,
                "technique":  technique,
                "gain":       gain,
                "ease":       ease,
                "severity":   v.severity or "unknown",
            }
            attack_steps.append(step)

        if not attack_steps:
            continue

        best_step = attack_steps[0]

        # Edge from INTERNET to this host
        edges.append({
            "from":      "INTERNET",
            "to":        ip,
            "label":     f"{best_step['service']}:{best_step['port']}",
            "technique": best_step["technique"],
            "cvss":      best_step["cvss"],
            "severity":  best_step["severity"],
            "risk":      best_step["ease"],
            "color":     "#ff4d4d" if best_step["cvss"] >= 9 else
                         "#ffa726" if best_step["cvss"] >= 7 else
                         "#ffd93d" if best_step["cvss"] >= 4 else "#51cf66",
        })

        # Build full attack path for this host
        vm = vm_map.get(ip)
        paths.append({
            "target":       ip,
            "hostname":     vm.hostname if vm and vm.hostname else ip,
            "risk_level":   vm.risk_level if vm else "UNKNOWN",
            "total_vulns":  len(vulns),
            "attack_steps": attack_steps,
            "impact":       _calculate_impact(vulns),
            "likelihood":   round(best_step["ease"] / 10.0, 2),
        })

    # Sort paths by risk
    paths.sort(key=lambda p: p["likelihood"], reverse=True)

    # Summary
    total_paths   = len(paths)
    critical_paths = sum(1 for p in paths if p["risk_level"] in ("CRITICAL", "HIGH"))

    return {
        "paths":   paths,
        "nodes":   nodes,
        "edges":   edges,
        "summary": {
            "total_paths":    total_paths,
            "critical_paths": critical_paths,
            "total_nodes":    len(nodes),
            "risk_level":     "CRITICAL" if critical_paths > 0 else "HIGH" if total_paths > 0 else "LOW",
        }
    }


def _calculate_impact(vulns: list) -> str:
    severities = [v.severity or "low" for v in vulns]
    if "critical" in severities:
        return "Complete system compromise — data exfiltration + ransomware possible"
    if "high" in severities:
        return "Significant access — privilege escalation likely"
    if "medium" in severities:
        return "Partial access — lateral movement possible"
    return "Limited access — information disclosure"