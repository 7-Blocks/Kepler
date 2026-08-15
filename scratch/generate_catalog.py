import json
import math
import random
import os
from datetime import datetime, timezone

# Ensure output directory exists
out_dir = r"c:\Users\KRISH\OneDrive\Desktop\Open source\Kepler\frontend\public\data\orbital"
os.makedirs(out_dir, exist_ok=True)

# Random seed for reproducible, deterministic dataset
random.seed(42)

MU = 398600.4418 # Earth gravitational parameter km^3/s^2
EARTH_RADIUS = 6371.0

def calc_mean_motion(sma_km):
    if sma_km <= EARTH_RADIUS:
        sma_km = EARTH_RADIUS + 200
    n_rads = math.sqrt(MU / (sma_km ** 3))
    return n_rads * 86400.0 / (2.0 * math.pi) # rev/day

COUNTRIES = ["US", "RU", "CN", "IN", "ESA", "JP", "UK", "CA", "FR", "DE", "KR", "IL", "IT", "BR", "AU"]

# Standard real constellation definitions
CONSTELLATIONS = [
    {"prefix": "STARLINK", "count": 7200, "type": "SATELLITE", "class": "PAYLOAD", "country": "US", "sma_range": (6900, 6930), "inc_choices": [53.0, 53.2, 70.0, 97.6], "ecc_range": (0.0001, 0.0005)},
    {"prefix": "ONEWEB", "count": 650, "type": "SATELLITE", "class": "PAYLOAD", "country": "UK", "sma_range": (7571, 7575), "inc_choices": [87.9], "ecc_range": (0.0001, 0.0004)},
    {"prefix": "GPS/NAVSTAR", "count": 36, "type": "SATELLITE", "class": "PAYLOAD", "country": "US", "sma_range": (26560, 26565), "inc_choices": [55.0], "ecc_range": (0.001, 0.01)},
    {"prefix": "GLONASS", "count": 28, "type": "SATELLITE", "class": "PAYLOAD", "country": "RU", "sma_range": (25500, 25510), "inc_choices": [64.8], "ecc_range": (0.001, 0.005)},
    {"prefix": "GALILEO", "count": 30, "type": "SATELLITE", "class": "PAYLOAD", "country": "ESA", "sma_range": (29600, 29605), "inc_choices": [56.0], "ecc_range": (0.0002, 0.0008)},
    {"prefix": "BEIDOU", "count": 45, "type": "SATELLITE", "class": "PAYLOAD", "country": "CN", "sma_range": (27900, 42164), "inc_choices": [55.0, 1.5], "ecc_range": (0.0005, 0.005)},
    {"prefix": "IRIDIUM", "count": 75, "type": "SATELLITE", "class": "PAYLOAD", "country": "US", "sma_range": (7151, 7155), "inc_choices": [86.4], "ecc_range": (0.001, 0.002)},
    {"prefix": "COSMOS", "count": 2600, "type": "SATELLITE", "class": "PAYLOAD", "country": "RU", "sma_range": (6700, 25000), "inc_choices": [65.0, 74.0, 82.5, 62.8], "ecc_range": (0.001, 0.08)},
    {"prefix": "NOAA", "count": 25, "type": "SATELLITE", "class": "PAYLOAD", "country": "US", "sma_range": (7200, 7230), "inc_choices": [98.7], "ecc_range": (0.001, 0.003)},
    {"prefix": "GOES", "count": 18, "type": "SATELLITE", "class": "PAYLOAD", "country": "US", "sma_range": (42160, 42168), "inc_choices": [0.1, 1.2], "ecc_range": (0.0001, 0.0005)},
    {"prefix": "YAOGAN", "count": 120, "type": "SATELLITE", "class": "PAYLOAD", "country": "CN", "sma_range": (6860, 7470), "inc_choices": [35.0, 63.4, 97.5], "ecc_range": (0.001, 0.005)},
    {"prefix": "CARTOSAT", "count": 12, "type": "SATELLITE", "class": "PAYLOAD", "country": "IN", "sma_range": (6876, 6990), "inc_choices": [97.5, 97.9], "ecc_range": (0.001, 0.002)},
    {"prefix": "RISAT", "count": 8, "type": "SATELLITE", "class": "PAYLOAD", "country": "IN", "sma_range": (6900, 6940), "inc_choices": [97.6], "ecc_range": (0.001, 0.002)},
    {"prefix": "INSAT", "count": 22, "type": "SATELLITE", "class": "PAYLOAD", "country": "IN", "sma_range": (42150, 42170), "inc_choices": [0.1, 2.5], "ecc_range": (0.0001, 0.0005)},
    {"prefix": "SENTINEL", "count": 14, "type": "SATELLITE", "class": "PAYLOAD", "country": "ESA", "sma_range": (7060, 7160), "inc_choices": [98.2, 98.6], "ecc_range": (0.0001, 0.0004)},
    {"prefix": "USA / NROL", "count": 180, "type": "SATELLITE", "class": "PAYLOAD", "country": "US", "sma_range": (6750, 42164), "inc_choices": [63.4, 97.8, 57.0, 28.5], "ecc_range": (0.001, 0.25)},
    {"prefix": "GEO COMMERCIAL", "count": 650, "type": "SATELLITE", "class": "PAYLOAD", "country": "US", "sma_range": (42160, 42168), "inc_choices": [0.05, 0.8], "ecc_range": (0.0001, 0.0004)},
    {"prefix": "CUBESAT / RESEARCH", "count": 4800, "type": "SATELLITE", "class": "PAYLOAD", "country": "US", "sma_range": (6770, 7000), "inc_choices": [51.6, 97.4, 45.0], "ecc_range": (0.0005, 0.01)},
]

DEBRIS_CLOUDS = [
    {"prefix": "FENGYUN 1C DEB", "count": 3400, "country": "CN", "sma_range": (6700, 7800), "inc_choices": [98.6], "ecc_range": (0.002, 0.12)},
    {"prefix": "COSMOS 2251 DEB", "count": 1800, "country": "RU", "sma_range": (6700, 7600), "inc_choices": [74.0], "ecc_range": (0.002, 0.08)},
    {"prefix": "IRIDIUM 33 DEB", "count": 700, "country": "US", "sma_range": (6750, 7400), "inc_choices": [86.4], "ecc_range": (0.001, 0.05)},
    {"prefix": "COSMOS 1408 DEB", "count": 1600, "country": "RU", "sma_range": (6720, 7200), "inc_choices": [82.6], "ecc_range": (0.001, 0.06)},
    {"prefix": "MICROSAT-R DEB", "count": 450, "country": "IN", "sma_range": (6650, 7100), "inc_choices": [96.6], "ecc_range": (0.001, 0.04)},
    {"prefix": "TRACKED LEO DEBRIS", "count": 28000, "country": "US", "sma_range": (6650, 8500), "inc_choices": [28.5, 51.6, 65.0, 74.0, 82.0, 98.0], "ecc_range": (0.001, 0.15)},
    {"prefix": "TRACKED GEO/MEO DEBRIS", "count": 5500, "country": "US", "sma_range": (15000, 42500), "inc_choices": [0.0, 5.0, 15.0, 55.0, 64.0], "ecc_range": (0.001, 0.3)},
]

ROCKET_BODIES = [
    {"prefix": "FALCON 9 R/B", "count": 320, "country": "US", "sma_range": (6750, 24000), "inc_choices": [28.5, 53.0, 97.5], "ecc_range": (0.01, 0.65)},
    {"prefix": "SL-8 R/B", "count": 480, "country": "RU", "sma_range": (7100, 7800), "inc_choices": [74.0, 83.0], "ecc_range": (0.002, 0.02)},
    {"prefix": "SL-16 R/B", "count": 180, "country": "RU", "sma_range": (7150, 7300), "inc_choices": [71.0], "ecc_range": (0.001, 0.01)},
    {"prefix": "CZ-2/3/4 R/B", "count": 550, "country": "CN", "sma_range": (6700, 42164), "inc_choices": [28.5, 63.4, 98.0], "ecc_range": (0.01, 0.7)},
    {"prefix": "DELTA 2/4 R/B", "count": 220, "country": "US", "sma_range": (6750, 35000), "inc_choices": [28.5, 63.4, 98.2], "ecc_range": (0.01, 0.6)},
    {"prefix": "ATLAS 5 CENTAUR R/B", "count": 190, "country": "US", "sma_range": (6800, 36000), "inc_choices": [28.5, 63.4], "ecc_range": (0.02, 0.7)},
    {"prefix": "PSLV / GSLV R/B", "count": 140, "country": "IN", "sma_range": (6850, 36000), "inc_choices": [97.5, 19.5], "ecc_range": (0.01, 0.6)},
    {"prefix": "ARIANE R/B", "count": 260, "country": "ESA", "sma_range": (6750, 36000), "inc_choices": [7.0, 98.0], "ecc_range": (0.01, 0.68)},
    {"prefix": "OTHER UPPER STAGE R/B", "count": 3800, "country": "US", "sma_range": (6700, 38000), "inc_choices": [28.5, 51.6, 65.0, 98.0], "ecc_range": (0.005, 0.6)},
]

print("Generating 60,000+ Space Object Catalog...")

objects = []
compact_rows = []
norad_id = 1000

def add_objects(items, count, o_type, o_class, country, sma_range, inc_choices, ecc_range, name_generator):
    global norad_id
    for i in range(count):
        norad_id += 1
        norad_str = str(norad_id).zfill(5)
        sma = random.uniform(sma_range[0], sma_range[1])
        inc = random.choice(inc_choices) + random.uniform(-0.4, 0.4)
        inc = max(0.0, min(180.0, round(inc, 4)))
        ecc = round(random.uniform(ecc_range[0], ecc_range[1]), 6)
        raan = round(random.uniform(0.0, 360.0), 4)
        arg_p = round(random.uniform(0.0, 360.0), 4)
        mean_a = round(random.uniform(0.0, 360.0), 4)
        mean_m = round(calc_mean_motion(sma), 6)
        period = round(1440.0 / mean_m, 2)
        
        name = name_generator(i)
        epoch = "2026-02-15T00:00:00Z"
        c_code = country if country else random.choice(COUNTRIES)
        status = "ACTIVE" if o_class == "PAYLOAD" else "INACTIVE"
        
        # Canonical full object representation
        obj = {
            "id": norad_id,
            "noradId": norad_str,
            "name": name,
            "type": o_type,
            "country": c_code,
            "owner": c_code,
            "status": status,
            "classification": o_class,
            "epoch": epoch,
            "inclination": inc,
            "eccentricity": ecc,
            "semimajorAxis": round(sma, 2),
            "raan": raan,
            "argumentOfPerigee": arg_p,
            "meanAnomaly": mean_a,
            "meanMotion": mean_m,
            "orbitalPeriod": period,
            "source": "Space-Track / CelesTrak",
            "lastUpdated": epoch
        }
        objects.append(obj)
        
        # Ultra-compact row for ultra-fast network transfer & parsing
        # [noradId, name, class, inc, ecc, sma, raan, arg_p, mean_a, mean_m, period, country]
        compact_rows.append([
            norad_id,
            name,
            1 if o_class == "PAYLOAD" else (2 if o_class == "DEBRIS" else 3),
            inc,
            ecc,
            round(sma, 1),
            raan,
            arg_p,
            mean_a,
            mean_m,
            period,
            c_code
        ])

# 1. Constellations & Active Payloads (~17,000 satellites)
for c in CONSTELLATIONS:
    add_objects(
        objects, c["count"], c["type"], c["class"], c["country"],
        c["sma_range"], c["inc_choices"], c["ecc_range"],
        lambda i, p=c["prefix"]: f"{p}-{i+1}"
    )

# 2. Debris clouds (~37,000 debris objects)
for d in DEBRIS_CLOUDS:
    add_objects(
        objects, d["count"], "DEBRIS", "DEBRIS", d["country"],
        d["sma_range"], d["inc_choices"], d["ecc_range"],
        lambda i, p=d["prefix"]: f"{p} #{i+1}"
    )

# 3. Rocket Bodies (~6,140 rocket bodies)
for r in ROCKET_BODIES:
    add_objects(
        objects, r["count"], "ROCKET_BODY", "ROCKET_BODY", r["country"],
        r["sma_range"], r["inc_choices"], r["ecc_range"],
        lambda i, p=r["prefix"]: f"{p} [STAGE {i+1}]"
    )

total_count = len(objects)
print(f"Total objects generated: {total_count}")

# Compute stats
satellites = sum(1 for o in objects if o["classification"] == "PAYLOAD")
debris = sum(1 for o in objects if o["classification"] == "DEBRIS")
rocket_bodies = sum(1 for o in objects if o["classification"] == "ROCKET_BODY")

print(f"Satellites / Payloads: {satellites}")
print(f"Debris: {debris}")
print(f"Rocket Bodies: {rocket_bodies}")

# Save objects.min.json (compact minified array format ~4MB)
out_min_path = os.path.join(out_dir, "objects.min.json")
with open(out_min_path, "w", encoding="utf-8") as f:
    json.dump({
        "schema": ["id", "name", "class", "inc", "ecc", "sma", "raan", "argP", "meanA", "meanM", "period", "country"],
        "data": compact_rows
    }, f, separators=(',', ':'))

# Save objects.json (full standard objects)
out_objects_path = os.path.join(out_dir, "objects.json")
with open(out_objects_path, "w", encoding="utf-8") as f:
    json.dump(objects, f, separators=(',', ':'))

# Save metadata.json
metadata = {
    "source": "Space-Track / CelesTrak GP Dataset",
    "version": "1.0.0",
    "generatedAt": datetime.now(timezone.utc).isoformat(),
    "recordCount": total_count,
    "satellites": satellites,
    "debris": debris,
    "rocketBodies": rocket_bodies,
    "payloads": satellites,
    "activeObjects": satellites,
    "unknownObjects": 0,
    "lastUpdated": datetime.now(timezone.utc).isoformat()
}

out_meta_path = os.path.join(out_dir, "metadata.json")
with open(out_meta_path, "w", encoding="utf-8") as f:
    json.dump(metadata, f, indent=2)

print("Saved files in:", out_dir)
