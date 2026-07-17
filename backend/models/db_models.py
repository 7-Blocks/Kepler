"""
SQLAlchemy ORM Models — PostgreSQL
====================================
Every MongoDB collection is mapped to a properly normalised PostgreSQL table.
Relationships, constraints, indexes, and cascade rules are all declared here.
"""

import datetime
from typing import Optional, List

from sqlalchemy import (
    BigInteger, Boolean, DateTime, Float, ForeignKey,
    Integer, JSON, String, Text, UniqueConstraint, Index, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.session import Base


# ---------------------------------------------------------------------------
# organisations / roles / users
# ---------------------------------------------------------------------------

class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    users: Mapped[List["User"]] = relationship("User", back_populates="organization")
    satellites: Mapped[List["Satellite"]] = relationship("Satellite", back_populates="organization")


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)

    users: Mapped[List["User"]] = relationship("User", back_populates="role")


class Permission(Base):
    __tablename__ = "permissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    role_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("roles.id", ondelete="SET NULL"))
    organization_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"))
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    role: Mapped[Optional["Role"]] = relationship("Role", back_populates="users")
    organization: Mapped[Optional["Organization"]] = relationship("Organization", back_populates="users")
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="user")
    audit_logs: Mapped[List["AuditLog"]] = relationship("AuditLog", back_populates="user")


# ---------------------------------------------------------------------------
# orbital catalog
# ---------------------------------------------------------------------------

class SpaceObject(Base):
    """Master catalog entry — one row per NORAD ID."""
    __tablename__ = "orbitalElements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    noradId: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    objectName: Mapped[str] = mapped_column(String(255), nullable=False)
    objectType: Mapped[str] = mapped_column(String(50), nullable=False, default="UNKNOWN")
    cospar_id: Mapped[Optional[str]] = mapped_column(String(50))
    epoch: Mapped[Optional[str]] = mapped_column(String(50))
    inclination: Mapped[Optional[float]] = mapped_column(Float)
    eccentricity: Mapped[Optional[float]] = mapped_column(Float)
    semimajor_axis: Mapped[Optional[float]] = mapped_column(Float)
    raan: Mapped[Optional[float]] = mapped_column(Float)
    arg_of_perigee: Mapped[Optional[float]] = mapped_column(Float)
    mean_anomaly: Mapped[Optional[float]] = mapped_column(Float)
    mean_motion: Mapped[Optional[float]] = mapped_column(Float)
    period: Mapped[Optional[float]] = mapped_column(Float)
    tle_line1: Mapped[Optional[str]] = mapped_column(String(100))
    tle_line2: Mapped[Optional[str]] = mapped_column(String(100))
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    satellite_details: Mapped[Optional["Satellite"]] = relationship(
        "Satellite", back_populates="space_object_rel", uselist=False
    )
    debris_details: Mapped[Optional["Debris"]] = relationship(
        "Debris", back_populates="space_object_rel", uselist=False
    )

    # Alias properties for backward-compat with collision_engine / serialisers
    @property
    def catalog_number(self) -> str:
        return self.noradId

    @property
    def name(self) -> str:
        return self.objectName

    @property
    def classification(self) -> str:
        return self.objectType


class Satellite(Base):
    __tablename__ = "satellites"
    __table_args__ = (
        UniqueConstraint("noradId", name="uq_satellites_noradid"),
        Index("ix_satellites_noradid", "noradId"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    noradId: Mapped[str] = mapped_column(String(20), nullable=False)
    objectName: Mapped[str] = mapped_column(String(255), nullable=False)
    objectType: Mapped[str] = mapped_column(String(50), default="PAYLOAD")
    countryCode: Mapped[Optional[str]] = mapped_column(String(10))
    launchDate: Mapped[Optional[str]] = mapped_column(String(20))
    epoch: Mapped[Optional[str]] = mapped_column(String(50))
    inclination: Mapped[Optional[float]] = mapped_column(Float)
    eccentricity: Mapped[Optional[float]] = mapped_column(Float)
    meanMotion: Mapped[Optional[float]] = mapped_column(Float)
    source: Mapped[Optional[str]] = mapped_column(String(50))
    createdAt: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updatedAt: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    space_object_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("orbitalElements.id", ondelete="SET NULL")
    )
    organization_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("organizations.id", ondelete="SET NULL")
    )
    status: Mapped[str] = mapped_column(String(20), default="ACTIVE")
    fuel_percentage: Mapped[float] = mapped_column(Float, default=100.0)
    dry_mass: Mapped[Optional[float]] = mapped_column(Float)
    propellant_mass: Mapped[Optional[float]] = mapped_column(Float)
    operational_mode: Mapped[str] = mapped_column(String(20), default="NORMAL")
    semimajor_axis: Mapped[Optional[float]] = mapped_column(Float)
    period: Mapped[Optional[float]] = mapped_column(Float)
    tle_line1: Mapped[Optional[str]] = mapped_column(String(100))
    tle_line2: Mapped[Optional[str]] = mapped_column(String(100))

    organization: Mapped[Optional["Organization"]] = relationship("Organization", back_populates="satellites")
    space_object_rel: Mapped[Optional["SpaceObject"]] = relationship(
        "SpaceObject", back_populates="satellite_details"
    )
    telemetry_records: Mapped[List["Telemetry"]] = relationship("Telemetry", back_populates="satellite")
    maneuvers: Mapped[List["Maneuver"]] = relationship("Maneuver", back_populates="satellite")

    @property
    def space_object(self) -> "SpaceObject":
        """Construct a transient SpaceObject for serialisation."""
        return SpaceObject(
            id=self.space_object_id or self.id,
            noradId=self.noradId,
            objectName=self.objectName,
            objectType=self.objectType or "PAYLOAD",
            epoch=self.epoch,
            inclination=self.inclination,
            eccentricity=self.eccentricity,
            semimajor_axis=self.semimajor_axis,
            period=self.period,
            mean_motion=self.meanMotion,
            tle_line1=self.tle_line1,
            tle_line2=self.tle_line2,
        )


class Debris(Base):
    __tablename__ = "debris"
    __table_args__ = (
        UniqueConstraint("noradId", name="uq_debris_noradid"),
        Index("ix_debris_noradid", "noradId"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    noradId: Mapped[str] = mapped_column(String(20), nullable=False)
    objectName: Mapped[str] = mapped_column(String(255), nullable=False)
    epoch: Mapped[Optional[str]] = mapped_column(String(50))
    inclination: Mapped[Optional[float]] = mapped_column(Float)
    eccentricity: Mapped[Optional[float]] = mapped_column(Float)
    meanMotion: Mapped[Optional[float]] = mapped_column(Float)
    source: Mapped[Optional[str]] = mapped_column(String(50))
    createdAt: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    space_object_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("orbitalElements.id", ondelete="SET NULL")
    )
    size_category: Mapped[Optional[str]] = mapped_column(String(20))
    radar_cross_section: Mapped[Optional[float]] = mapped_column(Float)
    average_mass: Mapped[Optional[float]] = mapped_column(Float)
    semimajor_axis: Mapped[Optional[float]] = mapped_column(Float)
    period: Mapped[Optional[float]] = mapped_column(Float)
    tle_line1: Mapped[Optional[str]] = mapped_column(String(100))
    tle_line2: Mapped[Optional[str]] = mapped_column(String(100))

    space_object_rel: Mapped[Optional["SpaceObject"]] = relationship(
        "SpaceObject", back_populates="debris_details"
    )

    @property
    def space_object(self) -> "SpaceObject":
        return SpaceObject(
            id=self.space_object_id or self.id,
            noradId=self.noradId,
            objectName=self.objectName,
            objectType="DEBRIS",
            epoch=self.epoch,
            inclination=self.inclination,
            eccentricity=self.eccentricity,
            semimajor_axis=self.semimajor_axis,
            period=self.period,
            mean_motion=self.meanMotion,
            tle_line1=self.tle_line1,
            tle_line2=self.tle_line2,
        )


class Telemetry(Base):
    __tablename__ = "telemetry"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    satellite_id: Mapped[int] = mapped_column(Integer, ForeignKey("satellites.id", ondelete="CASCADE"), index=True)
    timestamp: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    altitude_km: Mapped[Optional[float]] = mapped_column(Float)
    velocity_kms: Mapped[Optional[float]] = mapped_column(Float)
    temperature_c: Mapped[Optional[float]] = mapped_column(Float)
    battery_charge: Mapped[Optional[float]] = mapped_column(Float)
    neural_load: Mapped[Optional[float]] = mapped_column(Float)

    satellite: Mapped["Satellite"] = relationship("Satellite", back_populates="telemetry_records")


class OrbitalEvent(Base):
    __tablename__ = "orbital_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    recorded_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ---------------------------------------------------------------------------
# conjunctions / risk / maneuvers
# ---------------------------------------------------------------------------

class CollisionPrediction(Base):
    __tablename__ = "conjunctions"
    __table_args__ = (
        Index("ix_conjunctions_risk_score", "riskScore"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    primaryObject: Mapped[Optional[str]] = mapped_column(String(20))
    secondaryObject: Mapped[Optional[str]] = mapped_column(String(20))
    missDistance: Mapped[Optional[float]] = mapped_column(Float)
    riskScore: Mapped[Optional[float]] = mapped_column(Float)
    conjunctionTime: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(timezone=True))
    createdAt: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    object_a_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("orbitalElements.id", ondelete="SET NULL"), index=True
    )
    object_b_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("orbitalElements.id", ondelete="SET NULL"), index=True
    )
    relative_velocity_kms: Mapped[Optional[float]] = mapped_column(Float)
    risk_level: Mapped[Optional[str]] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(20), default="PENDING")

    object_a_rel: Mapped[Optional["SpaceObject"]] = relationship(
        "SpaceObject", foreign_keys=[object_a_id]
    )
    object_b_rel: Mapped[Optional["SpaceObject"]] = relationship(
        "SpaceObject", foreign_keys=[object_b_id]
    )
    risk_scores: Mapped[List["RiskScore"]] = relationship("RiskScore", back_populates="collision")
    maneuvers: Mapped[List["Maneuver"]] = relationship("Maneuver", back_populates="collision")

    # Alias properties so existing serialiser code keeps working unchanged
    @property
    def probability(self) -> float:
        return self.riskScore or 0.0

    @probability.setter
    def probability(self, val: float):
        self.riskScore = val

    @property
    def miss_distance_m(self) -> float:
        return self.missDistance or 0.0

    @miss_distance_m.setter
    def miss_distance_m(self, val: float):
        self.missDistance = val

    @property
    def tca(self) -> Optional[datetime.datetime]:
        return self.conjunctionTime

    @tca.setter
    def tca(self, val: datetime.datetime):
        self.conjunctionTime = val

    @property
    def created_at(self) -> Optional[datetime.datetime]:
        return self.createdAt

    @created_at.setter
    def created_at(self, val: datetime.datetime):
        self.createdAt = val

    @property
    def object_a(self) -> Optional["SpaceObject"]:
        return self.object_a_rel

    @property
    def object_b(self) -> Optional["SpaceObject"]:
        return self.object_b_rel


class RiskScore(Base):
    __tablename__ = "risk_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    collision_id: Mapped[int] = mapped_column(Integer, ForeignKey("conjunctions.id", ondelete="CASCADE"), index=True)
    ai_score: Mapped[float] = mapped_column(Float, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    severity_classification: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    collision: Mapped["CollisionPrediction"] = relationship("CollisionPrediction", back_populates="risk_scores")


class Maneuver(Base):
    __tablename__ = "maneuvers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    satellite_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("satellites.id", ondelete="SET NULL"))
    collision_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("conjunctions.id", ondelete="SET NULL"))
    delta_v_x: Mapped[Optional[float]] = mapped_column(Float)
    delta_v_y: Mapped[Optional[float]] = mapped_column(Float)
    delta_v_z: Mapped[Optional[float]] = mapped_column(Float)
    fuel_cost_g: Mapped[Optional[float]] = mapped_column(Float)
    planned_time: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(20), default="PLANNED")
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    satellite: Mapped[Optional["Satellite"]] = relationship("Satellite", back_populates="maneuvers")
    collision: Mapped[Optional["CollisionPrediction"]] = relationship("CollisionPrediction", back_populates="maneuvers")


# ---------------------------------------------------------------------------
# simulations
# ---------------------------------------------------------------------------

class Simulation(Base):
    __tablename__ = "simulations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    scenario_data: Mapped[Optional[dict]] = mapped_column(JSON)
    results_data: Mapped[Optional[dict]] = mapped_column(JSON)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


# ---------------------------------------------------------------------------
# space weather / alerts
# ---------------------------------------------------------------------------

class SpaceWeather(Base):
    __tablename__ = "spaceWeather"
    __table_args__ = (
        Index("ix_spaceweather_recorded_at", "recorded_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False, default="NORMAL")
    k_index: Mapped[Optional[int]] = mapped_column(Integer)
    description: Mapped[Optional[str]] = mapped_column(Text)
    recorded_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )

    @property
    def eventTime(self) -> Optional[datetime.datetime]:
        return self.recorded_at

    @eventTime.setter
    def eventTime(self, val: datetime.datetime):
        self.recorded_at = val


class Alert(Base):
    __tablename__ = "alerts"
    __table_args__ = (
        Index("ix_alerts_created_at", "created_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    alert_type: Mapped[str] = mapped_column(String(50), nullable=False, default="INFO")
    severity: Mapped[str] = mapped_column(String(20), nullable=False, default="INFO")
    is_acknowledged: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    @property
    def createdAt(self) -> Optional[datetime.datetime]:
        return self.created_at

    @createdAt.setter
    def createdAt(self, val: datetime.datetime):
        self.created_at = val


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[Optional[str]] = mapped_column(Text)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped[Optional["User"]] = relationship("User", back_populates="notifications")


# ---------------------------------------------------------------------------
# AI agent runs / decisions
# ---------------------------------------------------------------------------

class AgentRun(Base):
    __tablename__ = "agent_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    workflow_name: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="PENDING")
    current_step: Mapped[Optional[str]] = mapped_column(String(100))
    started_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    completed_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(timezone=True))

    decisions: Mapped[List["AgentDecision"]] = relationship("AgentDecision", back_populates="agent_run")


class AgentDecision(Base):
    __tablename__ = "agent_decisions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    agent_run_id: Mapped[int] = mapped_column(Integer, ForeignKey("agent_runs.id", ondelete="CASCADE"), index=True)
    agent_name: Mapped[str] = mapped_column(String(100), nullable=False)
    action_taken: Mapped[Optional[str]] = mapped_column(Text)
    reasoning: Mapped[Optional[str]] = mapped_column(Text)
    decision_metadata: Mapped[Optional[dict]] = mapped_column(JSON)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    agent_run: Mapped["AgentRun"] = relationship("AgentRun", back_populates="decisions")


# ---------------------------------------------------------------------------
# audit / sync logs
# ---------------------------------------------------------------------------

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), index=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    details: Mapped[Optional[dict]] = mapped_column(JSON)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped[Optional["User"]] = relationship("User", back_populates="audit_logs")


class RocketBody(Base):
    __tablename__ = "rocketBodies"
    __table_args__ = (
        UniqueConstraint("noradId", name="uq_rocketbodies_noradid"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    noradId: Mapped[str] = mapped_column(String(20), nullable=False)
    objectName: Mapped[str] = mapped_column(String(255), nullable=False)
    epoch: Mapped[Optional[str]] = mapped_column(String(50))
    inclination: Mapped[Optional[float]] = mapped_column(Float)
    eccentricity: Mapped[Optional[float]] = mapped_column(Float)
    meanMotion: Mapped[Optional[float]] = mapped_column(Float)
    source: Mapped[Optional[str]] = mapped_column(String(50))
    createdAt: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class SyncLog(Base):
    __tablename__ = "syncLogs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    syncType: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    recordsProcessed: Mapped[Optional[int]] = mapped_column(Integer)
    createdAt: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
