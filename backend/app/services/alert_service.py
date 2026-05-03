from app.core.state import AppState
from typing import List
from app.models.schemas import Alert
from app.models.enums import AlertSeverity

class AlertService:
    """
    Service layer for retrieving and filtering system alerts.
    """
    @staticmethod
    def get_all_alerts() -> List[Alert]:
        return AppState.get_engine().state.active_alerts

    @staticmethod
    def get_alerts_by_severity(severity: AlertSeverity) -> List[Alert]:
        alerts = AppState.get_engine().state.active_alerts
        return [a for a in alerts if a.severity == severity]
