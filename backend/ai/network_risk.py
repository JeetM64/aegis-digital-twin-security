"""
Network-level risk scoring.
Weights: severity distribution + exploit/exposure flags + asset count.
Returns a 0-100 score.
"""
 
SEV_WEIGHT = {
    'critical': 10.0,
    'high':      6.0,
    'medium':    3.0,
    'low':       1.0,
}
 
EXPLOIT_BONUS   = 2.0
EXPOSED_BONUS   = 1.5
MISCONFIG_BONUS = 1.0
 
 
def calculate_network_risk(vulnerabilities, assets):
    """
    Calculate a 0-100 network risk score.
 
    Uses CVSS score (0-10 scale) as primary input rather than
    risk_score which can exceed 100 after prioritization.
    Deduplicates by port+service to avoid inflating the score.
    """
    if not vulnerabilities:
        return 0.0
 
    # Deduplicate by port+service to avoid inflating score from duplicates
    seen = set()
    unique_vulns = []
    for v in vulnerabilities:
        key = (getattr(v, 'port', None), getattr(v, 'service', None))
        if key not in seen:
            seen.add(key)
            unique_vulns.append(v)
 
    if not unique_vulns:
        return 0.0
 
    total = len(unique_vulns)
    raw   = 0.0
 
    for v in unique_vulns:
        sev     = (getattr(v, 'severity',            '') or 'low').lower()
        cvss    = float(getattr(v, 'cvss_score',     0)  or 0)
        exploit = bool(getattr(v, 'exploit_available', False))
        exposed = bool(getattr(v, 'internet_exposed',  False))
        misconf = bool(getattr(v, 'is_misconfigured',  False))
 
        # Base: CVSS normalized to 0-10 + severity weight (0-10)
        # Max base = 10 + 10 = 20
        base = (cvss / 10.0) * 10.0 + SEV_WEIGHT.get(sev, 1.0)
 
        # Flag bonuses
        if exploit: base += EXPLOIT_BONUS
        if exposed: base += EXPOSED_BONUS
        if misconf:  base += MISCONFIG_BONUS
 
        raw += base
 
    # Average per unique vuln, scale to 0-100
    # Max avg = 10 + 10 + 2 + 1.5 + 1 = 24.5
    avg   = raw / total
    score = (avg / 24.5) * 100.0
 
    # Boost slightly for critical/high counts
    crit_count = sum(1 for v in unique_vulns if (getattr(v, 'severity', '') or '').lower() == 'critical')
    high_count = sum(1 for v in unique_vulns if (getattr(v, 'severity', '') or '').lower() == 'high')
 
    if crit_count > 0:
        score = min(100, score * 1.1)
    elif high_count > 3:
        score = min(100, score * 1.05)
 
    # Asset density adjustment
    num_assets = len(assets) if assets else 1
    if num_assets >= 50:
        score = min(100, score * 1.1)
    elif num_assets >= 20:
        score = min(100, score * 1.05)
 
    return round(min(score, 100.0), 2)
 
 
def get_risk_label(score):
    if score >= 75: return 'CRITICAL'
    if score >= 50: return 'HIGH'
    if score >= 25: return 'MEDIUM'
    return 'LOW'
 
 
def get_risk_color(score):
    if score >= 75: return '#ff4d4d'
    if score >= 50: return '#ffa726'
    if score >= 25: return '#ffd93d'
    return '#51cf66'