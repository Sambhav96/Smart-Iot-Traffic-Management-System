from app.core.state import AppState
from app.models.schemas import (
    AnalyticsSnapshot,
    AnalyticsSummary,
    LaneCongestionSummary,
    MostCongestedLane,
)
from datetime import datetime
from typing import Optional

class AnalyticsService:
    """
    Service layer for computing high-level metrics from the simulation state.
    """
    @staticmethod
    def generate_snapshot() -> AnalyticsSnapshot:
        engine = AppState.get_engine()
        lanes = engine.state.intersection.lanes

        total_wait = sum(lane.waiting_time for lane in lanes)
        avg_wait = total_wait / len(lanes) if lanes else 0.0

        congestion_trends = {lane.id: lane.congestion_level for lane in lanes}

        return AnalyticsSnapshot(
            timestamp=datetime.utcnow(),
            average_waiting_time=avg_wait,
            congestion_trends=congestion_trends
        )

    @staticmethod
    def get_most_congested_lane() -> Optional[dict]:
        engine = AppState.get_engine()
        lanes = engine.state.intersection.lanes
        if not lanes:
            return None
            
        most_congested = max(lanes, key=lambda l: l.congestion_level)
        return MostCongestedLane(
            lane_id=most_congested.id,
            lane_name=most_congested.name,
            congestion_level=most_congested.congestion_level,
            congestion_percent=round(most_congested.congestion_level * 100, 1),
            vehicle_count=most_congested.vehicle_count,
        )

    @staticmethod
    def get_lane_congestion_summaries() -> list[LaneCongestionSummary]:
        engine = AppState.get_engine()
        summaries: list[LaneCongestionSummary] = []

        for lane in engine.state.intersection.lanes:
            summaries.append(
                LaneCongestionSummary(
                    lane_id=lane.id,
                    lane_name=lane.name,
                    congestion_level=lane.congestion_level,
                    congestion_percent=round(lane.congestion_level * 100, 1),
                    vehicle_count=lane.vehicle_count,
                    waiting_time=round(lane.waiting_time, 1),
                )
            )

        return summaries

    @staticmethod
    def get_summary_stats() -> AnalyticsSummary:
        engine = AppState.get_engine()
        state = engine.state
        snapshot = AnalyticsService.generate_snapshot()
        total_vehicles = sum(lane.vehicle_count for lane in state.intersection.lanes)
        
        return AnalyticsSummary(
            timestamp=datetime.utcnow(),
            average_waiting_time=round(snapshot.average_waiting_time, 2),
            total_vehicles=total_vehicles,
            total_alerts=len(state.active_alerts),
            total_events=len(state.recent_events),
            most_congested_lane=AnalyticsService.get_most_congested_lane(),
            lane_congestion_summaries=AnalyticsService.get_lane_congestion_summaries(),
        )
