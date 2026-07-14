from pydantic import BaseModel, EmailStr, Field
from typing import Generic, TypeVar, Optional, List, Any, Dict
from datetime import datetime

T = TypeVar('T')

class PaginationSchema(BaseModel):
    page: int
    size: int
    total: int
    pages: int

class APIResponse(BaseModel, Generic[T]):
    success: bool
    message: str
    data: Optional[T] = None
    pagination: Optional[PaginationSchema] = None
    metadata: Optional[Dict[str, Any]] = None


class ErrorDetail(BaseModel):
    """Machine-readable description of what went wrong."""

    code: str = Field(..., description="Stable error identifier, e.g. NOT_FOUND")
    details: Optional[Any] = Field(
        None,
        description="Structured context: offending fields, valid values, upstream service…",
    )


class ErrorResponse(BaseModel):
    """
    The single shape every Kepler API error is returned in.

    It mirrors `APIResponse` — `success` and `message` sit in the same place — so a client
    can read `success` on any response without first knowing whether the call succeeded.
    """

    success: bool = Field(False, description="Always false on an error response")
    message: str = Field(..., description="Human-readable explanation, safe to display")
    error: ErrorDetail
    path: Optional[str] = Field(None, description="Path of the request that failed")
    request_id: Optional[str] = Field(
        None, description="Correlation id; also returned in the X-Request-ID header"
    )
    timestamp: Optional[datetime] = Field(None, description="UTC time the error was produced")


class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role_id: Optional[int] = None
    organization_id: Optional[int] = None

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    is_active: bool
    role_id: Optional[int]
    organization_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None


class SatelliteCreate(BaseModel):
    name: str
    catalog_number: str
    cospar_id: Optional[str] = None
    inclination: float = Field(..., description="Degrees")
    eccentricity: float = Field(..., description="0 to 1")
    semimajor_axis: float = Field(..., description="km")
    raan: float = Field(..., description="Degrees")
    arg_of_perigee: float = Field(..., description="Degrees")
    mean_anomaly: float = Field(..., description="Degrees")
    mean_motion: float = Field(..., description="orbits/day")
    period: float = Field(..., description="Minutes")
    status: Optional[str] = "ACTIVE"
    fuel_percentage: Optional[float] = 100.0
    organization_id: Optional[int] = None

class SpaceObjectResponse(BaseModel):
    id: int
    name: str
    catalog_number: str
    cospar_id: Optional[str]
    classification: str
    epoch: Optional[datetime]
    inclination: Optional[float]
    eccentricity: Optional[float]
    semimajor_axis: Optional[float]
    period: Optional[float]

    class Config:
        from_attributes = True

class SatelliteResponse(BaseModel):
    id: int
    status: str
    fuel_percentage: float
    operational_mode: str
    space_object: SpaceObjectResponse

    class Config:
        from_attributes = True


class DebrisResponse(BaseModel):
    id: int
    size_category: str
    radar_cross_section: Optional[float]
    average_mass: Optional[float]
    space_object: SpaceObjectResponse

    class Config:
        from_attributes = True


class CollisionPredictionResponse(BaseModel):
    id: int
    object_a: SpaceObjectResponse
    object_b: SpaceObjectResponse
    probability: float
    tca: datetime
    miss_distance_m: float
    relative_velocity_kms: float
    risk_level: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class RiskScoreResponse(BaseModel):
    id: int
    collision_id: int
    ai_score: float
    confidence: float
    severity_classification: str
    created_at: datetime

    class Config:
        from_attributes = True


class ManeuverCreate(BaseModel):
    satellite_id: int
    collision_id: int
    delta_v_x: float
    delta_v_y: float
    delta_v_z: float
    planned_time: datetime

class ManeuverResponse(BaseModel):
    id: int
    satellite_id: int
    collision_id: int
    delta_v_x: float
    delta_v_y: float
    delta_v_z: float
    fuel_cost_g: float
    planned_time: datetime
    status: str

    class Config:
        from_attributes = True

class SimulationCreate(BaseModel):
    name: str
    scenario_data: Dict[str, Any]

class SimulationResponse(BaseModel):
    id: int
    name: str
    scenario_data: Dict[str, Any]
    results_data: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True


class SpaceWeatherResponse(BaseModel):
    id: int
    event_type: str
    severity: str
    k_index: Optional[int]
    description: Optional[str]
    recorded_at: datetime

    class Config:
        from_attributes = True


class AlertResponse(BaseModel):
    id: int
    title: str
    description: str
    alert_type: str
    severity: str
    is_acknowledged: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AgentDecisionResponse(BaseModel):
    id: int
    agent_name: str
    action_taken: str
    reasoning: str
    decision_metadata: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True

class AgentRunResponse(BaseModel):
    id: int
    workflow_name: str
    status: str
    current_step: Optional[str]
    started_at: datetime
    completed_at: Optional[datetime]
    decisions: List[AgentDecisionResponse] = []

    class Config:
        from_attributes = True
