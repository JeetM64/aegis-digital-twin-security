"""
risk_model.py  –  ML risk scoring wrapper (Improved)

CRITICAL FIX:
  predict_proba() returns [0,1].  The rest of the pipeline (prioritization.py,
  the scanner DB store) expects a score in [0,20].
  This version:
    - scales model output → prob × 20  before returning
    - fixes heuristic fallback to also return [0,20]
    - loads the model bundle (dict) saved by the new train_model.py
    - falls back gracefully to heuristic if bundle is old-format (raw model)

Feature vector (12 features — must match training):
  0  port              raw port number
  1  cvss              CVSS base score (0-10)
  2  internet          1 if internet-facing port, else 0
  3  service_risk      0.0-1.0
  4  patch_age         estimated patch age in years
  5  exploit           1 if known exploit, else 0
  6  popularity        port popularity rank (1-10)
  7  auth              1 if service requires auth, 0 if open
  8  cve_count         number of CVEs found
  9  misconfig         1 if misconfiguration detected
  10 network_depth     0=perimeter, 1=internal, 2+=deep
  11 critical_asset    1 if asset tagged critical
"""

import os
import logging
import numpy as np

logger = logging.getLogger(__name__)

BASE_DIR    = os.path.dirname(__file__)
_MODEL_PATH = os.path.join(BASE_DIR, "risk_model.pkl")

# ── Lazy-load model bundle ────────────────────────────────────────────────────
_model     = None
_threshold = 0.5

def _get_model():
    global _model, _threshold
    if _model is None:
        try:
            import joblib
            bundle = joblib.load(_MODEL_PATH)
            if isinstance(bundle, dict):
                _model     = bundle["model"]
                _threshold = bundle.get("threshold", 0.5)
                logger.info(
                    "Risk model loaded (v%s, threshold=%.2f)",
                    bundle.get("version", "?"), _threshold
                )
            else:
                _model     = bundle
                _threshold = 0.5
                logger.info("Risk model loaded (legacy format, threshold=0.5)")
        except Exception as e:
            logger.warning("Could not load risk model: %s — using heuristic fallback", e)
    return _model


# ── Service risk table ────────────────────────────────────────────────────────
SERVICE_RISK_MAP = {
    "ftp":           0.9,
    "telnet":        1.0,
    "rsh":           1.0,
    "rlogin":        1.0,
    "tftp":          0.85,
    "snmp":          0.8,
    "ldap":          0.75,
    "smb":           0.95,
    "rdp":           0.9,
    "vnc":           0.88,
    "mysql":         0.85,
    "mssql":         0.85,
    "oracle":        0.85,
    "redis":         0.9,
    "mongodb":       0.88,
    "elasticsearch": 0.85,
    "memcached":     0.87,
    "ssh":           0.55,
    "http":          0.7,
    "https":         0.65,
    "smtp":          0.6,
    "dns":           0.5,
    "unknown":       0.5,
}

INTERNET_PORTS  = {21, 22, 23, 25, 53, 80, 443, 445, 3389, 5900, 8080, 8443}
PORT_POPULARITY = {
    80: 1, 443: 1, 22: 2, 21: 2, 25: 3, 3306: 3, 5432: 4,
    1433: 4, 3389: 3, 8080: 4, 8443: 5, 23: 2, 53: 3,
    27017: 5, 6379: 5, 9200: 6,
}
AUTH_PORTS = {22, 443, 3306, 5432, 1433, 1521, 8443, 389, 636}
OPEN_PORTS = {21, 23, 80, 25, 53, 11211, 6379, 27017, 9200}


def build_feature_vector(
    port: int,
    cvss: float,
    service: str = "unknown",
    cve_count: int = 0,
    exploit_found: bool = False,
    misconfig: bool = False,
    network_depth: int = 0,
    critical_asset: bool = False,
    patch_age: float = 2.0,
) -> np.ndarray:
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
    Return a risk score in [0, 20].
    Uses the trained ML model when available (probability × 20).
    Falls back to a deterministic heuristic that also returns [0, 20].
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
            return float(np.clip(prob * 20.0, 0.0, 20.0))
        except Exception as e:
            logger.warning("Model predict failed: %s — using heuristic", e)

    return _heuristic_risk(
        port=port, cvss=cvss, service=service,
        cve_count=cve_count, exploit_found=exploit_found,
        misconfig=misconfig, network_depth=network_depth,
        critical_asset=critical_asset,
    )


def _heuristic_risk(
    port: int,
    cvss: float,
    service: str,
    cve_count: int,
    exploit_found: bool,
    misconfig: bool = False,
    network_depth: int = 0,
    critical_asset: bool = False,
) -> float:
    """
    Deterministic fallback. Returns score in [0, 20].
    """
    service_lower = (service or "unknown").lower()
    score = 0.0

    score += (float(cvss) / 10.0) * 10.0
    score += SERVICE_RISK_MAP.get(service_lower, 0.5) * 4.0

    if port in INTERNET_PORTS:
        score += 2.0
    if exploit_found:
        score += 2.0

    score += min(cve_count / 20.0, 1.0)

    if misconfig:
        score += 0.5
    if critical_asset or network_depth == 0:
        score += 0.5

    return float(np.clip(score, 0.0, 20.0))