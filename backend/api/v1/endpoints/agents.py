"""
/api/v1/agents — AI Agent Workflow Endpoints
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from database.session import get_db
from models.db_models import AgentRun, CollisionPrediction
from app.core.exceptions import NotFoundError
from schemas.api_schemas import APIResponse, PaginationSchema
from ai.workflow import run_agent_workflow

router = APIRouter()


def _serialize_run(run: AgentRun) -> dict:
    def _dt(v):
        return v.isoformat() if v else None

    decisions = [
        {
            "id":                d.id,
            "agent_name":        d.agent_name,
            "action_taken":      d.action_taken,
            "reasoning":         d.reasoning,
            "decision_metadata": d.decision_metadata,
            "created_at":        _dt(d.created_at),
        }
        for d in (run.decisions or [])
    ]

    return {
        "id":            run.id,
        "workflow_name": run.workflow_name,
        "status":        run.status,
        "current_step":  run.current_step,
        "started_at":    _dt(run.started_at),
        "completed_at":  _dt(run.completed_at),
        "decisions":     decisions,
    }


@router.post("/trigger/{collision_id}", response_model=APIResponse[dict])
def trigger_agent_mitigation_workflow(collision_id: int, db: Session = Depends(get_db)):
    collision = db.query(CollisionPrediction).filter(CollisionPrediction.id == collision_id).first()
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
    db: Session = Depends(get_db),
):
    total  = db.query(AgentRun).count()
    offset = (page - 1) * size
    runs   = db.query(AgentRun).order_by(AgentRun.started_at.desc()).offset(offset).limit(size).all()
    pages  = (total + size - 1) // size if total else 1

    return APIResponse(
        success=True,
        message="Agent run registry logs fetched",
        data=[_serialize_run(r) for r in runs],
        pagination=PaginationSchema(page=page, size=size, total=total, pages=pages),
    )


@router.get("/runs/{run_id}", response_model=APIResponse[Dict[str, Any]])
def get_agent_run_details(run_id: int, db: Session = Depends(get_db)):
    run = db.query(AgentRun).filter(AgentRun.id == run_id).first()
    if not run:
        raise NotFoundError(resource="Agent run", identifier=run_id)
    return APIResponse(
        success=True,
        message="Agent run telemetry retrieved",
        data=_serialize_run(run),
    )
