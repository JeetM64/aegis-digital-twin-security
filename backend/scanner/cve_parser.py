"""
cve_parser.py  –  CVE extraction + NVD API enrichment (Improved)

Improvements:
  1. Retry with exponential backoff on HTTP 429 / 5xx
  2. Respects NVD Retry-After header
  3. Configurable MAX_RETRIES and base RETRY_DELAY
  4. Better logging — distinguishes rate-limit vs real failures
"""

import re
import time
import logging
import requests
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

CVE_RE   = re.compile(r'(CVE-\d{4}-\d{4,7})', re.IGNORECASE)
CVSS_RE  = re.compile(r'cvss(?:v\d)?[\s:=v]*([0-9]{1,2}\.[0-9])', re.IGNORECASE)
SCORE_RE = re.compile(r'\b([0-9]\.[0-9]|10\.0)\b')

NVD_API       = "https://services.nvd.nist.gov/rest/json/cves/2.0"
NVD_TIMEOUT   = 10
NVD_DELAY     = 0.7
MAX_RETRIES   = 3
RETRY_BACKOFF = 2.0


def extract_cves_from_text(text: str) -> List[Dict]:
    if not text:
        return []

    results: List[Dict] = []
    seen: set = set()

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


def enrich_cves(cve_list: List[Dict]) -> List[Dict]:
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
            logger.debug("NVD enrich failed for %s: %s", cve_id, e)
            entry['severity'] = _cvss_to_severity(entry.get('cvss_score'))

        time.sleep(NVD_DELAY)

    return cve_list


def fetch_cves_for_service(service: str, version: str = "", max_results: int = 5) -> List[Dict]:
    keyword = f"{service} {version}".strip()
    if not keyword:
        return []

    params = {
        "keywordSearch": keyword,
        "resultsPerPage": max_results,
        "startIndex": 0,
    }

    resp = _nvd_get(NVD_API, params)
    if resp is None:
        return []

    try:
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
        logger.debug("NVD service search parse error for '%s': %s", keyword, e)
        return []


def _nvd_get(url: str, params: dict) -> Optional[requests.Response]:
    delay = NVD_DELAY
    for attempt in range(1, MAX_RETRIES + 2):
        try:
            resp = requests.get(url, params=params, timeout=NVD_TIMEOUT)

            if resp.status_code == 200:
                return resp

            if resp.status_code == 429:
                retry_after = int(resp.headers.get("Retry-After", delay))
                wait = max(retry_after, delay)
                logger.warning(
                    "NVD rate-limited (429). Waiting %.1fs before retry %d/%d …",
                    wait, attempt, MAX_RETRIES
                )
                time.sleep(wait)
                delay *= RETRY_BACKOFF
                continue

            if resp.status_code >= 500:
                logger.warning(
                    "NVD server error %d. Retry %d/%d in %.1fs …",
                    resp.status_code, attempt, MAX_RETRIES, delay
                )
                time.sleep(delay)
                delay *= RETRY_BACKOFF
                continue

            logger.debug("NVD returned %d for %s", resp.status_code, params)
            return None

        except requests.Timeout:
            logger.warning("NVD request timed out. Retry %d/%d in %.1fs …", attempt, MAX_RETRIES, delay)
            time.sleep(delay)
            delay *= RETRY_BACKOFF

        except requests.ConnectionError as e:
            logger.warning("NVD connection error: %s. Retry %d/%d in %.1fs …", e, attempt, MAX_RETRIES, delay)
            time.sleep(delay)
            delay *= RETRY_BACKOFF

        if attempt > MAX_RETRIES:
            break

    logger.warning("NVD request failed after %d retries: %s", MAX_RETRIES, params)
    return None


def _nvd_lookup(cve_id: str) -> Optional[Dict]:
    resp = _nvd_get(NVD_API, {"cveId": cve_id})
    if resp is None:
        return None
    try:
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
        logger.debug("NVD parse error for %s: %s", cve_id, e)
        return None


def _extract_cvss_from_nvd(cve_data: Dict) -> Optional[float]:
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