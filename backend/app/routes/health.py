from datetime import datetime
from fastapi import APIRouter
from app.services.traffic_service import TrafficService

router = APIRouter()

@router.get("/health")
def health_check():
    """
    Basic health check endpoint to verify the API is running.
    """
    state = TrafficService.get_current_state()
    return {
        "status": "ok",
        "service": "smart-traffic-simulation-api",
        "timestamp": datetime.utcnow(),
        "simulation": {
            "simulation_status": state.intersection.simulation_status,
            "mode": state.intersection.mode,
            "scenario": state.intersection.scenario,
        },
    }
