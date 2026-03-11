from attack_graph import AttackGraph

g = AttackGraph()

g.add_host("internet", 0)
g.add_host("web", 12)
g.add_host("app", 8)
g.add_host("db", 5)

g.connect_hosts("internet", "web")
g.connect_hosts("web", "app")
g.connect_hosts("app", "db")

path = g.most_risky_path("internet")

print(path)