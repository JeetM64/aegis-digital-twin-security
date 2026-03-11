import requests

CISA_KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"


def load_threat_feed():

    try:

        r = requests.get(CISA_KEV_URL, timeout=10)

        data = r.json()

        return {v["cveID"] for v in data["vulnerabilities"]}

    except:

        return set()


known_exploits = load_threat_feed()


def threat_score(cve_id):

    if cve_id in known_exploits:

        return 5   # boost risk

    return 0