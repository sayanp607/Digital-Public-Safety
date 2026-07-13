"""
Fraud Network Graph Router — Module 3
Uses NetworkX to analyse mock call/transaction data and detect fraud rings.
"""

import json
import random
import hashlib
from datetime import datetime
from fastapi import APIRouter
from pydantic import BaseModel
import networkx as nx

router = APIRouter()


def _build_graph_from_records(records: list[dict]) -> nx.DiGraph:
    """Build a directed graph from call/transaction records."""
    G = nx.DiGraph()
    for rec in records:
        src = str(rec.get("from", rec.get("source", "")))
        dst = str(rec.get("to",   rec.get("target", "")))
        weight = float(rec.get("amount", rec.get("duration", 1)))
        if src and dst:
            if G.has_edge(src, dst):
                G[src][dst]["weight"] += weight
                G[src][dst]["count"]  += 1
            else:
                G.add_edge(src, dst, weight=weight, count=1)
    return G


def _classify_node(G: nx.DiGraph, node: str) -> str:
    in_deg  = G.in_degree(node)
    out_deg = G.out_degree(node)
    if out_deg > 5 and in_deg < 2:
        return "SCAMMER_HUB"
    if in_deg > 3 and out_deg > 3:
        return "MONEY_MULE"
    if in_deg == 0 and out_deg > 0:
        return "VICTIM"
    return "UNKNOWN"


def _graph_to_vis(G: nx.DiGraph) -> dict:
    """Convert NetworkX graph to vis-network / D3 format."""
    colour_map = {
        "SCAMMER_HUB": "#ef4444",
        "MONEY_MULE":  "#f59e0b",
        "VICTIM":      "#22c55e",
        "UNKNOWN":     "#3b82f6",
    }
    nodes = []
    for node in G.nodes():
        role  = _classify_node(G, node)
        score = min(100, G.out_degree(node) * 10 + G.in_degree(node) * 5)
        nodes.append({
            "id":    node,
            "label": node,
            "role":  role,
            "color": colour_map[role],
            "risk_score": score,
            "in_degree":  G.in_degree(node),
            "out_degree": G.out_degree(node),
        })
    edges = [
        {"from": u, "to": v, "weight": d["weight"], "count": d["count"]}
        for u, v, d in G.edges(data=True)
    ]
    return {"nodes": nodes, "edges": edges}


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/demo")
async def get_demo_graph():
    """Return a pre-generated demo fraud network (no upload required)."""
    # Load from data directory
    try:
        with open("../data/mock_call_records.json") as f:
            records = json.load(f)
    except FileNotFoundError:
        # Inline fallback demo data
        records = _generate_demo_records()

    G = _build_graph_from_records(records)
    vis = _graph_to_vis(G)
    stats = {
        "total_nodes":    G.number_of_nodes(),
        "total_edges":    G.number_of_edges(),
        "scammer_hubs":   sum(1 for n in G.nodes() if _classify_node(G, n) == "SCAMMER_HUB"),
        "money_mules":    sum(1 for n in G.nodes() if _classify_node(G, n) == "MONEY_MULE"),
        "victims":        sum(1 for n in G.nodes() if _classify_node(G, n) == "VICTIM"),
        "audit_timestamp": datetime.utcnow().isoformat() + "Z",
    }
    return {"graph": vis, "stats": stats}


def _generate_demo_records() -> list[dict]:
    """Inline mock data generator as fallback."""
    hubs   = [f"98{random.randint(10,99)}{random.randint(100000,999999)}" for _ in range(3)]
    mules  = [f"80{random.randint(10,99)}{random.randint(100000,999999)}" for _ in range(6)]
    victims= [f"70{random.randint(10,99)}{random.randint(100000,999999)}" for _ in range(12)]
    records = []
    for h in hubs:
        for m in random.sample(mules, 3):
            records.append({"from": h, "to": m, "amount": random.randint(10000, 500000)})
        for v in random.sample(victims, 4):
            records.append({"from": h, "to": v, "amount": 0, "duration": random.randint(30, 1800)})
    for m in mules:
        records.append({"from": m, "to": "FINAL_ACCOUNT_UNKNOWN", "amount": random.randint(50000, 2000000)})
    return records
