from app.models.schemas import Intersection, Lane, EventLog
from app.models.enums import SignalState, Mode, Scenario, CongestionLevel, EventType
from typing import Optional


class TrafficController:
    """
    Handles traffic light transitions, timing, and waiting time calculations.
    """

    def __init__(self):
        self.tick_counter = 0
        self.yellow_ticks_remaining = 0
        self.next_active_lane_id: Optional[str] = None

    def update_signals(self, intersection: Intersection) -> list[EventLog]:
        """Updates traffic signals based on intersection mode and tick duration."""
        events = []
        if not intersection.lanes:
            return

        emergency_lane = next(
            (lane for lane in intersection.lanes if lane.emergency_flag), None
        )
        if emergency_lane:
            # Emergency vehicles always get immediate right-of-way.
            for lane in intersection.lanes:
                lane.signal_state = (
                    SignalState.GREEN
                    if lane.id == emergency_lane.id
                    else SignalState.RED
                )
            intersection.current_active_lane = emergency_lane.id
            self.yellow_ticks_remaining = 0
            self.next_active_lane_id = None
            self.tick_counter = 0
            return events

        active_lane = self._get_active_lane(intersection)

        requested_pedestrian_lane = next(
            (lane for lane in intersection.lanes if lane.pedestrian_request),
            None,
        )

        if requested_pedestrian_lane and (
            not active_lane or requested_pedestrian_lane.id != active_lane.id
        ):
            # After a short minimum green time, prioritize pedestrian-requested lane.
            if self.yellow_ticks_remaining == 0 and self.tick_counter >= 2:
                self._initiate_lane_switch(
                    intersection,
                    active_lane,
                    forced_next_lane_id=requested_pedestrian_lane.id,
                    events=events,
                )
                return events

        # Handle yellow transition phase
        if self.yellow_ticks_remaining > 0:
            self.yellow_ticks_remaining -= 1
            if self.yellow_ticks_remaining == 0:
                # Yellow phase over, turn previous active to RED and next to GREEN
                if active_lane:
                    active_lane.signal_state = SignalState.RED
                    events.append(
                        EventLog(
                            type=EventType.SIGNAL_CHANGE,
                            description=f"Signal for {active_lane.name} turned red",
                        )
                    )

                # Activate next lane
                intersection.current_active_lane = self.next_active_lane_id
                new_active = self._get_active_lane(intersection)
                if new_active:
                    new_active.signal_state = SignalState.GREEN
                    events.append(
                        EventLog(
                            type=EventType.SIGNAL_CHANGE,
                            description=f"Signal for {new_active.name} turned green",
                        )
                    )

                self.next_active_lane_id = None
                self.tick_counter = 0  # reset green timer
            return events

        # Normal Operation Phase (Green Light)
        self.tick_counter += 1

        # Decide if we need to switch lanes based on Mode
        should_switch = False

        if intersection.mode == Mode.TIMED:
            threshold = 6 if intersection.scenario == Scenario.NIGHT else 10
            if self.tick_counter >= threshold:
                should_switch = True

        elif intersection.mode == Mode.ADAPTIVE:
            # AUTO mode: green duration depends on traffic density
            base_duration = 5
            if active_lane:
                extra = min(active_lane.vehicle_count // 2, 10)  # up to 10 extra ticks
                target_duration = base_duration + extra
                if (
                    self.tick_counter >= target_duration
                    or active_lane.vehicle_count == 0
                ):
                    should_switch = True
            else:
                should_switch = True

        # If Mode.MANUAL, we do not auto-switch

        if should_switch:
            self._initiate_lane_switch(intersection, active_lane, events=events)

        return events

    def _initiate_lane_switch(
        self,
        intersection: Intersection,
        current_active: Optional[Lane],
        forced_next_lane_id: Optional[str] = None,
        events: list[EventLog] = None,
    ):
        """Starts the yellow phase before switching to the next lane."""
        if current_active:
            current_active.signal_state = SignalState.YELLOW
            if events is not None:
                events.append(
                    EventLog(
                        type=EventType.SIGNAL_CHANGE,
                        description=f"Signal for {current_active.name} turning yellow",
                    )
                )

        # Determine next lane
        if forced_next_lane_id:
            self.next_active_lane_id = forced_next_lane_id
        elif intersection.mode == Mode.ADAPTIVE:
            # Pick the lane with the most vehicles currently
            next_lane = max(intersection.lanes, key=lambda l: l.vehicle_count)
            self.next_active_lane_id = next_lane.id
        else:
            # Round robin selection
            idx = 0
            if current_active:
                try:
                    idx = intersection.lanes.index(current_active)
                except ValueError:
                    pass
            next_idx = (idx + 1) % len(intersection.lanes)
            self.next_active_lane_id = intersection.lanes[next_idx].id

        # Night mode has shorter transition phase.
        self.yellow_ticks_remaining = (
            2 if intersection.scenario == Scenario.NIGHT else 3
        )

    def _get_active_lane(self, intersection: Intersection) -> Optional[Lane]:
        if not intersection.current_active_lane:
            return None
        for lane in intersection.lanes:
            if lane.id == intersection.current_active_lane:
                return lane
        return None

    def update_waiting_times(self, intersection: Intersection) -> None:
        """Updates the waiting time for all lanes based on signal state."""
        red_increment = 1.4 if intersection.scenario == Scenario.RAIN else 1.0

        for lane in intersection.lanes:
            if lane.signal_state == SignalState.RED and lane.vehicle_count > 0:
                lane.waiting_time += red_increment
            elif lane.signal_state == SignalState.GREEN:
                lane.waiting_time = 0.0

    def update_congestion(self, intersection: Intersection) -> None:
        """Updates congestion classification and percentage for all lanes."""
        for lane in intersection.lanes:
            count = lane.vehicle_count
            if count <= 4:
                lane.congestion_class = CongestionLevel.LOW
                lane.congestion_percent = 25.0
            elif count <= 9:
                lane.congestion_class = CongestionLevel.MEDIUM
                lane.congestion_percent = 60.0
            else:
                lane.congestion_class = CongestionLevel.HIGH
                lane.congestion_percent = 90.0
