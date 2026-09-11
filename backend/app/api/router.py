from fastapi import APIRouter
from app.api.v1 import (
    auth,
    dashboard,
    sensors,
    risk,
    alerts,
    analytics,
    mesh,
    system,
    admin,
    simulator,
    ai_explanation,
    mines,
    sync
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(dashboard.router)
api_router.include_router(sensors.router)
api_router.include_router(risk.router)
api_router.include_router(alerts.router)
api_router.include_router(analytics.router)
api_router.include_router(mesh.router)
api_router.include_router(system.router)
api_router.include_router(admin.router)
api_router.include_router(simulator.router)
api_router.include_router(ai_explanation.router)
api_router.include_router(mines.router)
api_router.include_router(sync.router)

