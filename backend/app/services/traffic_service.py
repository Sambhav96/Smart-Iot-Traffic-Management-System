from app.core.state import AppState
from app.models.schemas import SimulationState
from app.models.enums import Mode, Scenario, SignalState, EventType

MAX_MANUAL_VEHICLE_COUNT = 50


class TrafficService:
    """
    Service layer wrapping the core traffic simulation engine.
    Exposes clean methods for route handlers to interact with the engine.
    """

    @staticmethod
    def get_current_state() -> SimulationState:
        return AppState.get_engine().state

    @staticmethod
    def start_simulation() -> None:
        AppState.get_engine().start()
        AppState.get_engine()._append_event(EventType.MODE_CHANGE, "Simulation started")

    @staticmethod
    def pause_simulation() -> None:
        AppState.get_engine().pause()
        AppState.get_engine()._append_event(EventType.MODE_CHANGE, "Simulation paused")

    @staticmethod
    def reset_simulation() -> None:
        AppState.get_engine().reset()
        AppState.get_engine()._append_event(EventType.MODE_CHANGE, "Simulation reset")

    @staticmethod
    def step_simulation() -> None:
        """Manually trigger one simulation tick."""
        AppState.get_engine().tick()

    @staticmethod
    def switch_mode(mode: Mode) -> None:
        """Switch the operational mode of the intersection."""
        engine = AppState.get_engine()
        engine.state.intersection.mode = mode

    @staticmethod
    def switch_scenario(scenario: Scenario) -> None:
        """Switch the environmental scenario of the simulation."""
        AppState.get_engine().set_scenario(scenario)

    @staticmethod
    def _get_lane_or_raise(lane_id: str):
        engine = AppState.get_engine()
        for lane in engine.state.intersection.lanes:
            if lane.id == lane_id:
                return lane
        raise ValueError(f"Lane '{lane_id}' not found")

    @staticmethod
    def _require_manual_mode() -> None:
        mode = AppState.get_engine().state.intersection.mode
        if mode != Mode.MANUAL:
            raise ValueError("Manual lane control is allowed only in MANUAL mode")

    @staticmethod
    def set_active_lane_manually(lane_id: str) -> None:
        """Set a lane as active (green) through manual control path."""
        TrafficService._require_manual_mode()

        engine = AppState.get_engine()
        selected_lane = TrafficService._get_lane_or_raise(lane_id)

        for lane in engine.state.intersection.lanes:
            lane.signal_state = SignalState.RED

        selected_lane.signal_state = SignalState.GREEN
        engine.state.intersection.current_active_lane = selected_lane.id

    @staticmethod
    def set_lane_vehicle_count_manually(lane_id: str, vehicle_count: int) -> None:
        """Set lane vehicle count through a validated manual control path."""
        TrafficService._require_manual_mode()

        if vehicle_count < 0 or vehicle_count > MAX_MANUAL_VEHICLE_COUNT:
            raise ValueError(
                f"vehicle_count must be between 0 and {MAX_MANUAL_VEHICLE_COUNT}"
            )

        lane = TrafficService._get_lane_or_raise(lane_id)
        lane.vehicle_count = vehicle_count
        lane.congestion_level = vehicle_count / MAX_MANUAL_VEHICLE_COUNT

    @staticmethod
    def set_lane_signal_manually(lane_id: str, signal_state: SignalState) -> None:
        """Force a lane signal update through approved manual path."""
        TrafficService._require_manual_mode()

        engine = AppState.get_engine()
        lane = TrafficService._get_lane_or_raise(lane_id)

        lane.signal_state = signal_state

        if signal_state == SignalState.GREEN:
            for other_lane in engine.state.intersection.lanes:
                if other_lane.id != lane.id:
                    other_lane.signal_state = SignalState.RED
            engine.state.intersection.current_active_lane = lane.id
        elif (
            engine.state.intersection.current_active_lane == lane.id
            and signal_state != SignalState.GREEN
        ):
            engine.state.intersection.current_active_lane = None

    @staticmethod
    def activate_emergency(lane_id: str) -> None:
        AppState.get_engine().activate_emergency(lane_id)

    @staticmethod
    def resolve_emergency(lane_id: str | None = None) -> None:
        AppState.get_engine().resolve_emergency(lane_id)

    @staticmethod
    def request_pedestrian_crossing(lane_id: str) -> None:
        AppState.get_engine().request_pedestrian_crossing(lane_id)

    @staticmethod
    def clear_pedestrian_crossing(lane_id: str) -> None:
        AppState.get_engine().clear_pedestrian_crossing(lane_id)
