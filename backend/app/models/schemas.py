from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
from app.models.enums import (
    SignalState,
    Mode,
    Scenario,
    SimulationStatus,
    AlertSeverity,
    EventType,
    CongestionLevel,
)


class Lane(BaseModel):
    """Represents a single lane in the intersection."""

    id: str = Field(..., description="Unique identifier for the lane")
    name: str = Field(..., description="Human-readable name of the lane")
    vehicle_count: int = Field(
        0, ge=0, description="Number of vehicles currently in the lane"
    )
    congestion_level: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="Congestion level from 0.0 (empty) to 1.0 (jammed)",
    )
    congestion_class: CongestionLevel = Field(
        CongestionLevel.LOW, description="Congestion classification"
    )
    congestion_percent: float = Field(
        25.0, ge=0.0, le=100.0, description="Congestion percentage"
    )
    waiting_time: float = Field(
        0.0, ge=0.0, description="Average waiting time of vehicles in seconds"
    )
    signal_state: SignalState = Field(
        SignalState.RED, description="Current traffic signal state"
    )
    emergency_flag: bool = Field(
        False, description="True if an emergency vehicle is approaching or present"
    )
    pedestrian_request: bool = Field(
        False, description="True if a pedestrian has requested to cross"
    )


class Intersection(BaseModel):
    """Represents the traffic intersection consisting of multiple lanes."""

    lanes: List[Lane] = Field(
        default_factory=list, description="List of lanes in the intersection"
    )
    current_active_lane: Optional[str] = Field(
        None, description="ID of the currently active (green) lane, if any"
    )
    mode: Mode = Field(
        Mode.TIMED, description="Current operation mode of the intersection"
    )
    scenario: Scenario = Field(Scenario.DAY, description="Current simulation scenario")
    simulation_status: SimulationStatus = Field(
        SimulationStatus.STOPPED, description="Status of the simulation"
    )
    simulation_speed: float = Field(
        1.0, gt=0.0, description="Speed multiplier of the simulation"
    )


class EventLog(BaseModel):
    """Represents a logged event in the system."""

    timestamp: datetime = Field(
        default_factory=datetime.utcnow, description="Time when the event occurred"
    )
    type: EventType = Field(..., description="Type of the event")
    description: str = Field(..., description="Detailed description of the event")


class Alert(BaseModel):
    """Represents a system alert (e.g., high congestion, emergency)."""

    type: EventType = Field(..., description="Type of event that triggered the alert")
    severity: AlertSeverity = Field(..., description="Severity level of the alert")
    message: str = Field(..., description="Alert message content")
    timestamp: datetime = Field(
        default_factory=datetime.utcnow, description="Time when the alert was generated"
    )


class SimulationState(BaseModel):
    """Aggregates the complete current state of the simulation system."""

    intersection: Intersection = Field(
        ..., description="Current state of the intersection"
    )
    recent_events: List[EventLog] = Field(
        default_factory=list, description="Recent system events"
    )
    active_alerts: List[Alert] = Field(
        default_factory=list, description="Currently active alerts"
    )


class AnalyticsSnapshot(BaseModel):
    """Snapshot of analytics metrics at a specific point in time."""

    timestamp: datetime = Field(
        default_factory=datetime.utcnow, description="Time of the snapshot"
    )
    average_waiting_time: float = Field(
        0.0, ge=0.0, description="Overall average waiting time across all lanes"
    )
    congestion_trends: Dict[str, float] = Field(
        default_factory=dict, description="Map of lane ID to congestion level"
    )


class LaneCongestionSummary(BaseModel):
    """Lane-level analytics summary used for charts and tabular presentation."""

    lane_id: str = Field(..., description="Lane identifier")
    lane_name: str = Field(..., description="Lane display name")
    congestion_level: float = Field(
        0.0, ge=0.0, le=1.0, description="Raw congestion value in 0.0 to 1.0"
    )
    congestion_percent: float = Field(
        0.0, ge=0.0, le=100.0, description="Congestion value in percentage"
    )
    vehicle_count: int = Field(0, ge=0, description="Current lane vehicle count")
    waiting_time: float = Field(
        0.0, ge=0.0, description="Current waiting time in seconds"
    )


class MostCongestedLane(BaseModel):
    """Information about the currently most congested lane."""

    lane_id: str = Field(..., description="Lane identifier")
    lane_name: str = Field(..., description="Lane display name")
    congestion_level: float = Field(
        0.0, ge=0.0, le=1.0, description="Raw congestion value in 0.0 to 1.0"
    )
    congestion_percent: float = Field(
        0.0, ge=0.0, le=100.0, description="Congestion value in percentage"
    )
    vehicle_count: int = Field(0, ge=0, description="Current lane vehicle count")


class AnalyticsSummary(BaseModel):
    """Structured analytics summary for dashboard/analytics page consumption."""

    timestamp: datetime = Field(
        default_factory=datetime.utcnow, description="Time of the summary"
    )
    average_waiting_time: float = Field(
        0.0, ge=0.0, description="Average waiting time in seconds"
    )
    total_vehicles: int = Field(0, ge=0, description="Total vehicles across all lanes")
    total_alerts: int = Field(0, ge=0, description="Number of currently active alerts")
    total_events: int = Field(0, ge=0, description="Number of logged events")
    most_congested_lane: Optional[MostCongestedLane] = Field(
        None, description="Most congested lane snapshot"
    )
    lane_congestion_summaries: List[LaneCongestionSummary] = Field(
        default_factory=list, description="Lane-level congestion summaries"
    )
