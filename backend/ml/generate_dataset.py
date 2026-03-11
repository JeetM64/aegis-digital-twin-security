import pandas as pd
import random

rows = []

ports = [21,22,23,25,53,80,110,139,143,443,445,3306,3389]
services = {
    21:0.9,
    22:0.6,
    23:0.95,
    25:0.5,
    53:0.4,
    80:0.7,
    110:0.6,
    139:0.8,
    143:0.6,
    443:0.7,
    445:0.9,
    3306:0.8,
    3389:0.85
}

for i in range(5000):

    port = random.choice(ports)

    cvss = round(random.uniform(3,10),2)

    internet_exposed = random.choice([0,1])

    service_risk = services[port]

    patch_age = random.randint(0,5)

    exploit_available = random.choice([0,1])

    service_popularity = round(random.uniform(0.3,1.0),2)

    auth_required = random.choice([0,1])

    known_cve_count = random.randint(0,20)

    misconfig_score = round(random.uniform(0,1),2)

    network_depth = random.randint(1,5)

    critical_asset = random.choice([0,1])

    # Label logic (simulating real exploit probability)

    risk = (
        cvss * 0.25
        + exploit_available * 2
        + internet_exposed * 1.5
        + service_risk * 2
        + patch_age * 0.5
        + known_cve_count * 0.05
        + misconfig_score * 1
        + critical_asset * 1
    )

    label = 1 if risk > 5 else 0

    rows.append([
        port,
        cvss,
        internet_exposed,
        service_risk,
        patch_age,
        exploit_available,
        service_popularity,
        auth_required,
        known_cve_count,
        misconfig_score,
        network_depth,
        critical_asset,
        label
    ])

columns = [
    "port",
    "cvss_score",
    "internet_exposed",
    "service_risk",
    "patch_age",
    "exploit_available",
    "service_popularity",
    "auth_required",
    "known_cve_count",
    "misconfig_score",
    "network_depth",
    "critical_asset",
    "label"
]

df = pd.DataFrame(rows, columns=columns)

df.to_csv("ml/dataset.csv", index=False)

print("Dataset created with", len(df), "rows")