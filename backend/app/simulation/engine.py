import random
from app.models.schemas import SimulationState, Intersection, Lane, EventLog
from app.models.enums import SimulationStatus, Mode, Scenario, SignalState, EventType
from .sensor_simulator import SensorSimulator, MAX_VEHICLES_PER_LANE
from .traffic_logic import TrafficController
from .rules_engine import RulesEngine


class SimulationEngine:
    """
    The core orchestrator for the traffic simulation.
    Holds the state and coordinates updates per tick.
    """

    def __init__(self):
        self.state = self._initialize_default_state()
        self.traffic_controller = TrafficController()
        self._disable_sensor_updates = False  # For deterministic testing

    def _initialize_default_state(self) -> SimulationState:
        """Creates the initial 4-lane intersection."""
        lanes = [
            Lane(id="north", name="North Lane", signal_state=SignalState.GREEN),
            Lane(id="south", name="South Lane"),
            Lane(id="east", name="East Lane"),
            Lane(id="west", name="West Lane"),
        ]
        intersection = Intersection(
            lanes=lanes,
            current_active_lane="north",
            mode=Mode.TIMED,
            scenario=Scenario.DAY,
            simulation_status=SimulationStatus.STOPPED,
            simulation_speed=1.0,
        )
        return SimulationState(
            intersection=intersection, recent_events=[], active_alerts=[]
        )

    def tick(self):
        """
        Runs one simulation step. Should be called periodically.
        """
        if self.state.intersection.simulation_status != SimulationStatus.RUNNING:
            return

        intersection = self.state.intersection

        # 1. Update Sensors (generate random traffic fluctuations)
        # Skip sensor updates if disabled (for deterministic testing)
        if not self._disable_sensor_updates:
            for lane in intersection.lanes:
                SensorSimulator.generate_sensor_data(lane, intersection.scenario)

            # Occasionally bias one lane for higher traffic to keep demos visually active.
            if intersection.mode != Mode.ADAPTIVE and random.random() < 0.2:  # 20% chance per tick
                biased_lane = random.choice(intersection.lanes)
                extra = random.randint(2, 5)
                biased_lane.vehicle_count = min(
                    MAX_VEHICLES_PER_LANE, biased_lane.vehicle_count + extra
                )
                biased_lane.congestion_level = (
                    biased_lane.vehicle_count / MAX_VEHICLES_PER_LANE
                )

        # 2. Update Traffic Logic (handle lights and waiting times)
        signal_events = self.traffic_controller.update_signals(intersection)
        for event in signal_events:
            self._append_event(event.type, event.description)
        self._resolve_crossing_if_granted()
        self.traffic_controller.update_waiting_times(intersection)
        self.traffic_controller.update_congestion(intersection)

        # 3. Evaluate Rules (generate alerts)
        self._refresh_alerts()

    def _find_lane(self, lane_id: str) -> Lane:
        for lane in self.state.intersection.lanes:
            if lane.id == lane_id:
                return lane
        raise ValueError(f"Lane '{lane_id}' not found")

    def _append_event(self, event_type: EventType, description: str) -> None:
        self.state.recent_events.insert(
            0, EventLog(type=event_type, description=description)
        )
        self.state.recent_events = self.state.recent_events[:100]

    def _refresh_alerts(self) -> None:
        alerts, events = RulesEngine.evaluate_rules(self.state.intersection)
        self.state.active_alerts = alerts
        for event in events:
            self._append_event(event.type, event.description)

    def _resolve_crossing_if_granted(self) -> None:
        intersection = self.state.intersection
        active_lane = intersection.current_active_lane
        if not active_lane:
            return

        for lane in intersection.lanes:
            if lane.id == active_lane and lane.pedestrian_request:
                lane.pedestrian_request = False
                self._append_event(
                    EventType.PEDESTRIAN_REQUEST,
                    f"Pedestrian crossing granted on {lane.name}",
                )
                return

    def activate_emergency(self, lane_id: str) -> None:
        """Activate emergency priority for a selected lane."""
        lane = self._find_lane(lane_id)
        intersection = self.state.intersection

        for target in intersection.lanes:
            target.emergency_flag = target.id == lane_id
            target.signal_state = (
                SignalState.GREEN if target.id == lane_id else SignalState.RED
            )

        intersection.current_active_lane = lane_id

        self._append_event(
            EventType.EMERGENCY_VEHICLE,
            f"Emergency vehicle detected in {lane.name}",
        )
        self._refresh_alerts()

    def resolve_emergency(self, lane_id: str | None = None) -> None:
        """Resolve emergency state globally or for one lane."""
        intersection = self.state.intersection
        resolved_lane_names: list[str] = []

        for lane in intersection.lanes:
            should_clear = lane.emergency_flag and (
                lane_id is None or lane.id == lane_id
            )
            if should_clear:
                lane.emergency_flag = False
                resolved_lane_names.append(lane.name)

        if not resolved_lane_names:
            raise ValueError("No matching active emergency to resolve")

        if lane_id is None or intersection.current_active_lane == lane_id:
            intersection.current_active_lane = None

        lane_text = ", ".join(resolved_lane_names)
        self._append_event(
            EventType.EMERGENCY_VEHICLE,
            f"Emergency resolved for {lane_text}",
        )
        self._refresh_alerts()

    def set_scenario(self, scenario: Scenario) -> None:
        intersection = self.state.intersection
        old_scenario = intersection.scenario
        if old_scenario == scenario:
            return

        intersection.scenario = scenario
        self._append_event(
            EventType.SCENARIO_CHANGE,
            f"Scenario changed from {old_scenario.value} to {scenario.value}",
        )

    def request_pedestrian_crossing(self, lane_id: str) -> None:
        lane = self._find_lane(lane_id)
        if lane.pedestrian_request:
            raise ValueError(f"Pedestrian request already active for {lane.name}")

        lane.pedestrian_request = True
        self._append_event(
            EventType.PEDESTRIAN_REQUEST,
            f"Pedestrian crossing requested on {lane.name}",
        )
        self._refresh_alerts()

    def clear_pedestrian_crossing(self, lane_id: str) -> None:
        lane = self._find_lane(lane_id)
        if not lane.pedestrian_request:
            raise ValueError(f"No pedestrian request active for {lane.name}")

        lane.pedestrian_request = False
        self._append_event(
            EventType.PEDESTRIAN_REQUEST,
            f"Pedestrian request cleared on {lane.name}",
        )
        self._refresh_alerts()

    def start(self):
        self.state.intersection.simulation_status = SimulationStatus.RUNNING

    def pause(self):
        self.state.intersection.simulation_status = SimulationStatus.PAUSED

    def reset(self):
        self.state = self._initialize_default_state()
        self.traffic_controller = TrafficController()
