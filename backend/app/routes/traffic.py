from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from app.services.traffic_service import TrafficService
from app.models.enums import SignalState

router = APIRouter(prefix="/simulation", tags=["Traffic"])

class LaneVehicleCountRequest(BaseModel):
    lane_id: str
    vehicle_count: int = Field(..., ge=0, le=50)

class ActiveLaneRequest(BaseModel):
    lane_id: str

class LaneSignalRequest(BaseModel):
    lane_id: str
    signal_state: SignalState

class EmergencyRequest(BaseModel):
    lane_id: str

class EmergencyResolveRequest(BaseModel):
    lane_id: Optional[str] = None

@router.post("/lane/active")
def set_active_lane(request: ActiveLaneRequest):
    """Manually set the currently active lane (MANUAL mode only)."""
    try:
        TrafficService.set_active_lane_manually(request.lane_id)
        return {"message": f"Active lane set to {request.lane_id}"}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@router.post("/lane/vehicle-count")
def set_lane_vehicle_count(request: LaneVehicleCountRequest):
    """Manually set vehicle count for a lane (MANUAL mode only)."""
    try:
        TrafficService.set_lane_vehicle_count_manually(request.lane_id, request.vehicle_count)
        return {"message": f"Vehicle count updated for {request.lane_id}"}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@router.post("/lane/signal")
def set_lane_signal(request: LaneSignalRequest):
    """Manually force a lane signal update (MANUAL mode only)."""
    try:
        TrafficService.set_lane_signal_manually(request.lane_id, request.signal_state)
        return {"message": f"Signal set to {request.signal_state.value} for {request.lane_id}"}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@router.post("/emergency/activate")
def activate_emergency(request: EmergencyRequest):
    """Activate emergency priority for a selected lane."""
    try:
        TrafficService.activate_emergency(request.lane_id)
        return {"message": f"Emergency priority activated for {request.lane_id}"}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@router.post("/emergency/resolve")
def resolve_emergency(request: EmergencyResolveRequest):
    """Resolve emergency state for one lane or all lanes when lane_id is omitted."""
    try:
        TrafficService.resolve_emergency(request.lane_id)
        if request.lane_id:
            return {"message": f"Emergency resolved for {request.lane_id}"}
        return {"message": "All emergency states resolved"}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
