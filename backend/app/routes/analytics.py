from fastapi import APIRouter
from app.services.analytics_service import AnalyticsService
from app.models.schemas import AnalyticsSnapshot, AnalyticsSummary

router = APIRouter(prefix="/simulation", tags=["Analytics"])

@router.get("/analytics", response_model=AnalyticsSnapshot)
def get_analytics():
    """
    Retrieves current snapshot of traffic analytics.
    """
    return AnalyticsService.generate_snapshot()

@router.get("/analytics/summary", response_model=AnalyticsSummary)
def get_analytics_summary():
    """
    Retrieves high-level summary statistics.
    """
    return AnalyticsService.get_summary_stats()
