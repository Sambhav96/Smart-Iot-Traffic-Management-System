from enum import Enum


class SignalState(str, Enum):
    """Represents the current state of a traffic signal."""

    RED = "RED"
    GREEN = "GREEN"
    YELLOW = "YELLOW"


class Mode(str, Enum):
    """Represents the operational mode of the intersection."""

    MANUAL = "MANUAL"
    ADAPTIVE = "ADAPTIVE"
    TIMED = "TIMED"


class Scenario(str, Enum):
    """Represents environmental scenario affecting simulation behavior."""

    DAY = "DAY"
    NIGHT = "NIGHT"
    RAIN = "RAIN"


class SimulationStatus(str, Enum):
    """Represents the status of the simulation engine."""

    RUNNING = "RUNNING"
    PAUSED = "PAUSED"
    STOPPED = "STOPPED"


class AlertSeverity(str, Enum):
    """Represents the severity level of an alert."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class CongestionLevel(str, Enum):
    """Represents the congestion classification based on vehicle count."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class EventType(str, Enum):
    """Represents the type of event logged in the system."""

    SIGNAL_CHANGE = "SIGNAL_CHANGE"
    EMERGENCY_VEHICLE = "EMERGENCY_VEHICLE"
    MODE_CHANGE = "MODE_CHANGE"
    CONGESTION_ALERT = "CONGESTION_ALERT"
    PEDESTRIAN_REQUEST = "PEDESTRIAN_REQUEST"
    SCENARIO_CHANGE = "SCENARIO_CHANGE"
    SYSTEM_ERROR = "SYSTEM_ERROR"
