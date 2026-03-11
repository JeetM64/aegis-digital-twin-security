"""
Network-level risk scoring.
Weights: severity distribution + exploit/exposure flags + asset count.
Returns a 0–100 score.
"""

SEV_WEIGHT = {
    'critical': 10.0,
    'high':      6.0,
    'medium':    3.0,
    'low':       1.0,
}

EXPLOIT_BONUS   = 3.0   # extra per exploitable vuln
EXPOSED_BONUS   = 2.0   # extra per internet-exposed vuln
MISCONFIG_BONUS = 1.5   # extra per misconfigured vuln


def calculate_network_risk(vulnerabilities, assets):
    """
    Calculate a 0-100 network risk score from a list of Vulnerability ORM objects.

    Factors:
      - Weighted severity score (critical weighs 10x more than low)
      - Exploit-available flag bonus
      - Internet-exposed flag bonus
      - Misconfiguration flag bonus
      - Asset density penalty (more unique hosts = wider attack surface)
    """
    if not vulnerabilities:
        return 0.0

    total = len(vulnerabilities)
    raw   = 0.0

    for v in vulnerabilities:
        sev    = (getattr(v, 'severity',         None) or 'low').lower()
        rs     = float(getattr(v, 'risk_score',  None) or 0)
        exploit= bool(getattr(v, 'exploit_available', False))
        exposed= bool(getattr(v, 'internet_exposed',  False))
        misconf= bool(getattr(v, 'is_misconfigured',  False))

        # Base: blend ML risk_score (0-20 range from prioritization.py) + severity weight
        base = rs + SEV_WEIGHT.get(sev, 1.0)

        # Flag bonuses
        if exploit: base += EXPLOIT_BONUS
        if exposed: base += EXPOSED_BONUS
        if misconf:  base += MISCONFIG_BONUS

        raw += base

    # Average per vuln, then scale
    avg = raw / total

    # avg max ≈ 20 (risk_score) + 10 (critical) + 3 + 2 + 1.5 = 36.5
    # → scale so that avg=36.5 → score=100
    MAX_AVG = 36.5
    score   = (avg / MAX_AVG) * 100.0

    # Asset density penalty: large networks have wider attack surface
    num_assets = len(assets) if assets else 1
    if num_assets >= 50:
        score = min(100, score * 1.15)
    elif num_assets >= 20:
        score = min(100, score * 1.08)

    return round(min(score, 100.0), 2)


def get_risk_label(score):
    """Return a human-readable label for the network risk score."""
    if score >= 75: return 'CRITICAL'
    if score >= 50: return 'HIGH'
    if score >= 25: return 'MEDIUM'
    return 'LOW'


def get_risk_color(score):
    """Return a hex color for UI display."""
    if score >= 75: return '#ff4d4d'
    if score >= 50: return '#ffa726'
    if score >= 25: return '#ffd93d'
    return '#51cf66'