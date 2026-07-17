from debug_log import configure_debug_logging, debug
configure_debug_logging()
import uvicorn
import json
import logging

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.error_handlers import register_exception_handlers
from api.router import api_router
from websocket.manager import manager
from schemas.api_schemas import ErrorResponse


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Powered Space Debris Collision Avoidance & Autonomous Space Traffic Management Platform",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        404: {"model": ErrorResponse, "description": "Not Found"},
        409: {"model": ErrorResponse, "description": "Conflict"},
        422: {"model": ErrorResponse, "description": "Validation Error"},
        502: {"model": ErrorResponse, "description": "Upstream Service Error"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"},
    },
)

register_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Health"])
def root():
    return {"success": True, "message": "KEPLER AI backend is running 🚀"}


@app.get("/health", tags=["Health"])
def health_check():
    return {"success": True, "status": "healthy", "service": settings.PROJECT_NAME}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            action = message.get("action")
            channel = message.get("channel")

            if action == "subscribe" and channel:
                manager.subscribe(websocket, channel)
                await websocket.send_text(json.dumps({
                    "success": True,
                    "message": f"Subscribed to channel: {channel}"
                }))
            elif action == "unsubscribe" and channel:
                manager.unsubscribe(websocket, channel)
                await websocket.send_text(json.dumps({
                    "success": True,
                    "message": f"Unsubscribed from channel: {channel}"
                }))
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)


@app.on_event("startup")
async def on_startup():
    logger.info("Initializing PostgreSQL database schema...")
    try:
        from database.session import engine, Base, SessionLocal
        # Import all models so Base.metadata is populated
        import models.db_models  # noqa: F401
        Base.metadata.create_all(bind=engine)
        logger.info("✅ PostgreSQL tables created / verified.")

        db = SessionLocal()
        try:
            from models.db_models import Organization, Role
            org = db.query(Organization).first()
            if not org:
                db.add(Organization(name="Global Space Command", description="Lead Space Avoidance Agency"))
                db.commit()

            role = db.query(Role).first()
            if not role:
                db.add(Role(name="Operator", description="Mission Control Operator"))
                db.commit()
            logger.info("✅ PostgreSQL seed data verified.")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"⚠️  PostgreSQL init failed: {e}")
        logger.warning("Continuing without DB — some features unavailable.")

    try:
        from app.core.scheduler import scheduler
        scheduler.start_all()
        logger.info("✅ Background scheduler started.")
    except Exception as e:
        logger.error(f"⚠️  Scheduler start failed: {e}")


@app.on_event("shutdown")
async def on_shutdown():
    try:
        from app.core.scheduler import scheduler
        scheduler.stop_all()
    except Exception:
        pass


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
