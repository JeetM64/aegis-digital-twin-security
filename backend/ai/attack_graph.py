import networkx as nx

class AttackGraph:

    def __init__(self):

        self.graph = nx.DiGraph()

    def add_host(self, host_id, risk_score):

        self.graph.add_node(
            host_id,
            risk=risk_score
        )

    def connect_hosts(self, source, target):

        self.graph.add_edge(source, target)

    def most_risky_path(self, entry):

        paths = []

        for node in self.graph.nodes:

            if node == entry:
                continue

            try:

                path = nx.shortest_path(self.graph, entry, node)

                risk = sum(
                    self.graph.nodes[n]["risk"]
                    for n in path
                )

                paths.append((path, risk))

            except:
                pass

        if not paths:
            return None

        paths.sort(key=lambda x: x[1], reverse=True)

        return paths[0]