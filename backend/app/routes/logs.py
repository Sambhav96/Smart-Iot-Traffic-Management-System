from fastapi import APIRouter
from app.services.traffic_service import TrafficService
from app.services.alert_service import AlertService
from typing import Dict, Any

router = APIRouter(prefix="/simulation", tags=["Logs"])

@router.get("/logs")
def get_logs() -> Dict[str, Any]:
    """
    Retrieves recent events and active alerts.
    """
    state = TrafficService.get_current_state()
    alerts = AlertService.get_all_alerts()
    
    return {
        "recent_events": state.recent_events,
        "active_alerts": alerts
    }
