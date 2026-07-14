"""
/api/v1/agents — AI Agent Workflow Endpoints

Bug Fixes Applied:
  - Removed AgentRunResponse.from_attributes() which crashed on Python 3.12 /
    Pydantic v2 since our custom BaseModel is not a Pydantic ORM model.
  - Now queries MongoDB directly and serialises manually.
"""

from fastapi import APIRouter, Depends, Query
from typing import List, Dict, Any, Optional

from database.session import get_db, MongoSession
from app.core.exceptions import NotFoundError
from schemas.api_schemas import APIResponse, PaginationSchema
from ai.workflow import run_agent_workflow

router = APIRouter()


def _serialize_run(r: dict) -> dict:
    def _dt(v):
        return v.isoformat() if hasattr(v, "isoformat") else str(v) if v else None

    decisions = []
    for d in (r.get("decisions") or []):
        decisions.append({
            "id":                d.get("id"),
            "agent_name":        d.get("agent_name", ""),
            "action_taken":      d.get("action_taken", ""),
            "reasoning":         d.get("reasoning", ""),
            "decision_metadata": d.get("decision_metadata"),
            "created_at":        _dt(d.get("created_at")),
        })

    return {
        "id":            r.get("id"),
        "workflow_name": r.get("workflow_name", ""),
        "status":        r.get("status", "UNKNOWN"),
        "current_step":  r.get("current_step"),
        "started_at":    _dt(r.get("started_at")),
        "completed_at":  _dt(r.get("completed_at")),
        "decisions":     decisions,
    }


@router.post("/trigger/{collision_id}", response_model=APIResponse[dict])
def trigger_agent_mitigation_workflow(
    collision_id: int, db: MongoSession = Depends(get_db)
):
    collision = db.db["conjunctions"].find_one({"id": collision_id})
    if not collision:
        raise NotFoundError(resource="Collision conjunction", identifier=collision_id)

    run_id = run_agent_workflow(db, collision_id)
    return APIResponse(
        success=True,
        message="LangGraph collision avoidance agent workflow triggered",
        data={"run_id": run_id, "status": "RUNNING"},
    )


@router.get("/runs", response_model=APIResponse[List[Dict[str, Any]]])
def get_agent_runs(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1),
    db: MongoSession = Depends(get_db),
):
    col    = db.db["agent_runs"]
    total  = col.count_documents({})
    offset = (page - 1) * size
    docs   = list(col.find({}, {"_id": 0}).sort("started_at", -1).skip(offset).limit(size))
    pages  = (total + size - 1) // size if total else 1

    return APIResponse(
        success=True,
        message="Agent run registry logs fetched",
        data=[_serialize_run(d) for d in docs],
        pagination=PaginationSchema(page=page, size=size, total=total, pages=pages),
    )


@router.get("/runs/{run_id}", response_model=APIResponse[Dict[str, Any]])
def get_agent_run_details(run_id: int, db: MongoSession = Depends(get_db)):
    doc = db.db["agent_runs"].find_one({"id": run_id}, {"_id": 0})
    if not doc:
        raise NotFoundError(resource="Agent run", identifier=run_id)
    return APIResponse(
        success=True,
        message="Agent run telemetry retrieved",
        data=_serialize_run(doc),
    )
