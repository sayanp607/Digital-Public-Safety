"""
Geospatial Crime Heatmap Router — Module 4
DBSCAN clustering on complaint coordinates → hotspot detection
"""

import json
import random
from datetime import datetime
from fastapi import APIRouter
import numpy as np
from sklearn.cluster import DBSCAN

router = APIRouter()

# India bounding box (approx)
LAT_RANGE = (8.0,  37.0)
LON_RANGE = (68.0, 97.0)

# Major Indian cities — seeds for realistic mock data
CITY_SEEDS = [
    {"name": "Delhi NCR",     "lat": 28.6,  "lon": 77.2,  "weight": 5},
    {"name": "Mumbai",        "lat": 19.07, "lon": 72.87, "weight": 4},
    {"name": "Bengaluru",     "lat": 12.97, "lon": 77.59, "weight": 3},
    {"name": "Hyderabad",     "lat": 17.38, "lon": 78.48, "weight": 3},
    {"name": "Kolkata",       "lat": 22.57, "lon": 88.36, "weight": 3},
    {"name": "Chennai",       "lat": 13.08, "lon": 80.27, "weight": 2},
    {"name": "Ahmedabad",     "lat": 23.02, "lon": 72.57, "weight": 2},
    {"name": "Jaipur",        "lat": 26.91, "lon": 75.79, "weight": 2},
    {"name": "Lucknow",       "lat": 26.85, "lon": 80.95, "weight": 2},
    {"name": "Chandigarh",    "lat": 30.73, "lon": 76.78, "weight": 1},
]

CRIME_TYPES = ["Digital Arrest Scam", "UPI Fraud", "OTP Scam", "Investment Fraud", "Counterfeit Currency"]


def _generate_mock_complaints(n: int = 300) -> list[dict]:
    complaints = []
    for city in CITY_SEEDS:
        count = n * city["weight"] // sum(c["weight"] for c in CITY_SEEDS)
        for _ in range(count):
            complaints.append({
                "lat":   city["lat"]  + random.gauss(0, 0.4),
                "lon":   city["lon"]  + random.gauss(0, 0.4),
                "city":  city["name"],
                "type":  random.choice(CRIME_TYPES),
                "amount_lost": random.randint(500, 500000),
                "timestamp": f"2024-{random.randint(1,12):02d}-{random.randint(1,28):02d}",
            })
    return complaints


@router.get("/heatmap")
async def get_heatmap():
    complaints = _generate_mock_complaints(300)

    coords = np.array([[c["lat"], c["lon"]] for c in complaints])
    # eps in degrees ≈ ~40km radius
    db = DBSCAN(eps=0.4, min_samples=5).fit(coords)
    labels = db.labels_

    # Build cluster summaries
    clusters = {}
    for idx, label in enumerate(labels):
        if label == -1:
            continue
        key = int(label)
        if key not in clusters:
            clusters[key] = {"complaints": [], "types": {}}
        clusters[key]["complaints"].append(complaints[idx])
        t = complaints[idx]["type"]
        clusters[key]["types"][t] = clusters[key]["types"].get(t, 0) + 1

    cluster_list = []
    for cid, data in clusters.items():
        lats = [c["lat"] for c in data["complaints"]]
        lons = [c["lon"] for c in data["complaints"]]
        dominant_type = max(data["types"], key=data["types"].get)
        cluster_list.append({
            "cluster_id":     cid,
            "centroid_lat":   float(np.mean(lats)),
            "centroid_lon":   float(np.mean(lons)),
            "complaint_count": len(data["complaints"]),
            "dominant_type":  dominant_type,
            "risk_level":     "HIGH" if len(data["complaints"]) > 20 else "MEDIUM" if len(data["complaints"]) > 10 else "LOW",
            "type_breakdown": data["types"],
        })

    return {
        "complaints": complaints,
        "clusters":   sorted(cluster_list, key=lambda x: -x["complaint_count"]),
        "total":      len(complaints),
        "timestamp":  datetime.utcnow().isoformat() + "Z",
    }
