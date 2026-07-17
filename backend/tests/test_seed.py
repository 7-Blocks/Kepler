import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from unittest.mock import patch

from database.session import Base
import models.db_models  # noqa: F401
import orbital.providers.cache  # noqa: F401 — registers ProviderCache with Base.metadata

from scripts.seed_db import seed_database, calculate_semimajor_axis, generate_tle
from models.db_models import Organization, Satellite, Debris, Telemetry, CollisionPrediction


@pytest.fixture()
def sqlite_engine():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)


def test_calculate_semimajor_axis():
    assert calculate_semimajor_axis(0) == 6778.0
    assert calculate_semimajor_axis(-1) == 6778.0
    axis = calculate_semimajor_axis(15.5)
    assert 6500.0 < axis < 7500.0


def test_generate_tle():
    line1, line2 = generate_tle("25544", 51.64, 0.001, 15.5)
    assert line1.startswith("1 25544U")
    assert line2.startswith("2 25544")
    assert len(line1) == 69
    assert len(line2) == 69
    assert line1[-1].isdigit()
    assert line2[-1].isdigit()


def test_seed_database_execution(sqlite_engine):
    Session = sessionmaker(bind=sqlite_engine)

    with patch("scripts.seed_db.engine", sqlite_engine), \
         patch("scripts.seed_db.SessionLocal", Session):
        seed_database(count=10, clear=True)

    db = Session()
    try:
        assert db.query(Organization).count() == 5
        assert db.query(Satellite).count() == 10
        assert db.query(Debris).count() == 5

        eligible = db.query(Satellite).filter(Satellite.status.in_(["ACTIVE", "DEGRADED"])).count()
        assert db.query(Telemetry).count() == eligible * 5

        assert db.query(CollisionPrediction).count() == 5
    finally:
        db.close()


def test_seed_database_no_clear(sqlite_engine):
    Session = sessionmaker(bind=sqlite_engine)

    with patch("scripts.seed_db.engine", sqlite_engine), \
         patch("scripts.seed_db.SessionLocal", Session):
        seed_database(count=5, clear=False)

    db = Session()
    try:
        assert db.query(Satellite).count() == 5
    finally:
        db.close()
