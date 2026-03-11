# prioritization.py
"""
AI-assisted vulnerability prioritization.

Scoring model (max ~100):
  - ML risk score          (0-20)   from risk_model
  - CVSS base score        (0-30)   weighted × 3
  - Exposure bonus         (0-15)   internet-facing services
  - Service criticality    (0-15)   databases, auth services, shells
  - CVE count              (0-10)   more CVEs = more attacked historically
  - Exploit availability   (0-10)   known exploit in script output
"""

import logging
from typing import List, Tuple, Any

logger = logging.getLogger(__name__)

# ── Port exposure tiers ─────────────────────────────────────────────────────────
# Services directly reachable from the internet get the highest exposure bonus
INTERNET_EXPOSED = {
    80: 14, 443: 14, 8080: 12, 8443: 12,      # web
    21: 15, 23: 15,                             # ftp / telnet  (plaintext!)
    25: 10, 465: 8, 587: 8,                     # mail
    53: 8,                                      # dns
    22: 10,                                     # ssh
    3389: 15, 5900: 14,                         # rdp / vnc
}

# Critical backend services (lateral movement / data exfil targets)
CRITICAL_SERVICES = {
    3306: 14,  # mysql
    5432: 14,  # postgresql
    1433: 15,  # mssql
    1521: 15,  # oracle
    27017: 13, # mongodb
    6379: 13,  # redis
    9200: 12,  # elasticsearch
    2379: 12,  # etcd
    9092: 10,  # kafka
    5672: 10,  # rabbitmq
    11211: 11, # memcached
    2181: 9,   # zookeeper
    22: 8,     # ssh also critical for lateral movement
    445: 15,   # smb
    139: 12,   # netbios
    135: 10,   # rpc
}

# Service name risk weights
SERVICE_RISK_NAMES = {
    "ftp":          0.9,
    "telnet":       1.0,
    "rsh":          1.0,
    "rlogin":       1.0,
    "tftp":         0.85,
    "snmp":         0.8,
    "ldap":         0.75,
    "smb":          0.95,
    "rdp":          0.9,
    "vnc":          0.88,
    "mysql":        0.85,
    "mssql":        0.85,
    "oracle":       0.85,
    "redis":        0.9,   # often unauthenticated
    "mongodb":      0.88,
    "elasticsearch":0.85,
    "memcached":    0.87,
    "ssh":          0.55,
    "http":         0.7,
    "https":        0.65,
    "smtp":         0.6,
    "dns":          0.5,
    "unknown":      0.5,
}


def prioritize_vulnerabilities(vulnerabilities: List[Any]) -> List[Tuple[Any, float]]:
    """
    Rank vulnerability ORM objects by composite priority score.
    Returns sorted list of (vuln, score) tuples, highest first.
    """
    ranked = []

    for v in vulnerabilities:
        score = _compute_score(v)
        ranked.append((v, round(score, 2)))

    ranked.sort(key=lambda x: x[1], reverse=True)
    return ranked


def _compute_score(v) -> float:
    score = 0.0

    # ── ML risk score (0–20) ───────────────────────────────────────────────────
    ml_risk = getattr(v, "risk_score", None)
    if ml_risk is not None:
        try:
            score += float(ml_risk)          # already 0-20 from scanner
        except (ValueError, TypeError):
            pass

    # ── CVSS base score (0–30) ────────────────────────────────────────────────
    cvss = getattr(v, "cvss_score", None)
    if cvss is not None:
        try:
            score += float(cvss) * 3.0       # 10.0 CVSS → 30 pts
        except (ValueError, TypeError):
            pass

    # ── Internet exposure bonus (0–15) ────────────────────────────────────────
    port = getattr(v, "port", None)
    if port is not None:
        score += INTERNET_EXPOSED.get(int(port), 0)

    # ── Critical service bonus (0–15) ─────────────────────────────────────────
    if port is not None:
        score += CRITICAL_SERVICES.get(int(port), 0)

    # ── CVE count bonus (0–10) ────────────────────────────────────────────────
    cve_count = getattr(v, "cve_count", 0) or 0
    try:
        # cap at 5 CVEs → 10 pts
        score += min(int(cve_count), 5) * 2.0
    except (ValueError, TypeError):
        pass

    # ── Exploit-available bonus (0–10) ────────────────────────────────────────
    # scanner.py stores raw nmap script output; if it contains "exploit" keywords
    # we add bonus points
    description = (getattr(v, "description", "") or "").lower()
    if any(kw in description for kw in ("exploit", "rce", "remote code", "code execution",
                                         "buffer overflow", "arbitrary command")):
        score += 10
    elif any(kw in description for kw in ("sql injection", "xss", "authentication bypass",
                                           "privilege escalation", "path traversal")):
        score += 7

    return score


def get_priority_label(score: float) -> str:
    """Human-readable priority tier."""
    if score >= 80:
        return "CRITICAL"
    if score >= 55:
        return "HIGH"
    if score >= 30:
        return "MEDIUM"
    return "LOW"


def build_priority_report(ranked: List[Tuple[Any, float]]) -> List[dict]:
    """
    Convert ranked list to JSON-serialisable dicts for the API.
    """
    out = []
    for rank, (v, score) in enumerate(ranked, start=1):
        out.append({
            "rank":           rank,
            "port":           getattr(v, "port", None),
            "service":        getattr(v, "service", "unknown"),
            "version":        getattr(v, "version", ""),
            "cvss_score":     getattr(v, "cvss_score", None),
            "risk_score":     getattr(v, "risk_score", None),
            "priority_score": score,
            "priority_label": get_priority_label(score),
            "severity":       getattr(v, "severity", "unknown"),
            "cve_ids":        getattr(v, "cve_ids", ""),
            "cve_count":      getattr(v, "cve_count", 0),
            "description":    getattr(v, "description", ""),
        })
    return out