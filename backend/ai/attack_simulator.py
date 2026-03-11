"""
Attack path simulator using NetworkX directed graphs.
Builds a network topology from scan results and finds
the highest-risk lateral movement paths.
"""
import logging
from typing import Optional

import networkx as nx

logger = logging.getLogger("attack_simulator")


class AttackSimulator:
    def __init__(self):
        self.graph = nx.DiGraph()

    # ── Graph construction ────────────────────────────────────────────────

    def add_asset(self, asset_id: str, risk: float = 0.0, **attrs):
        """Register an asset node with optional metadata."""
        self.graph.add_node(asset_id, risk=float(risk), **attrs)

    def connect(self, source: str, target: str, weight: float = 1.0):
        """Add a directed network edge (source can reach target)."""
        self.graph.add_edge(source, target, weight=weight)

    def build_from_scan_results(self, vulnerabilities: list, vms: list):
        """
        Populate graph automatically from ORM objects.
        Every VM becomes a node; internet-exposed vulns create
        an edge from a synthetic 'INTERNET' node.
        """
        self.graph.clear()
        self.graph.add_node("INTERNET", risk=0.0, label="Internet")

        vm_map = {vm.id: vm for vm in vms}

        for vm in vms:
            risk = float(getattr(vm, "risk_score", 0) or 0)
            self.add_asset(
                str(vm.id),
                risk    = risk,
                ip      = vm.ip_address,
                os      = vm.os or "unknown",
                label   = vm.hostname or vm.ip_address,
            )

        for v in vulnerabilities:
            if not v.vm_id:
                continue
            node = str(v.vm_id)
            if node not in self.graph:
                continue
            # Internet-exposed services create an inbound edge
            if getattr(v, "internet_exposed", False):
                edge_w = round(10.0 - float(v.cvss_score or 0), 2)  # lower CVSS → easier entry
                self.connect("INTERNET", node, weight=max(0.1, edge_w))

            # Lateral movement: connect to every other VM (simplified full-mesh)
            # In production, derive edges from actual network topology
            for other_vm in vms:
                other_node = str(other_vm.id)
                if other_node != node:
                    self.connect(node, other_node, weight=1.0)

    # ── Simulation ────────────────────────────────────────────────────────

    def simulate_attack(self, entry_point: str = "INTERNET") -> dict:
        """
        Find the highest-risk attack path from entry_point.
        Returns the path and aggregated risk score.
        """
        if entry_point not in self.graph:
            return {"attack_path": [], "risk_score": 0, "error": f"Entry point '{entry_point}' not in graph"}

        best_path  = []
        best_risk  = 0.0
        best_target = None

        for node in self.graph.nodes:
            if node == entry_point:
                continue
            try:
                path = nx.shortest_path(self.graph, entry_point, node, weight="weight")
                risk = sum(self.graph.nodes[n].get("risk", 0) for n in path)
                if risk > best_risk:
                    best_risk   = risk
                    best_path   = path
                    best_target = node
            except nx.NetworkXNoPath:
                pass
            except Exception as e:
                logger.debug(f"Path error {entry_point}→{node}: {e}")

        return {
            "attack_path":   best_path,
            "target_node":   best_target,
            "risk_score":    round(best_risk, 2),
            "path_length":   len(best_path),
            "nodes_in_graph": self.graph.number_of_nodes(),
            "edges_in_graph": self.graph.number_of_edges(),
        }

    def all_attack_paths(self, entry_point: str = "INTERNET", top_n: int = 5) -> list:
        """Return the top N highest-risk attack paths."""
        if entry_point not in self.graph:
            return []

        paths = []
        for node in self.graph.nodes:
            if node == entry_point:
                continue
            try:
                path = nx.shortest_path(self.graph, entry_point, node, weight="weight")
                risk = sum(self.graph.nodes[n].get("risk", 0) for n in path)
                paths.append({
                    "path":   path,
                    "target": node,
                    "risk":   round(risk, 2),
                })
            except (nx.NetworkXNoPath, Exception):
                pass

        paths.sort(key=lambda x: x["risk"], reverse=True)
        return paths[:top_n]

    def get_graph_data(self) -> dict:
        """Serialise graph for frontend topology visualisation."""
        nodes = [
            {
                "id":    n,
                "risk":  self.graph.nodes[n].get("risk", 0),
                "label": self.graph.nodes[n].get("label", n),
                "ip":    self.graph.nodes[n].get("ip", ""),
                "os":    self.graph.nodes[n].get("os", ""),
            }
            for n in self.graph.nodes
        ]
        edges = [
            {"source": u, "target": v, "weight": d.get("weight", 1.0)}
            for u, v, d in self.graph.edges(data=True)
        ]
        return {"nodes": nodes, "edges": edges}