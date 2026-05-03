"""
prioritization.py  –  AI-assisted vulnerability prioritization (Improved)

Scoring model (max ~100 pts):
  - ML risk score      (0-20)
  - CVSS base score    (0-30)
  - Exposure bonus     (0-15)
  - Service criticality(0-15)
  - CVE count          (0-10)
  - Exploit bonus      (0-10)
"""

import logging
from typing import List, Tuple, Any

logger = logging.getLogger(__name__)

INTERNET_EXPOSED = {
    80: 14, 443: 14, 8080: 12, 8443: 12,
    21: 15, 23: 15,
    25: 10, 465: 8, 587: 8,
    53: 8,
    22: 10,
    3389: 15, 5900: 14,
}

CRITICAL_SERVICES = {
    3306: 14, 5432: 14, 1433: 15, 1521: 15,
    27017: 13, 6379: 13, 9200: 12, 2379: 12,
    9092: 10, 5672: 10, 11211: 11, 2181: 9,
    22: 8, 445: 15, 139: 12, 135: 10,
}

SERVICE_RISK_NAMES = {
    "ftp": 0.9, "telnet": 1.0, "rsh": 1.0, "rlogin": 1.0,
    "tftp": 0.85, "snmp": 0.8, "ldap": 0.75, "smb": 0.95,
    "rdp": 0.9, "vnc": 0.88, "mysql": 0.85, "mssql": 0.85,
    "oracle": 0.85, "redis": 0.9, "mongodb": 0.88,
    "elasticsearch": 0.85, "memcached": 0.87,
    "ssh": 0.55, "http": 0.7, "https": 0.65,
    "smtp": 0.6, "dns": 0.5, "unknown": 0.5,
}


def _normalise_ml_risk(raw) -> float:
    """
    Ensure ml_risk is always in [0, 20] regardless of scanner version.
    Old scanner stored predict_proba() directly → value in [0, 1].
    New scanner stores predict_risk() → value in [0, 20].
    """
    if raw is None:
        return 0.0
    try:
        v = float(raw)
        if v < 0:
            return 0.0
        if v <= 1.0:
            return v * 20.0
        return min(v, 20.0)
    except (ValueError, TypeError):
        return 0.0


def prioritize_vulnerabilities(vulnerabilities: List[Any]) -> List[Tuple[Any, float]]:
    ranked = []
    for v in vulnerabilities:
        score = _compute_score(v)
        ranked.append((v, round(score, 2)))
    ranked.sort(key=lambda x: x[1], reverse=True)
    return ranked


def _compute_score(v) -> float:
    score = 0.0

    raw_ml = getattr(v, "risk_score", None)
    ml_risk = _normalise_ml_risk(raw_ml)
    score += ml_risk

    cvss = getattr(v, "cvss_score", None)
    if cvss is not None:
        try:
            score += float(cvss) * 3.0
        except (ValueError, TypeError):
            pass

    port = getattr(v, "port", None)
    if port is not None:
        score += INTERNET_EXPOSED.get(int(port), 0)
        score += CRITICAL_SERVICES.get(int(port), 0)

    cve_count = getattr(v, "cve_count", 0) or 0
    try:
        score += min(int(cve_count), 5) * 2.0
    except (ValueError, TypeError):
        pass

    description = (getattr(v, "description", "") or "").lower()
    if any(kw in description for kw in (
        "exploit", "rce", "remote code", "code execution",
        "buffer overflow", "arbitrary command"
    )):
        score += 10
    elif any(kw in description for kw in (
        "sql injection", "xss", "authentication bypass",
        "privilege escalation", "path traversal"
    )):
        score += 7

    return score


def get_priority_label(score: float) -> str:
    if score >= 80:
        return "CRITICAL"
    if score >= 55:
        return "HIGH"
    if score >= 30:
        return "MEDIUM"
    return "LOW"


def build_priority_report(ranked: List[Tuple[Any, float]]) -> List[dict]:
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