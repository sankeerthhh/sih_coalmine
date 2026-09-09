from fastapi import APIRouter
from app.schemas.system import SimulatorScenarioRequest, SimulatorStatusResponse
from app.services.simulator_service import simulator_service

router = APIRouter(prefix="/simulator", tags=["SIH Demonstration Simulator"])

@router.get("/status", response_model=SimulatorStatusResponse)
def get_simulator_status():
    status = simulator_service.get_status()
    return SimulatorStatusResponse.model_validate(status)

@router.post("/scenario", response_model=SimulatorStatusResponse)
async def trigger_scenario(payload: SimulatorScenarioRequest):
    status = await simulator_service.set_scenario(scenario=payload.scenario, speed=payload.speed or 1.0)
    return SimulatorStatusResponse.model_validate(status)

@router.post("/tick", response_model=SimulatorStatusResponse)
async def step_tick():
    await simulator_service.execute_tick()
    return SimulatorStatusResponse.model_validate(simulator_service.get_status())
