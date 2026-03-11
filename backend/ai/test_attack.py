from attack_simulator import AttackSimulator

sim = AttackSimulator()

sim.add_asset("internet", 0)
sim.add_asset("web_server", 15)
sim.add_asset("app_server", 10)
sim.add_asset("database", 6)

sim.connect("internet", "web_server")
sim.connect("web_server", "app_server")
sim.connect("app_server", "database")

result = sim.simulate_attack("internet")

print(result)