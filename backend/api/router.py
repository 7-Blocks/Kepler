from fastapi import APIRouter
from api.v1.endpoints import auth, satellites, collisions, agents, dashboard, catalog, weather, events

api_router = APIRouter()

api_router.include_router(auth.router,       prefix="/auth",       tags=["Authentication"])
api_router.include_router(satellites.router, prefix="/satellites", tags=["Satellites"])
api_router.include_router(collisions.router, prefix="/collisions", tags=["Collisions"])
api_router.include_router(agents.router,     prefix="/agents",     tags=["Agents"])
api_router.include_router(dashboard.router,  prefix="/dashboard",  tags=["Dashboard"])
api_router.include_router(catalog.router,    prefix="/catalog",    tags=["Orbital Catalog"])
api_router.include_router(weather.router,    prefix="/weather",    tags=["Space Weather"])
api_router.include_router(events.router,     prefix="/events",     tags=["Mission Events"])


@api_router.get("/health", tags=["Health"])
def api_health():
    return {"success": True, "status": "healthy", "service": "KEPLER AI"}