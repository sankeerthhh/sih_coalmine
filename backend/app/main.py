import asyncio
import logging
import traceback
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.api.router import api_router
from app.websocket.connection_manager import connection_manager
from app.services.simulator_service import simulator_service
import app.models  # ensure all models are registered with SQLAlchemy

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("subsidence.main")


async def telemetry_background_loop():
    """Periodic background loop that generates simulated telemetry ticks."""
    logger.info("Starting background telemetry generation loop...")
    while True:
        try:
            await asyncio.sleep(10)
            if simulator_service.is_running:
                await simulator_service.execute_tick()
        except asyncio.CancelledError:
            break
        except Exception as err:
            logger.error(f"Error in telemetry loop: {err}\n{traceback.format_exc()}")
            await asyncio.sleep(10)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables if not existing
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)

    # Seed default data if database is empty (safe to fail — seeding is non-critical)
    db = SessionLocal()
    try:
        from seed_data import seed_database
        seed_database(db)
    except Exception as seed_err:
        logger.warning(f"Database seeding skipped or failed (non-critical): {seed_err}")
    finally:
        db.close()

    # Start background telemetry generator task
    loop_task = asyncio.create_task(telemetry_background_loop())
    logger.info("Application startup complete.")

    yield

    # Shutdown: cancel background tasks gracefully
    loop_task.cancel()
    try:
        await loop_task
    except asyncio.CancelledError:
        pass
    logger.info("Application shutdown complete.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Ministry of Coal, Government of India — AI-Enabled Smart Mine Subsidence Monitoring & Early Warning Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware — origins are configured via BACKEND_CORS_ORIGINS in config / env
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# Register all REST API routes under /api/v1
app.include_router(api_router, prefix=settings.API_V1_STR)


# Real-time WebSocket telemetry stream endpoint
@app.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await connection_manager.connect(websocket)
    try:
        await websocket.send_json({
            "type": "CONNECTION_ESTABLISHED",
            "message": "Connected to Mine Subsidence Telemetry Stream"
        })
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket)
    except Exception as exc:
        logger.warning(f"WebSocket exception: {exc}")
        connection_manager.disconnect(websocket)


@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "organization": settings.ORGANIZATION,
        "status": "OPERATIONAL",
        "docs_url": "/docs",
        "api_v1": "/api/v1"
    }


@app.get("/health")
@app.get("/api/v1/health")  # Docker healthcheck target
def health():
    return {"status": "HEALTHY"}
