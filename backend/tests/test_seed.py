import pytest
from unittest.mock import MagicMock, patch
import datetime

from scripts.seed_db import seed_database, calculate_semimajor_axis, generate_tle


class FakeCollection:
    def __init__(self):
        self.docs = []

    def delete_many(self, filter_dict):
        self.docs = []

    def insert_one(self, doc):
        self.docs.append(doc)

    def find_one_and_update(self, filter, update, **kwargs):
        # Mock counter generator
        return {"seq": len(self.docs) + 1}

    def delete_one(self, filter_dict):
        pass

    def find(self, filter_dict=None, projection=None):
        return self.docs


class FakeDb:
    def __init__(self):
        self.collections = {
            "satellites": FakeCollection(),
            "debris": FakeCollection(),
            "orbitalElements": FakeCollection(),
            "telemetry": FakeCollection(),
            "conjunctions": FakeCollection(),
            "organizations": FakeCollection(),
            "counters": FakeCollection(),
        }
        self.db = self.collections
        self.client = MagicMock()
        self.client.admin.command.return_value = {"ok": 1}

    def __getitem__(self, name):
        return self.collections[name]


class FakeSession:
    def __init__(self, fake_db):
        self.db = fake_db
        self.pending_adds = []

    def query(self, model_class):
        # Simple mock query object
        query_mock = MagicMock()
        query_mock.filter.return_value.first.return_value = None
        query_mock.first.return_value = None
        return query_mock

    def add(self, obj):
        obj._session = self
        self.pending_adds.append(obj)

    def commit(self):
        for obj in self.pending_adds:
            col_name = obj.__tablename__
            doc = obj._to_dict()
            if obj.id is None:
                # generate mock ID
                new_id = len(self.db.collections[col_name].docs) + 1
                obj.id = new_id
                doc["id"] = new_id
                doc["_id"] = new_id
            self.db.collections[col_name].insert_one(doc)
        self.pending_adds = []

    def refresh(self, obj):
        if obj.id is None:
            obj.id = 1

    def close(self):
        pass


def test_calculate_semimajor_axis():
    # Mean motion 0 or negative
    assert calculate_semimajor_axis(0) == 6778.0
    assert calculate_semimajor_axis(-1) == 6778.0
    
    # Typical LEO mean motion
    axis = calculate_semimajor_axis(15.5)
    assert 6500.0 < axis < 7500.0


def test_generate_tle():
    line1, line2 = generate_tle("25544", 51.64, 0.001, 15.5)
    
    # Check lines format
    assert line1.startswith("1 25544U")
    assert line2.startswith("2 25544")
    
    # Check length (must be 69 characters including checksum)
    assert len(line1) == 69
    assert len(line2) == 69
    
    # Check standard checksum digit
    assert line1[-1].isdigit()
    assert line2[-1].isdigit()


@patch("scripts.seed_db.get_mongo_client")
@patch("scripts.seed_db.SessionLocal")
def test_seed_database_execution(mock_session_local, mock_mongo_client):
    fake_db = FakeDb()
    mock_mongo_client.return_value = fake_db.client
    
    fake_session = FakeSession(fake_db)
    mock_session_local.return_value = fake_session
    
    # Run seed script for 10 satellites
    # This will clear collections and populate them
    seed_database(count=10, clear=True)
    
    # Verify collections size
    # 5 organizations created
    assert len(fake_db["organizations"].docs) == 5
    # 10 satellites and 10 space objects (satellites) created
    assert len(fake_db["satellites"].docs) == 10
    # count // 2 debris = 5 debris created. 
    # Total space objects in orbitalElements = 10 satellites + 5 debris = 15
    assert len(fake_db["debris"].docs) == 5
    assert len(fake_db["orbitalElements"].docs) == 15
    
    # Telemetry should be created for each active/degraded satellite
    eligible = sum(
        doc["status"] in {"ACTIVE", "DEGRADED"}
        for doc in fake_db["satellites"].docs
    )
    assert len(fake_db["telemetry"].docs) == eligible * 5
    # Telemetry count should be 5 * active/degraded satellites
    
    # Conjunctions seeded: min(5, len(satellites), len(debris)) = min(5, 10, 5) = 5
    assert len(fake_db["conjunctions"].docs) == 5


@patch("scripts.seed_db.get_mongo_client")
@patch("scripts.seed_db.SessionLocal")
def test_seed_database_no_clear(mock_session_local, mock_mongo_client):
    fake_db = FakeDb()
    mock_mongo_client.return_value = fake_db.client
    
    # Pre-populate some existing IDs in the collection
    fake_db["satellites"].docs = [{"noradId": "12345"}, {"noradId": "67890"}]
    fake_db["debris"].docs = [{"noradId": "11111"}]
    
    fake_session = FakeSession(fake_db)
    mock_session_local.return_value = fake_session
    
    # Run seed script without clear
    seed_database(count=5, clear=False)
    
    # Assert it completed without crash and new unique IDs are generated
    assert len(fake_db["satellites"].docs) > 2
