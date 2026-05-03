from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.traffic_service import TrafficService
from app.models.schemas import SimulationState
from app.models.enums import Mode, Scenario

router = APIRouter(prefix="/simulation", tags=["Simulation"])


class ModeChangeRequest(BaseModel):
    mode: Mode


class ScenarioChangeRequest(BaseModel):
    scenario: Scenario


class PedestrianRequest(BaseModel):
    lane_id: str


class EmergencyRequest(BaseModel):
    lane_id: str


class EmergencyClearRequest(BaseModel):
    lane_id: str | None = None


@router.get("/state", response_model=SimulationState)
def get_state():
    """Returns the full current state of the simulation."""
    return TrafficService.get_current_state()


@router.post("/start")
def start_simulation():
    """Starts the simulation engine."""
    TrafficService.start_simulation()
    return {"message": "Simulation started"}


@router.post("/pause")
def pause_simulation():
    """Pauses the simulation engine."""
    TrafficService.pause_simulation()
    return {"message": "Simulation paused"}


@router.post("/reset")
def reset_simulation():
    """Resets the simulation to its default state."""
    TrafficService.reset_simulation()
    return {"message": "Simulation reset"}


@router.post("/step")
def step_simulation():
    """Manually trigger one tick of the simulation."""
    TrafficService.step_simulation()
    return {"message": "Simulation stepped forward one tick"}


@router.post("/mode")
def set_mode(request: ModeChangeRequest):
    """Switch the operational mode of the intersection."""
    TrafficService.switch_mode(request.mode)
    return {"message": f"Mode switched to {request.mode.value}"}


@router.post("/scenario")
def set_scenario(request: ScenarioChangeRequest):
    """Switch simulation scenario (DAY/NIGHT/RAIN)."""
    TrafficService.switch_scenario(request.scenario)
    return {"message": f"Scenario switched to {request.scenario.value}"}


@router.post("/pedestrian/request")
def request_pedestrian_crossing(request: PedestrianRequest):
    """Create a pedestrian crossing request on the selected lane."""
    try:
        TrafficService.request_pedestrian_crossing(request.lane_id)
        return {"message": f"Pedestrian request set for {request.lane_id}"}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/pedestrian/clear")
def clear_pedestrian_crossing(request: PedestrianRequest):
    """Clear a pending pedestrian crossing request on the selected lane."""
    try:
        TrafficService.clear_pedestrian_crossing(request.lane_id)
        return {"message": f"Pedestrian request cleared for {request.lane_id}"}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/emergency")
def trigger_emergency(request: EmergencyRequest):
    """Activate emergency override for a selected lane."""
    try:
        TrafficService.activate_emergency(request.lane_id)
        return {"message": f"Emergency activated for {request.lane_id}"}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/emergency/clear")
def clear_emergency(request: EmergencyClearRequest):
    """Clear emergency override for one lane or all lanes."""
    try:
        TrafficService.resolve_emergency(request.lane_id)
        if request.lane_id:
            return {"message": f"Emergency cleared for {request.lane_id}"}
        return {"message": "Emergency cleared"}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
