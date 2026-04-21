"""
Compliance Checker Engine for Aegis.
Maps discovered vulnerabilities to ISO 27001 and NIST CSF controls.
Returns compliance score, failed controls, warnings, and passed controls.
"""

# ─────────────────────────────────────────────────────────────────────────────
# ISO 27001:2022 Controls relevant to network/vulnerability management
# ─────────────────────────────────────────────────────────────────────────────
ISO_27001_CONTROLS = [
    {
        "id":          "A.8.8",
        "title":       "Management of Technical Vulnerabilities",
        "description": "Information about technical vulnerabilities of information systems shall be obtained, the organisation's exposure evaluated and appropriate measures taken.",
        "category":    "Technological Controls",
        "check":       "has_unpatched_critical",
        "remediation": "Apply patches for all CRITICAL and HIGH severity vulnerabilities immediately.",
    },
    {
        "id":          "A.8.6",
        "title":       "Capacity Management",
        "description": "The use of resources shall be monitored and adjusted in line with current and expected capacity requirements.",
        "check":       "has_open_ports_over_limit",
        "category":    "Technological Controls",
        "remediation": "Close unnecessary open ports. Only required services should be exposed.",
    },
    {
        "id":          "A.8.21",
        "title":       "Security of Network Services",
        "description": "Security mechanisms, service levels and management requirements of all network services shall be identified, implemented and monitored.",
        "check":       "has_insecure_services",
        "category":    "Technological Controls",
        "remediation": "Disable insecure services (Telnet, FTP, SNMP v1). Use SSH, SFTP, SNMP v3.",
    },
    {
        "id":          "A.8.22",
        "title":       "Segregation of Networks",
        "description": "Groups of information services, users and information systems shall be segregated in networks.",
        "check":       "has_database_exposed",
        "category":    "Technological Controls",
        "remediation": "Databases (MySQL, PostgreSQL, MongoDB) should not be publicly accessible.",
    },
    {
        "id":          "A.5.37",
        "title":       "Documented Operating Procedures",
        "description": "Operating procedures for information processing facilities shall be documented.",
        "check":       "has_scan_history",
        "category":    "Organisational Controls",
        "remediation": "Maintain regular scanning schedule and document findings.",
    },
    {
        "id":          "A.8.9",
        "title":       "Configuration Management",
        "description": "Configurations, including security configurations, of hardware, software, services and networks shall be established, documented, implemented, monitored and reviewed.",
        "check":       "has_misconfiguration",
        "category":    "Technological Controls",
        "remediation": "Fix all misconfigured services. Remove default credentials and open configurations.",
    },
    {
        "id":          "A.8.16",
        "title":       "Monitoring Activities",
        "description": "Networks, systems and applications shall be monitored for anomalous behaviour.",
        "check":       "has_monitoring",
        "category":    "Technological Controls",
        "remediation": "Implement continuous monitoring. Aegis auto-scan covers this requirement.",
    },
    {
        "id":          "A.8.3",
        "title":       "Information Access Restriction",
        "description": "Access to information and application system functions shall be restricted in accordance with the access control policy.",
        "check":       "has_auth_bypass",
        "category":    "Technological Controls",
        "remediation": "Ensure all services require authentication. Disable anonymous access.",
    },
]

# ─────────────────────────────────────────────────────────────────────────────
# NIST Cybersecurity Framework 2.0 Controls
# ─────────────────────────────────────────────────────────────────────────────
NIST_CSF_CONTROLS = [
    {
        "id":          "ID.RA-1",
        "title":       "Asset Vulnerabilities Identified",
        "description": "Vulnerabilities in assets are identified and documented.",
        "function":    "IDENTIFY",
        "check":       "has_scan_history",
        "remediation": "Run regular vulnerability scans on all network assets.",
    },
    {
        "id":          "PR.IP-12",
        "title":       "Vulnerability Management Plan",
        "description": "A vulnerability management plan is developed and implemented.",
        "function":    "PROTECT",
        "check":       "has_unpatched_critical",
        "remediation": "Patch critical vulnerabilities within 24 hours, high within 7 days.",
    },
    {
        "id":          "PR.AC-3",
        "title":       "Remote Access Managed",
        "description": "Remote access is managed.",
        "function":    "PROTECT",
        "check":       "has_rdp_vnc_exposed",
        "remediation": "Restrict RDP and VNC access behind VPN. Disable if not needed.",
    },
    {
        "id":          "PR.DS-1",
        "title":       "Data-at-Rest Protected",
        "description": "Data-at-rest is protected.",
        "function":    "PROTECT",
        "check":       "has_database_exposed",
        "remediation": "Ensure database ports are not publicly accessible.",
    },
    {
        "id":          "DE.CM-1",
        "title":       "Network Monitored",
        "description": "The network is monitored to detect potential cybersecurity events.",
        "function":    "DETECT",
        "check":       "has_monitoring",
        "remediation": "Enable continuous network monitoring via Aegis scheduled scans.",
    },
    {
        "id":          "DE.CM-8",
        "title":       "Vulnerability Scans Performed",
        "description": "Vulnerability scans are performed.",
        "function":    "DETECT",
        "check":       "has_recent_scan",
        "remediation": "Perform vulnerability scans at least weekly.",
    },
    {
        "id":          "RS.MI-3",
        "title":       "Newly Identified Vulnerabilities Mitigated",
        "description": "Newly identified vulnerabilities are mitigated or documented as accepted risks.",
        "function":    "RESPOND",
        "check":       "has_unresolved_critical",
        "remediation": "Mark vulnerabilities as resolved or accepted risk in Aegis.",
    },
    {
        "id":          "RC.RP-1",
        "title":       "Recovery Plan Executed",
        "description": "Recovery plan is executed during or after a cybersecurity incident.",
        "function":    "RECOVER",
        "check":       "has_exploit_available",
        "remediation": "Document recovery procedures for services with known public exploits.",
    },
]

INSECURE_SERVICES = {"telnet", "ftp", "tftp", "rsh", "rlogin", "rexec", "finger", "snmp"}
DATABASE_PORTS    = {3306, 5432, 1433, 1521, 27017, 6379, 9200, 5984, 2379}
REMOTE_ACCESS     = {3389, 5900, 5901, 4899}  # RDP, VNC, Radmin


def run_compliance_check(vulnerabilities: list, scans: list) -> dict:
    """
    Run full compliance check against ISO 27001 and NIST CSF.
    Returns structured results with pass/fail/warning per control.
    """
    # Build context from vulnerability data
    ctx = _build_context(vulnerabilities, scans)

    iso_results  = _evaluate_controls(ISO_27001_CONTROLS,  ctx, framework="ISO 27001:2022")
    nist_results = _evaluate_controls(NIST_CSF_CONTROLS,   ctx, framework="NIST CSF 2.0")

    all_results = iso_results + nist_results

    passed   = [r for r in all_results if r["status"] == "PASS"]
    failed   = [r for r in all_results if r["status"] == "FAIL"]
    warnings = [r for r in all_results if r["status"] == "WARNING"]

    total = len(all_results)
    score = round((len(passed) / total * 100), 1) if total > 0 else 0

    if score >= 80:   overall = "COMPLIANT"
    elif score >= 60: overall = "PARTIALLY COMPLIANT"
    else:             overall = "NON-COMPLIANT"

    return {
        "score":           score,
        "overall_status":  overall,
        "total_controls":  total,
        "passed":          len(passed),
        "failed":          len(failed),
        "warnings":        len(warnings),
        "iso_results":     iso_results,
        "nist_results":    nist_results,
        "context":         ctx,
        "summary": {
            "critical_issues": [r["title"] for r in failed[:3]],
            "quick_wins":      [r["title"] for r in warnings[:3]],
        }
    }


def _build_context(vulnerabilities: list, scans: list) -> dict:
    """Build a context dict from scan data for control evaluation."""
    if not vulnerabilities:
        return {
            "has_unpatched_critical":  False,
            "has_open_ports_over_limit": False,
            "has_insecure_services":   False,
            "has_database_exposed":    False,
            "has_scan_history":        len(scans) > 0,
            "has_misconfiguration":    False,
            "has_monitoring":          len(scans) > 0,
            "has_auth_bypass":         False,
            "has_rdp_vnc_exposed":     False,
            "has_recent_scan":         False,
            "has_unresolved_critical": False,
            "has_exploit_available":   False,
            "total_vulns":             0,
            "critical_count":          0,
            "high_count":              0,
            "open_ports":              [],
            "services":                [],
        }

    severities    = [(v.severity or "").lower() for v in vulnerabilities]
    ports         = [v.port for v in vulnerabilities if v.port]
    services      = [(v.service or "").lower() for v in vulnerabilities if v.service]
    remediations  = [(v.remediation_status or "open").lower() for v in vulnerabilities]

    critical_count = severities.count("critical")
    high_count     = severities.count("high")

    # Check for recent scan (within 7 days)
    has_recent = False
    if scans:
        import datetime
        latest = max((s.start_time for s in scans if s.start_time), default=None)
        if latest:
            has_recent = (datetime.datetime.utcnow() - latest).days <= 7

    return {
        "has_unpatched_critical":    critical_count > 0 or high_count > 0,
        "has_open_ports_over_limit": len(set(ports)) > 10,
        "has_insecure_services":     bool(set(services) & INSECURE_SERVICES),
        "has_database_exposed":      bool(set(ports) & DATABASE_PORTS),
        "has_scan_history":          len(scans) > 0,
        "has_misconfiguration":      any(getattr(v, "is_misconfigured", False) for v in vulnerabilities),
        "has_monitoring":            len(scans) >= 2,
        "has_auth_bypass":           any(getattr(v, "is_misconfigured", False) for v in vulnerabilities),
        "has_rdp_vnc_exposed":       bool(set(ports) & REMOTE_ACCESS),
        "has_recent_scan":           has_recent,
        "has_unresolved_critical":   any(
            s in ("open", "in_progress") and sev in ("critical", "high")
            for s, sev in zip(remediations, severities)
        ),
        "has_exploit_available":     any(getattr(v, "exploit_available", False) for v in vulnerabilities),
        "total_vulns":               len(vulnerabilities),
        "critical_count":            critical_count,
        "high_count":                high_count,
        "open_ports":                list(set(ports)),
        "services":                  list(set(services)),
    }


def _evaluate_controls(controls: list, ctx: dict, framework: str) -> list:
    """Evaluate each control against the context."""
    results = []
    for ctrl in controls:
        check  = ctrl["check"]
        flag   = ctx.get(check, False)

        # Determine status
        if check in ("has_scan_history", "has_monitoring", "has_recent_scan"):
            # These are positive checks — True = PASS
            if flag:
                status = "PASS"
                detail = "Control satisfied based on scan data."
            else:
                status = "FAIL"
                detail = "No scan data found. Run scans to satisfy this control."
        else:
            # These are negative checks — True = problem found
            if not flag:
                status = "PASS"
                detail = "No issues found for this control."
            elif check in ("has_open_ports_over_limit", "has_rdp_vnc_exposed"):
                status = "WARNING"
                detail = "Potential issue detected — review and verify."
            else:
                status = "FAIL"
                detail = f"Control violation detected in scan results."

        results.append({
            "id":          ctrl["id"],
            "title":       ctrl["title"],
            "description": ctrl["description"],
            "framework":   framework,
            "category":    ctrl.get("category") or ctrl.get("function", ""),
            "status":      status,
            "detail":      detail,
            "remediation": ctrl["remediation"],
        })

    return results