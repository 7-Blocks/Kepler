#!/usr/bin/env python
"""
Kepler Database Seeding Script
===============================
Populates the MongoDB database with realistic sample satellite, organization,
telemetry, and conjunction records for local development and testing.
"""

import os
import sys
import argparse
import random
import datetime
import math

# Add backend directory to system path to resolve imports correctly
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.config import settings
from database.session import SessionLocal, get_mongo_client, uri_db_name
from models.db_models import (
    Satellite,
    Debris,
    SpaceObject,
    Organization,
    Telemetry,
    CollisionPrediction,
    Role,
    User
)

# Realistic satellite names by country
SATELLITE_NAMES = {
    "US": ["GPS", "IRIDIUM", "STARLINK", "LANDSAT", "NOAA", "AURA", "TERRA", "GOES", "AEOLUS"],
    "IN": ["CARTOSAT", "RESOURCESAT", "INSAT", "RISAT", "GSAT", "EOS", "OCEANSAT", "MOM"],
    "CN": ["YAOGAN", "BEIDOU", "SHIYAN", "FENGYUN", "GAOFEN", "TIANHUI", "QUEQIAO"],
    "RU": ["COSMOS", "GLONASS", "SOYUZ", "METEOR", "RESURS", "ELEKTRO", "LUCH"],
    "ESA": ["SENTINEL", "METEOSAT", "ENVISAT", "CRYOSAT", "PROBA", "SOLAR-ORBITER"],
    "JP": ["ALOS", "HIMAWARI", "GCOM", "ASNARO", "QZSS", "IBUKI", "ARASE"],
    "CA": ["RADARSAT", "CASSIOPE", "SCISAT", "M3MSAT"],
}

DEBRIS_NAMES = [
    "FENGYUN 1C DEBRIS",
    "COSMOS 2251 DEBRIS",
    "IRIDIUM 33 DEBRIS",
    "DELTA 2 ROCKET BODY DEBRIS",
    "TITAN 3C DEBRIS",
    "CZ-4B DEBRIS",
    "PEASASAT DEBRIS",
    "SL-8 ROCKET BODY DEBRIS",
    "ASAT TEST DEBRIS",
    "SPUTNIK DEBRIS",
]


def calculate_semimajor_axis(mean_motion_revday: float) -> float:
    """Convert mean motion (rev/day) to semi-major axis (km)."""
    if mean_motion_revday <= 0:
        return 6778.0
    n_rads = mean_motion_revday * 2 * math.pi / 86400.0
    return (398600.4418 / (n_rads ** 2)) ** (1.0 / 3.0)


def generate_tle(norad_id: str, incl: float, ecc: float, mean_motion: float) -> tuple[str, str]:
    """Generate mock TLE lines with valid checksums for a given satellite profile."""
    nid = str(norad_id).zfill(5)
    
    # Generate international designator (COSPAR ID)
    year = str(random.randint(15, 26))
    launch_num = str(random.randint(1, 99)).zfill(3)
    piece = random.choice(["A", "B", "C", "D"])
    cospar = f"{year}{launch_num}{piece}"
    
    # Generate epoch day
    epoch_day = f"{random.randint(1, 365):03d}.{random.randint(10000000, 99999999)}"
    
    def calculate_checksum(line: str) -> int:
        c = 0
        for char in line[:68]:
            if char.isdigit():
                c += int(char)
            elif char == "-":
                c += 1
        return c % 10

    # Line 1 format
    line1 = f"1 {nid}U {cospar:<8} {year}{epoch_day:>12}  .00002182  00000-0  10000-3 0  999"
    line1 = line1[:68].ljust(68)
    line1 = f"{line1}{calculate_checksum(line1)}"
    
    # Line 2 format
    raan = random.uniform(0, 360)
    arg_p = random.uniform(0, 360)
    mean_anomaly = random.uniform(0, 360)
    ecc_str = f"{int(ecc * 10000000):07d}"[:7]
    rev_num = random.randint(1000, 99999)
    
    line2 = f"2 {nid} {incl:8.4f} {raan:8.4f} {ecc_str} {arg_p:8.4f} {mean_anomaly:8.4f} {mean_motion:11.8f}{rev_num:5d}"
    line2 = line2[:68].ljust(68)
    line2 = f"{line2}{calculate_checksum(line2)}"
    
    return line1, line2


def seed_database(count: int, clear: bool):
    """Seed the database with organizations, satellites, debris, telemetry, and conjunctions."""
    db = None
    try:
        print("🔌 Connecting to MongoDB...")
        db = SessionLocal()
        client = get_mongo_client()
        db_name = uri_db_name(settings.MONGODB_URI)
        mongo_db = client[db_name]
        print(f"✅ Successfully connected to MongoDB database: '{db_name}'")

        if clear:
            print("🧹 Clearing existing database collections...")
            collections_to_clear = [
                "satellites",
                "debris",
                "orbitalElements",
                "telemetry",
                "conjunctions",
                "organizations"
            ]
            for col_name in collections_to_clear:
                mongo_db[col_name].delete_many({})
                # Reset counters
                mongo_db["counters"].delete_one({"_id": col_name})
                print(f"   - Cleared collection '{col_name}' and its auto-increment counters")

        # 1. Seed Organizations
        print("🏢 Seeding default organizations...")
        orgs_to_create = [
            {"name": "NASA", "description": "National Aeronautics and Space Administration"},
            {"name": "ISRO", "description": "Indian Space Research Organisation"},
            {"name": "ESA", "description": "European Space Agency"},
            {"name": "SpaceX", "description": "Space Exploration Technologies Corp."},
            {"name": "OneWeb", "description": "Eutelsat OneWeb Satellite Network"},
        ]
        
        seeded_orgs = []
        for org_data in orgs_to_create:
            # Check if already exists
            existing = db.query(Organization).filter(Organization.name == org_data["name"]).first()
            if not existing:
                org = Organization(
                    name=org_data["name"],
                    description=org_data["description"],
                    created_at=datetime.datetime.utcnow().isoformat()
                )
                db.add(org)
                db.commit()
                db.refresh(org)
                seeded_orgs.append(org)
                print(f"   + Created organization: {org.name} (ID: {org.id})")
            else:
                seeded_orgs.append(existing)
                print(f"   • Organization {existing.name} already exists (ID: {existing.id})")

        # Helper list of generated norad IDs to ensure uniqueness
        used_norad_ids = set()
        
        # Pre-load existing NORAD IDs from the database if not clearing to avoid unique index crashes
        if not clear:
            print("🔍 Pre-loading existing NORAD IDs from database to avoid duplicates...")
            try:
                for sat_doc in mongo_db["satellites"].find({}, {"noradId": 1}):
                    if sat_doc.get("noradId"):
                        used_norad_ids.add(sat_doc["noradId"])
                for debris_doc in mongo_db["debris"].find({}, {"noradId": 1}):
                    if debris_doc.get("noradId"):
                        used_norad_ids.add(debris_doc["noradId"])
                print(f"   - Loaded {len(used_norad_ids)} existing NORAD IDs.")
            except Exception as e:
                print(f"   ⚠️ Warning: Could not pre-load existing NORAD IDs: {e}")

        # 2. Seed Satellites
        print(f"🛰️ Generating {count} satellite records...")
        satellites_list = []
        for i in range(count):
            # Choose country and name
            country = random.choice(list(SATELLITE_NAMES.keys()))
            prefix = random.choice(SATELLITE_NAMES[country])
            suffix = f"-{random.randint(100, 999)}" if prefix in ["STARLINK", "SENTINEL", "YAOGAN"] else f" {random.randint(1, 20)}"
            name = f"{prefix}{suffix}"
            
            # Unique NORAD ID
            norad_id = str(random.randint(10000, 49999))
            while norad_id in used_norad_ids:
                norad_id = str(random.randint(10000, 49999))
            used_norad_ids.add(norad_id)

            # Orbital elements
            inclination = random.uniform(50.0, 105.0)  # Common LEO inclinations
            eccentricity = random.uniform(0.0001, 0.01) # Near circular LEO orbits
            mean_motion = random.uniform(14.0, 16.2)    # 14 to 16.2 orbits per day
            semimajor = calculate_semimajor_axis(mean_motion)
            period = 1440.0 / mean_motion
            epoch = datetime.datetime.utcnow() - datetime.timedelta(days=random.uniform(0, 5))
            launch_date = (datetime.date.today() - datetime.timedelta(days=random.randint(100, 5000))).isoformat()
            
            tle1, tle2 = generate_tle(norad_id, inclination, eccentricity, mean_motion)
            
            # Link to a random organization
            org = random.choice(seeded_orgs)

            # Create SpaceObject first to replicate ORM relationship correctly
            space_obj = SpaceObject(
                noradId=norad_id,
                objectName=name,
                objectType="PAYLOAD",
                cospar_id=f"{random.randint(2010, 2026)}-{random.randint(1, 100):03d}{random.choice(['A', 'B', 'C'])}",
                epoch=epoch.isoformat(),
                inclination=inclination,
                eccentricity=eccentricity,
                semimajor_axis=semimajor,
                period=period,
                mean_motion=mean_motion,
                tle_line1=tle1,
                tle_line2=tle2,
                updated_at=datetime.datetime.utcnow().isoformat()
            )
            db.add(space_obj)
            db.commit()
            db.refresh(space_obj)

            # Now create Satellite linked to SpaceObject and Organization
            # Make the first satellite deterministically ACTIVE so telemetry tests pass without flakiness
            status_val = "ACTIVE" if i == 0 else random.choice(["ACTIVE", "ACTIVE", "ACTIVE", "DEGRADED", "INACTIVE"])
            sat = Satellite(
                noradId=norad_id,
                objectName=name,
                objectType="PAYLOAD",
                countryCode=country,
                launchDate=launch_date,
                epoch=epoch.isoformat(),
                inclination=inclination,
                eccentricity=eccentricity,
                meanMotion=mean_motion,
                source="seed_script",
                createdAt=datetime.datetime.utcnow().isoformat(),
                updatedAt=datetime.datetime.utcnow().isoformat(),
                space_object_id=space_obj.id,
                organization_id=org.id,
                status=status_val,
                fuel_percentage=random.uniform(15.0, 100.0),
                dry_mass=random.uniform(150.0, 1800.0),
                propellant_mass=random.uniform(20.0, 800.0),
                operational_mode=random.choice(["NORMAL", "NORMAL", "NORMAL", "SAFE", "STANDBY"]),
                semimajor_axis=semimajor,
                period=period,
                tle_line1=tle1,
                tle_line2=tle2
            )
            db.add(sat)
            db.commit()
            db.refresh(sat)
            satellites_list.append(sat)

        print(f"   + Seeded {len(satellites_list)} satellite and space object records.")

        # 3. Seed Telemetry
        print("📈 Seeding telemetry log history for satellites...")
        telemetry_count = 0
        for sat in satellites_list:
            # Generate 5 telemetry points over the last 50 minutes for each active satellite
            if sat.status in ["ACTIVE", "DEGRADED"]:
                base_altitude = sat.semimajor_axis - 6378.1  # Semi-major axis minus Earth radius
                base_velocity = 7.5  # Typical LEO velocity in km/s
                
                for j in range(5):
                    ts = datetime.datetime.utcnow() - datetime.timedelta(minutes=10 * j)
                    tel = Telemetry(
                        satellite_id=str(sat.id),
                        timestamp=ts,
                        altitude_km=base_altitude + random.uniform(-2.0, 2.0),
                        velocity_kms=base_velocity + random.uniform(-0.1, 0.1),
                        temperature_c=random.uniform(-5.0, 35.0),
                        battery_charge=max(0.0, min(100.0, sat.fuel_percentage + random.uniform(-5.0, 5.0))),
                        neural_load=random.uniform(10.0, 90.0)
                    )
                    db.add(tel)
                    telemetry_count += 1
                db.commit()
        print(f"   + Seeded {telemetry_count} telemetry data points.")

        # 4. Seed Debris
        debris_count = max(5, count // 2)
        print(f"☄️ Generating {debris_count} space debris records...")
        debris_list = []
        for i in range(debris_count):
            # Choose debris name
            base_name = random.choice(DEBRIS_NAMES)
            name = f"{base_name} [#{random.randint(1000, 9999)}]"
            
            # Unique NORAD ID
            norad_id = str(random.randint(50000, 89999))
            while norad_id in used_norad_ids:
                norad_id = str(random.randint(50000, 89999))
            used_norad_ids.add(norad_id)

            inclination = random.uniform(50.0, 110.0)
            eccentricity = random.uniform(0.0005, 0.05)
            mean_motion = random.uniform(13.5, 16.5)
            semimajor = calculate_semimajor_axis(mean_motion)
            period = 1440.0 / mean_motion
            epoch = datetime.datetime.utcnow() - datetime.timedelta(days=random.uniform(0, 10))
            
            tle1, tle2 = generate_tle(norad_id, inclination, eccentricity, mean_motion)

            # Create SpaceObject for Debris
            space_obj = SpaceObject(
                noradId=norad_id,
                objectName=name,
                objectType="DEBRIS",
                cospar_id=None,
                epoch=epoch.isoformat(),
                inclination=inclination,
                eccentricity=eccentricity,
                semimajor_axis=semimajor,
                period=period,
                mean_motion=mean_motion,
                tle_line1=tle1,
                tle_line2=tle2,
                updated_at=datetime.datetime.utcnow().isoformat()
            )
            db.add(space_obj)
            db.commit()
            db.refresh(space_obj)

            # Create Debris record linked to SpaceObject
            deb = Debris(
                noradId=norad_id,
                objectName=name,
                epoch=epoch.isoformat(),
                inclination=inclination,
                eccentricity=eccentricity,
                meanMotion=mean_motion,
                source="seed_script",
                createdAt=datetime.datetime.utcnow().isoformat(),
                space_object_id=space_obj.id,
                size_category=random.choice(["SMALL", "MEDIUM", "LARGE"]),
                radar_cross_section=random.uniform(0.01, 15.0),
                average_mass=random.uniform(0.5, 200.0),
                semimajor_axis=semimajor,
                period=period,
                tle_line1=tle1,
                tle_line2=tle2
            )
            db.add(deb)
            db.commit()
            db.refresh(deb)
            debris_list.append(deb)
            
        print(f"   + Seeded {len(debris_list)} space debris records.")

        # 5. Seed Conjunctions (Collisions)
        print("💥 Seeding sample orbital conjunctions (collisions)...")
        conjunctions_count = 0
        # Create up to 5 conjunction events between seeded satellites and debris
        num_conjunctions = min(5, len(satellites_list), len(debris_list))
        
        for i in range(num_conjunctions):
            sat = satellites_list[i]
            deb = debris_list[i]
            
            miss_distance = random.uniform(10.0, 800.0)
            prob = random.uniform(0.001, 0.45)
            # Determine risk level based on miss distance & probability
            if miss_distance < 50.0 or prob > 0.1:
                risk_level = "CRITICAL"
            elif miss_distance < 150.0 or prob > 0.01:
                risk_level = "HIGH"
            elif miss_distance < 500.0 or prob > 0.001:
                risk_level = "MEDIUM"
            else:
                risk_level = "LOW"
                
            tca = datetime.datetime.utcnow() + datetime.timedelta(hours=random.uniform(4, 72))
            
            conj = CollisionPrediction(
                primaryObject=sat.noradId,
                secondaryObject=deb.noradId,
                missDistance=miss_distance,
                riskScore=prob,
                conjunctionTime=tca,
                createdAt=datetime.datetime.utcnow(),
                object_a_id=sat.space_object_id,
                object_b_id=deb.space_object_id,
                probability=prob,
                tca=tca,
                miss_distance_m=miss_distance,
                relative_velocity_kms=random.uniform(8.0, 15.0),
                risk_level=risk_level,
                status="PENDING",
                created_at=datetime.datetime.utcnow()
            )
            db.add(conj)
            conjunctions_count += 1
            
        db.commit()
        print(f"   + Seeded {conjunctions_count} collision conjunction alerts.")

        print("\n🎉 Database Seeding Completed Successfully!")
        print(f"   - Seeded {len(seeded_orgs)} Organizations")
        print(f"   - Seeded {len(satellites_list)} Satellites")
        print(f"   - Seeded {telemetry_count} Telemetry Records")
        print(f"   - Seeded {len(debris_list)} Debris Records")
        print(f"   - Seeded {conjunctions_count} Conjunction Predictions")

    except Exception as e:
        print(f"❌ Error during database seeding: {e}")
        raise e
    finally:
        if db:
            db.close()


def main():
    parser = argparse.ArgumentParser(
        description="Seed Kepler MongoDB database with sample satellite, organization, and collision data."
    )
    parser.add_argument(
        "--count", "-c",
        type=int,
        default=50,
        help="Number of satellites to generate (default: 50)"
    )
    parser.add_argument(
        "--clear", "-x",
        action="store_true",
        help="Clear existing satellite, debris, telemetry, and conjunction records before seeding"
    )
    args = parser.parse_args()

    # Validate count
    if args.count <= 0:
        print("❌ Error: Count must be a positive integer.")
        sys.exit(1)

    try:
        seed_database(count=args.count, clear=args.clear)
    except Exception as e:
        print(f"❌ Seeding process failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
