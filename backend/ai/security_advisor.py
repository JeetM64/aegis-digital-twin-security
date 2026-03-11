def generate_recommendations(vulnerabilities):

    recommendations = []

    for v in vulnerabilities:

        if v.port == 21:
            recommendations.append(
                "Disable FTP service or restrict access"
            )

        if v.port == 22:
            recommendations.append(
                "Limit SSH access using firewall rules"
            )

        if v.cvss_score and v.cvss_score > 8:
            recommendations.append(
                "Patch high severity vulnerability immediately"
            )

    return list(set(recommendations))