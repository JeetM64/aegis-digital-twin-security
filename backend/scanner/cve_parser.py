# cve_parser.py
"""
CVE extraction + NVD API enrichment.

Flow:
  1. extract_cves_from_text()  – parse CVE-XXXX-XXXXX ids + inline CVSS from nmap script output
  2. enrich_cves()             – hit NVD 2.0 API for real CVSS v3 scores + descriptions
  3. fetch_cves_for_service()  – convenience: query NVD by keyword (service + version)
"""

import re
import time
import logging
import requests
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

# ── Regex patterns ─────────────────────────────────────────────────────────────
CVE_RE   = re.compile(r'(CVE-\d{4}-\d{4,7})', re.IGNORECASE)
CVSS_RE  = re.compile(r'cvss(?:v\d)?[\s:=v]*([0-9]{1,2}\.[0-9])', re.IGNORECASE)
SCORE_RE = re.compile(r'\b([0-9]\.[0-9]|10\.0)\b')   # fallback generic float

# NVD API v2 base
NVD_API  = "https://services.nvd.nist.gov/rest/json/cves/2.0"
NVD_TIMEOUT = 10   # seconds per request
NVD_DELAY   = 0.7  # be polite – NVD rate limit is ~5 req/s without key


# ── 1. Extract CVEs from raw nmap script text ──────────────────────────────────
def extract_cves_from_text(text: str) -> List[Dict]:
    """
    Parse CVE ids + inline CVSS scores from nmap --script vuln output.
    Returns: [{'cve_id': str, 'cvss_score': float|None, 'description': str}]
    Deduplicates by CVE id (keeps first occurrence).
    """
    if not text:
        return []

    results: List[Dict] = []
    seen:    set         = set()

    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue

        cves = CVE_RE.findall(line)
        if not cves:
            continue

        for raw_cve in cves:
            cve_id = raw_cve.upper()
            if cve_id in seen:
                continue
            seen.add(cve_id)

            # Try CVSS label first, then generic float
            cvss: Optional[float] = None
            m = CVSS_RE.search(line)
            if m:
                try:
                    cvss = float(m.group(1))
                except ValueError:
                    pass
            if cvss is None:
                m2 = SCORE_RE.search(line)
                if m2:
                    try:
                        v = float(m2.group(1))
                        if 0.0 <= v <= 10.0:
                            cvss = v
                    except ValueError:
                        pass

            results.append({
                'cve_id':      cve_id,
                'cvss_score':  cvss,
                'description': line,
            })

    return results


# ── 2. Enrich a list of CVE dicts using NVD API ────────────────────────────────
def enrich_cves(cve_list: List[Dict]) -> List[Dict]:
    """
    For each entry in cve_list, fetch real CVSS v3 score + official description
    from the NVD 2.0 API.  Falls back to the inline score when NVD is unavailable.

    Mutates and returns the same list.
    """
    for entry in cve_list:
        cve_id = entry.get('cve_id', '')
        if not cve_id:
            continue
        try:
            data = _nvd_lookup(cve_id)
            if data:
                entry['cvss_score']  = data.get('cvss') or entry.get('cvss_score')
                entry['description'] = data.get('description') or entry.get('description', '')
                entry['severity']    = data.get('severity', _cvss_to_severity(entry['cvss_score']))
                entry['references']  = data.get('references', [])
            else:
                entry['severity'] = _cvss_to_severity(entry.get('cvss_score'))
        except Exception as e:
            logger.debug(f"NVD enrich failed for {cve_id}: {e}")
            entry['severity'] = _cvss_to_severity(entry.get('cvss_score'))

        time.sleep(NVD_DELAY)

    return cve_list


# ── 3. Fetch CVEs by service keyword (for ports with no script output) ─────────
def fetch_cves_for_service(service: str, version: str = "", max_results: int = 5) -> List[Dict]:
    """
    Query NVD for CVEs matching <service> (+ optional version).
    Returns list of {'cve_id', 'cvss_score', 'severity', 'description'}.
    """
    keyword = f"{service} {version}".strip()
    if not keyword:
        return []

    params = {
        "keywordSearch": keyword,
        "resultsPerPage": max_results,
        "startIndex": 0,
    }

    try:
        resp = requests.get(NVD_API, params=params, timeout=NVD_TIMEOUT)
        resp.raise_for_status()
        items = resp.json().get("vulnerabilities", [])
        results = []
        for item in items:
            cve_data = item.get("cve", {})
            cve_id   = cve_data.get("id", "")
            cvss     = _extract_cvss_from_nvd(cve_data)
            desc     = _extract_description(cve_data)
            results.append({
                "cve_id":      cve_id,
                "cvss_score":  cvss,
                "severity":    _cvss_to_severity(cvss),
                "description": desc,
            })
        return results
    except Exception as e:
        logger.debug(f"NVD service search failed for '{keyword}': {e}")
        return []


# ── Internal helpers ────────────────────────────────────────────────────────────
def _nvd_lookup(cve_id: str) -> Optional[Dict]:
    """Fetch a single CVE from NVD.  Returns None on failure."""
    try:
        resp = requests.get(
            NVD_API,
            params={"cveId": cve_id},
            timeout=NVD_TIMEOUT,
        )
        resp.raise_for_status()
        vulns = resp.json().get("vulnerabilities", [])
        if not vulns:
            return None
        cve_data = vulns[0].get("cve", {})
        return {
            "cvss":        _extract_cvss_from_nvd(cve_data),
            "severity":    _extract_severity_from_nvd(cve_data),
            "description": _extract_description(cve_data),
            "references":  _extract_references(cve_data),
        }
    except Exception as e:
        logger.debug(f"NVD lookup error for {cve_id}: {e}")
        return None


def _extract_cvss_from_nvd(cve_data: Dict) -> Optional[float]:
    """Pull the best available CVSS score (v3.1 > v3.0 > v2) from NVD data."""
    metrics = cve_data.get("metrics", {})
    for key in ("cvssMetricV31", "cvssMetricV30", "cvssMetricV2"):
        entries = metrics.get(key, [])
        if entries:
            try:
                return float(entries[0]["cvssData"]["baseScore"])
            except Exception:
                pass
    return None


def _extract_severity_from_nvd(cve_data: Dict) -> str:
    metrics = cve_data.get("metrics", {})
    for key in ("cvssMetricV31", "cvssMetricV30"):
        entries = metrics.get(key, [])
        if entries:
            try:
                return entries[0]["cvssData"].get("baseSeverity", "UNKNOWN").upper()
            except Exception:
                pass
    return "UNKNOWN"


def _extract_description(cve_data: Dict) -> str:
    descs = cve_data.get("descriptions", [])
    for d in descs:
        if d.get("lang") == "en":
            return d.get("value", "")
    return descs[0].get("value", "") if descs else ""


def _extract_references(cve_data: Dict) -> List[str]:
    return [r.get("url", "") for r in cve_data.get("references", [])][:5]


def _cvss_to_severity(score: Optional[float]) -> str:
    if score is None:
        return "UNKNOWN"
    if score >= 9.0:
        return "CRITICAL"
    if score >= 7.0:
        return "HIGH"
    if score >= 4.0:
        return "MEDIUM"
    return "LOW"














