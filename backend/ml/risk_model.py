# ml/risk_model.py
"""
ML risk scoring wrapper.

Feature vector (12 features — must match the trained model):
  0  port              raw port number
  1  cvss              CVSS base score (0-10)
  2  internet          1 if internet-facing port, else 0
  3  service_risk      0.0-1.0  (from SERVICE_RISK_MAP)
  4  patch_age         estimated patch age in years (0 = recent, 5 = old)
  5  exploit           1 if known exploit found in script output, else 0
  6  popularity        port popularity rank (1-10; 1 = very common)
  7  auth              1 if service requires auth, 0 if open/anonymous
  8  cve_count         number of CVEs found for this port/service
  9  misconfig         1 if misconfiguration detected, else 0
  10 network_depth     0 = perimeter, 1 = internal, 2 = deep internal
  11 critical_asset    1 if asset tagged critical, else 0
"""

import os
import logging
import numpy as np

logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(__file__)
_MODEL_PATH = os.path.join(BASE_DIR, "risk_model.pkl")

# ── Lazy-load model ────────────────────────────────────────────────────────────
_model = None

def _get_model():
    global _model
    if _model is None:
        try:
            import joblib
            _model = joblib.load(_MODEL_PATH)
            logger.info("Risk model loaded from %s", _MODEL_PATH)
        except Exception as e:
            logger.warning("Could not load risk model: %s — using heuristic fallback", e)
    return _model


# ── Service risk table (mirrors prioritization.py) ────────────────────────────
SERVICE_RISK_MAP = {
    "ftp": 0.9, "telnet": 1.0, "rsh": 1.0, "rlogin": 1.0, "tftp": 0.85,
    "snmp": 0.8, "ldap": 0.75, "smb": 0.95, "rdp": 0.9, "vnc": 0.88,
    "mysql": 0.85, "mssql": 0.85, "oracle": 0.85, "redis": 0.9,
    "mongodb": 0.88, "elasticsearch": 0.85, "memcached": 0.87,
    "ssh": 0.55, "http": 0.7, "https": 0.65, "smtp": 0.6,
    "dns": 0.5, "unknown": 0.5,
}

# Ports considered internet-facing
INTERNET_PORTS = {21, 22, 23, 25, 53, 80, 443, 445, 3389, 5900, 8080, 8443}

# Ports considered popular / commonly scanned
PORT_POPULARITY = {
    80: 1, 443: 1, 22: 2, 21: 2, 25: 3, 3306: 3, 5432: 4,
    1433: 4, 3389: 3, 8080: 4, 8443: 5, 23: 2, 53: 3,
    27017: 5, 6379: 5, 9200: 6,
}

# Ports that typically require authentication
AUTH_PORTS = {22, 443, 3306, 5432, 1433, 1521, 8443, 389, 636}

# Ports associated with anonymous / open-by-default services
OPEN_PORTS = {21, 23, 80, 25, 53, 11211, 6379, 27017, 9200}


def build_feature_vector(
    port: int,
    cvss: float,
    service: str = "unknown",
    cve_count: int = 0,
    exploit_found: bool = False,
    misconfig: bool = False,
    network_depth: int = 0,     # 0=perimeter, 1=internal, 2=deep
    critical_asset: bool = False,
    patch_age: float = 2.0,
) -> np.ndarray:
    """
    Build a normalised 12-feature vector.  All callers should use this helper
    so that feature construction is consistent with training.
    """
    service_lower = (service or "unknown").lower()

    internet      = 1 if port in INTERNET_PORTS else 0
    service_risk  = SERVICE_RISK_MAP.get(service_lower, 0.5)
    popularity    = PORT_POPULARITY.get(port, 7)
    auth          = 0 if port in OPEN_PORTS else (1 if port in AUTH_PORTS else 0)
    exploit       = 1 if exploit_found else 0
    misconfig_int = 1 if misconfig else 0
    critical      = 1 if critical_asset else 0

    return np.array([[
        port,
        float(cvss),
        internet,
        service_risk,
        float(patch_age),
        exploit,
        popularity,
        auth,
        int(cve_count),
        misconfig_int,
        int(network_depth),
        critical,
    ]])


def predict_risk(
    port: int,
    cvss: float,
    service: str = "unknown",
    cve_count: int = 0,
    exploit_found: bool = False,
    misconfig: bool = False,
    network_depth: int = 0,
    critical_asset: bool = False,
    patch_age: float = 2.0,
) -> float:
    """
    Return a risk probability in [0, 1].
    Uses the trained ML model when available; falls back to a deterministic
    heuristic so the rest of the pipeline still produces useful scores.
    """
    features = build_feature_vector(
        port=port, cvss=cvss, service=service,
        cve_count=cve_count, exploit_found=exploit_found,
        misconfig=misconfig, network_depth=network_depth,
        critical_asset=critical_asset, patch_age=patch_age,
    )

    model = _get_model()
    if model is not None:
        try:
            prob = model.predict_proba(features)[0][1]
            return float(np.clip(prob, 0.0, 1.0))
        except Exception as e:
            logger.warning("Model predict failed: %s — using heuristic", e)

    return _heuristic_risk(
        port=port, cvss=cvss, service=service,
        cve_count=cve_count, exploit_found=exploit_found,
    )


def _heuristic_risk(
    port: int,
    cvss: float,
    service: str,
    cve_count: int,
    exploit_found: bool,
) -> float:
    """
    Deterministic fallback risk score when model is unavailable.
    Returns probability in [0, 1].
    """
    service_lower = (service or "unknown").lower()
    score = 0.0

    # CVSS drives most of the score
    score += (cvss / 10.0) * 0.5

    # Service risk
    score += SERVICE_RISK_MAP.get(service_lower, 0.5) * 0.2

    # Internet exposure
    if port in INTERNET_PORTS:
        score += 0.15

    # Exploit known
    if exploit_found:
        score += 0.1

    # CVE count (diminishing returns)
    score += min(cve_count / 20.0, 0.05)

    return float(np.clip(score, 0.0, 1.0))














