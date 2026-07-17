#!/usr/bin/env python
"""
Kepler Database Seeding Script
================================
Populates the PostgreSQL database with realistic sample data.
"""

import os
import sys
import argparse
import random
import datetime
import math

current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from database.session import SessionLocal, engine, Base
import models.db_models  # noqa: F401 — registers all tables with Base.metadata
from models.db_models import (
    Satellite, Debris, SpaceObject, Organization, Telemetry,
    CollisionPrediction, Role, User,
)

SATELLITE_NAMES = {
    "US": ["GPS", "IRIDIUM", "STARLINK", "LANDSAT", "NOAA", "AURA", "TERRA", "GOES"],
    "IN": ["CARTOSAT", "RESOURCESAT", "INSAT", "RISAT", "GSAT", "EOS"],
    "CN": ["YAOGAN", "BEIDOU", "SHIYAN", "FENGYUN", "GAOFEN"],
    "RU": ["COSMOS", "GLONASS", "SOYUZ", "METEOR", "RESURS"],
    "ESA": ["SENTINEL", "METEOSAT", "ENVISAT", "CRYOSAT"],
    "JP": ["ALOS", "HIMAWARI", "GCOM", "ASNARO"],
    "CA": ["RADARSAT", "CASSIOPE", "SCISAT"],
}

DEBRIS_NAMES = [
    "FENGYUN 1C DEBRIS", "COSMOS 2251 DEBRIS", "IRIDIUM 33 DEBRIS",
    "DELTA 2 ROCKET BODY DEBRIS", "TITAN 3C DEBRIS", "CZ-4B DEBRIS",
    "SL-8 ROCKET BODY DEBRIS", "ASAT TEST DEBRIS",
]


def calculate_semimajor_axis(mean_motion_revday: float) -> float:
    if mean_motion_revday <= 0:
        return 6778.0
    n_rads = mean_motion_revday * 2 * math.pi / 86400.0
    return (398600.4418 / (n_rads ** 2)) ** (1.0 / 3.0)


def generate_tle(norad_id: str, incl: float, ecc: float, mean_motion: float):
    nid = str(norad_id).zfill(5)
    year = str(random.randint(15, 26))
    cospar = f"{year}{random.randint(1, 99):03d}{random.choice(['A', 'B', 'C'])}"
    epoch_day = f"{random.randint(1, 365):03d}.{random.randint(10000000, 99999999)}"

    def checksum(line: str) -> int:
        c = 0
        for ch in line[:68]:
            if ch.isdigit():
                c += int(ch)
            elif ch == "-":
                c += 1
        return c % 10

    line1 = f"1 {nid}U {cospar:<8} {year}{epoch_day:>12}  .00002182  00000-0  10000-3 0  999"
    line1 = line1[:68].ljust(68)
    line1 = f"{line1}{checksum(line1)}"

    raan = random.uniform(0, 360)
    arg_p = random.uniform(0, 360)
    mean_anomaly = random.uniform(0, 360)
    ecc_str = f"{int(ecc * 10000000):07d}"[:7]
    rev_num = random.randint(1000, 99999)

    line2 = f"2 {nid} {incl:8.4f} {raan:8.4f} {ecc_str} {arg_p:8.4f} {mean_anomaly:8.4f} {mean_motion:11.8f}{rev_num:5d}"
    line2 = line2[:68].ljust(68)
    line2 = f"{line2}{checksum(line2)}"

    return line1, line2


def seed_database(count: int, clear: bool):
    print("🔌 Connecting to PostgreSQL...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        if clear:
            print("🧹 Clearing existing records...")
            for model in [CollisionPrediction, Telemetry, Debris, Satellite, SpaceObject, Organization]:
                db.query(model).delete()
            db.commit()

        # 1. Organizations
        print("🏢 Seeding organizations...")
        orgs_data = [
            {"name": "NASA",   "description": "National Aeronautics and Space Administration"},
            {"name": "ISRO",   "description": "Indian Space Research Organisation"},
            {"name": "ESA",    "description": "European Space Agency"},
            {"name": "SpaceX", "description": "Space Exploration Technologies Corp."},
            {"name": "OneWeb", "description": "Eutelsat OneWeb Satellite Network"},
        ]
        seeded_orgs = []
        for od in orgs_data:
            org = db.query(Organization).filter(Organization.name == od["name"]).first()
            if not org:
                org = Organization(**od)
                db.add(org)
                db.commit()
                db.refresh(org)
                print(f"   + Created: {org.name} (ID: {org.id})")
            else:
                print(f"   • Exists:  {org.name} (ID: {org.id})")
            seeded_orgs.append(org)

        used_norad_ids: set = set()
        if not clear:
            for row in db.query(Satellite.noradId).all():
                used_norad_ids.add(row[0])
            for row in db.query(Debris.noradId).all():
                used_norad_ids.add(row[0])

        # 2. Satellites
        print(f"🛰️  Generating {count} satellites...")
        satellites_list = []
        for i in range(count):
            country = random.choice(list(SATELLITE_NAMES.keys()))
            prefix  = random.choice(SATELLITE_NAMES[country])
            suffix  = f"-{random.randint(100, 999)}" if prefix in ["STARLINK", "SENTINEL"] else f" {random.randint(1, 20)}"
            name    = f"{prefix}{suffix}"

            norad_id = str(random.randint(10000, 49999))
            while norad_id in used_norad_ids:
                norad_id = str(random.randint(10000, 49999))
            used_norad_ids.add(norad_id)

            inclination  = random.uniform(50.0, 105.0)
            eccentricity = random.uniform(0.0001, 0.01)
            mean_motion  = random.uniform(14.0, 16.2)
            semimajor    = calculate_semimajor_axis(mean_motion)
            period       = 1440.0 / mean_motion
            epoch        = (datetime.datetime.utcnow() - datetime.timedelta(days=random.uniform(0, 5))).isoformat()
            launch_date  = (datetime.date.today() - datetime.timedelta(days=random.randint(100, 5000))).isoformat()
            tle1, tle2   = generate_tle(norad_id, inclination, eccentricity, mean_motion)
            org          = random.choice(seeded_orgs)

            space_obj = SpaceObject(
                noradId=norad_id, objectName=name, objectType="PAYLOAD",
                cospar_id=f"{random.randint(2010, 2026)}-{random.randint(1, 100):03d}{random.choice(['A','B','C'])}",
                epoch=epoch, inclination=inclination, eccentricity=eccentricity,
                semimajor_axis=semimajor, period=period, mean_motion=mean_motion,
                tle_line1=tle1, tle_line2=tle2,
            )
            db.add(space_obj)
            db.commit()
            db.refresh(space_obj)

            status_val = "ACTIVE" if i == 0 else random.choice(["ACTIVE", "ACTIVE", "ACTIVE", "DEGRADED", "INACTIVE"])
            sat = Satellite(
                noradId=norad_id, objectName=name, objectType="PAYLOAD",
                countryCode=country, launchDate=launch_date, epoch=epoch,
                inclination=inclination, eccentricity=eccentricity, meanMotion=mean_motion,
                source="seed_script", space_object_id=space_obj.id, organization_id=org.id,
                status=status_val, fuel_percentage=random.uniform(15.0, 100.0),
                dry_mass=random.uniform(150.0, 1800.0), propellant_mass=random.uniform(20.0, 800.0),
                operational_mode=random.choice(["NORMAL", "NORMAL", "NORMAL", "SAFE", "STANDBY"]),
                semimajor_axis=semimajor, period=period, tle_line1=tle1, tle_line2=tle2,
            )
            db.add(sat)
            db.commit()
            db.refresh(sat)
            satellites_list.append(sat)

        print(f"   + Seeded {len(satellites_list)} satellites.")

        # 3. Telemetry
        print("📈 Seeding telemetry...")
        telemetry_count = 0
        for sat in satellites_list:
            if sat.status in ("ACTIVE", "DEGRADED"):
                base_alt = (sat.semimajor_axis or 6778.0) - 6378.1
                for j in range(5):
                    ts = datetime.datetime.utcnow() - datetime.timedelta(minutes=10 * j)
                    db.add(Telemetry(
                        satellite_id=sat.id, timestamp=ts,
                        altitude_km=base_alt + random.uniform(-2.0, 2.0),
                        velocity_kms=7.5 + random.uniform(-0.1, 0.1),
                        temperature_c=random.uniform(-5.0, 35.0),
                        battery_charge=max(0.0, min(100.0, (sat.fuel_percentage or 80.0) + random.uniform(-5.0, 5.0))),
                        neural_load=random.uniform(10.0, 90.0),
                    ))
                    telemetry_count += 1
                db.commit()
        print(f"   + Seeded {telemetry_count} telemetry points.")

        # 4. Debris
        debris_count_target = max(5, count // 2)
        print(f"☄️  Generating {debris_count_target} debris records...")
        debris_list = []
        for _ in range(debris_count_target):
            name = f"{random.choice(DEBRIS_NAMES)} [#{random.randint(1000, 9999)}]"
            norad_id = str(random.randint(50000, 89999))
            while norad_id in used_norad_ids:
                norad_id = str(random.randint(50000, 89999))
            used_norad_ids.add(norad_id)

            inclination  = random.uniform(50.0, 110.0)
            eccentricity = random.uniform(0.0005, 0.05)
            mean_motion  = random.uniform(13.5, 16.5)
            semimajor    = calculate_semimajor_axis(mean_motion)
            period       = 1440.0 / mean_motion
            epoch        = (datetime.datetime.utcnow() - datetime.timedelta(days=random.uniform(0, 10))).isoformat()
            tle1, tle2   = generate_tle(norad_id, inclination, eccentricity, mean_motion)

            space_obj = SpaceObject(
                noradId=norad_id, objectName=name, objectType="DEBRIS",
                epoch=epoch, inclination=inclination, eccentricity=eccentricity,
                semimajor_axis=semimajor, period=period, mean_motion=mean_motion,
                tle_line1=tle1, tle_line2=tle2,
            )
            db.add(space_obj)
            db.commit()
            db.refresh(space_obj)

            deb = Debris(
                noradId=norad_id, objectName=name, epoch=epoch,
                inclination=inclination, eccentricity=eccentricity, meanMotion=mean_motion,
                source="seed_script", space_object_id=space_obj.id,
                size_category=random.choice(["SMALL", "MEDIUM", "LARGE"]),
                radar_cross_section=random.uniform(0.01, 15.0),
                average_mass=random.uniform(0.5, 200.0),
                semimajor_axis=semimajor, period=period, tle_line1=tle1, tle_line2=tle2,
            )
            db.add(deb)
            db.commit()
            db.refresh(deb)
            debris_list.append(deb)

        print(f"   + Seeded {len(debris_list)} debris records.")

        # 5. Conjunctions
        print("💥 Seeding conjunctions...")
        num_conj = min(5, len(satellites_list), len(debris_list))
        for i in range(num_conj):
            sat = satellites_list[i]
            deb = debris_list[i]
            miss_distance = random.uniform(10.0, 800.0)
            prob          = random.uniform(0.001, 0.45)
            if miss_distance < 50.0 or prob > 0.1:
                risk_level = "CRITICAL"
            elif miss_distance < 150.0 or prob > 0.01:
                risk_level = "HIGH"
            elif miss_distance < 500.0 or prob > 0.001:
                risk_level = "MEDIUM"
            else:
                risk_level = "LOW"
            tca = datetime.datetime.utcnow() + datetime.timedelta(hours=random.uniform(4, 72))
            db.add(CollisionPrediction(
                primaryObject=sat.noradId, secondaryObject=deb.noradId,
                missDistance=miss_distance, riskScore=prob, conjunctionTime=tca,
                object_a_id=sat.space_object_id, object_b_id=deb.space_object_id,
                relative_velocity_kms=random.uniform(8.0, 15.0),
                risk_level=risk_level, status="PENDING",
            ))
        db.commit()
        print(f"   + Seeded {num_conj} conjunctions.")

        print("\n🎉 Seeding complete!")
        print(f"   - {len(seeded_orgs)} Organizations")
        print(f"   - {len(satellites_list)} Satellites")
        print(f"   - {telemetry_count} Telemetry records")
        print(f"   - {len(debris_list)} Debris records")
        print(f"   - {num_conj} Conjunctions")

    except Exception as e:
        db.rollback()
        print(f"❌ Seeding failed: {e}")
        raise
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Seed Kepler PostgreSQL database.")
    parser.add_argument("--count", "-c", type=int, default=50)
    parser.add_argument("--clear", "-x", action="store_true")
    args = parser.parse_args()
    if args.count <= 0:
        print("❌ Count must be positive.")
        sys.exit(1)
    try:
        seed_database(count=args.count, clear=args.clear)
    except Exception as e:
        print(f"❌ Seeding process failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
