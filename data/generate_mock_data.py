"""
Mock Data Generator
Run: python generate_mock_data.py
Generates realistic mock data for all SHIELD modules.
"""

import json
import random
from datetime import datetime, timedelta

random.seed(42)

# ── Phone number pools ────────────────────────────────────────────────────────
def fake_phone():
    return f"+91{random.randint(6,9)}{random.randint(100000000,999999999)}"

hubs   = [fake_phone() for _ in range(3)]
mules  = [fake_phone() for _ in range(8)]
victims= [fake_phone() for _ in range(20)]


# ── Call Records (for Fraud Graph) ────────────────────────────────────────────
call_records = []
for h in hubs:
    for m in random.sample(mules, 4):
        call_records.append({"from": h, "to": m, "duration": random.randint(60, 900), "type": "call"})
    for v in random.sample(victims, 6):
        call_records.append({"from": h, "to": v, "duration": random.randint(30, 3600), "type": "scam_call"})

for m in mules:
    call_records.append({"from": m, "to": "OVERSEAS_ACC_UNKNOWN", "amount": random.randint(50000, 2000000), "type": "transaction"})

with open("mock_call_records.json", "w") as f:
    json.dump(call_records, f, indent=2)
print(f"[OK] Generated {len(call_records)} call records")


# ── Complaint Data (for Geospatial) ──────────────────────────────────────────
CITIES = [
    ("Delhi NCR", 28.6, 77.2, 0.5), ("Mumbai", 19.07, 72.87, 0.4),
    ("Bengaluru", 12.97, 77.59, 0.3), ("Hyderabad", 17.38, 78.48, 0.3),
    ("Kolkata", 22.57, 88.36, 0.3), ("Chennai", 13.08, 80.27, 0.25),
    ("Ahmedabad", 23.02, 72.57, 0.2), ("Jaipur", 26.91, 75.79, 0.2),
    ("Lucknow", 26.85, 80.95, 0.2), ("Chandigarh", 30.73, 76.78, 0.15),
]
TYPES = ["Digital Arrest Scam", "UPI Fraud", "OTP Scam", "Investment Fraud", "FICN"]

complaints = []
base_date = datetime(2024, 1, 1)
for city, lat, lon, spread in CITIES:
    n = random.randint(20, 60)
    for _ in range(n):
        complaints.append({
            "city": city,
            "lat": lat + random.gauss(0, spread),
            "lon": lon + random.gauss(0, spread),
            "type": random.choice(TYPES),
            "amount_lost": random.randint(500, 500000),
            "date": (base_date + timedelta(days=random.randint(0, 365))).strftime("%Y-%m-%d"),
        })

with open("mock_complaints.json", "w") as f:
    json.dump(complaints, f, indent=2)
print(f"[OK] Generated {len(complaints)} complaint records")

print("\n[DONE] All mock data generated successfully!")
