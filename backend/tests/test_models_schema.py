"""
Schema-level invariants for the SQLAlchemy models.

These guard the metadata itself rather than any query, so a bad declaration is caught at
collection time instead of surfacing as a confusing failure in an unrelated test.
"""

from collections import defaultdict

import pytest
from sqlalchemy import create_engine

from database.session import Base
import models.db_models  # noqa: F401 — registers all tables
import orbital.providers.cache  # noqa: F401 — registers ProviderCache


def test_index_names_are_unique_case_insensitively():
    """
    Regression: `spaceWeather.recorded_at` was indexed twice — once explicitly in
    `__table_args__` as `ix_spaceweather_recorded_at`, and once implicitly via
    `index=True`, which SQLAlchemy names `ix_spaceWeather_recorded_at`.

    The two names differ only by case. SQLite treats identifiers case-insensitively, so
    `create_all()` died with "index ix_spaceweather_recorded_at already exists" and took
    every test that builds a schema down with it. PostgreSQL quotes the mixed-case name
    and happily creates *two* redundant indexes on the same column instead.
    """
    collisions = []
    for table in Base.metadata.sorted_tables:
        by_lower = defaultdict(list)
        for index in table.indexes:
            by_lower[index.name.lower()].append(index.name)
        collisions += [
            f"{table.name}: {sorted(names)}"
            for names in by_lower.values()
            if len(names) > 1
        ]

    assert not collisions, f"Index names collide case-insensitively: {collisions}"


def test_no_duplicate_indexes_on_the_same_columns():
    """Two indexes over identical columns are dead weight on every write."""
    duplicates = []
    for table in Base.metadata.sorted_tables:
        by_columns = defaultdict(list)
        for index in table.indexes:
            by_columns[tuple(c.name for c in index.columns)].append(index.name)
        duplicates += [
            f"{table.name}{cols}: {sorted(names)}"
            for cols, names in by_columns.items()
            if len(names) > 1
        ]

    assert not duplicates, f"Redundant indexes: {duplicates}"


def test_create_all_succeeds_on_a_clean_database():
    """The whole schema must build from scratch — this is what CI and a fresh dev setup do."""
    engine = create_engine("sqlite://")
    try:
        Base.metadata.create_all(engine)
    finally:
        engine.dispose()
