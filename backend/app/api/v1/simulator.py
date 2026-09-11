from fastapi import APIRouter, HTTPException
from app.schemas.system import SimulatorScenarioRequest, SimulatorStatusResponse, DataSourceModeRequest
from app.services.simulator_service import simulator_service

router = APIRouter(prefix="/simulator", tags=["SIH Demonstration Simulator"])

@router.get("/status", response_model=SimulatorStatusResponse)
async def get_simulator_status():
    status = simulator_service.get_status()
    return SimulatorStatusResponse.model_validate(status)

@router.post("/mode", response_model=SimulatorStatusResponse)
async def set_data_source_mode(payload: DataSourceModeRequest):
    try:
        status = await simulator_service.set_data_source(payload.data_source)
        return SimulatorStatusResponse.model_validate(status)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/scenario", response_model=SimulatorStatusResponse)
async def trigger_scenario(payload: SimulatorScenarioRequest):
    try:
        status = await simulator_service.set_scenario(scenario=payload.scenario, speed=payload.speed or 1.0)
        return SimulatorStatusResponse.model_validate(status)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/hardware/clear", response_model=SimulatorStatusResponse)
async def clear_hardware_telemetry():
    simulator_service.clear_hardware_telemetry()
    status = simulator_service.get_status()
    from app.websocket.connection_manager import connection_manager
    await connection_manager.broadcast({
        "type": "DATA_SOURCE_MODE_CHANGED",
        "data": status
    })
    return SimulatorStatusResponse.model_validate(status)

