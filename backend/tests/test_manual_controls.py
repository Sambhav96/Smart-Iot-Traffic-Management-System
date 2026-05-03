import pytest
from app.services.traffic_service import TrafficService
from app.models.enums import Mode, SignalState


class TestManualControlsValidation:
    def test_set_lane_vehicle_count_validates_input(self, engine):
        """Test that manual vehicle count setting validates inputs."""
        # Switch to manual mode
        engine.state.intersection.mode = Mode.MANUAL

        # Valid input should work
        TrafficService.set_lane_vehicle_count_manually("north", 25)
        north_lane = next(
            lane for lane in engine.state.intersection.lanes if lane.id == "north"
        )
        assert north_lane.vehicle_count == 25
        assert north_lane.congestion_level == 25 / 50  # MAX_MANUAL_VEHICLE_COUNT = 50

        # Invalid inputs should raise ValueError
        with pytest.raises(ValueError, match="vehicle_count must be between 0 and 50"):
            TrafficService.set_lane_vehicle_count_manually("north", -1)

        with pytest.raises(ValueError, match="vehicle_count must be between 0 and 50"):
            TrafficService.set_lane_vehicle_count_manually("north", 51)

        # Invalid lane ID
        with pytest.raises(ValueError, match="Lane 'invalid' not found"):
            TrafficService.set_lane_vehicle_count_manually("invalid", 10)

    def test_manual_controls_require_manual_mode(self, engine):
        """Test that manual controls only work in MANUAL mode."""
        # Default is TIMED mode
        with pytest.raises(
            ValueError, match="Manual lane control is allowed only in MANUAL mode"
        ):
            TrafficService.set_lane_vehicle_count_manually("north", 10)

        with pytest.raises(
            ValueError, match="Manual lane control is allowed only in MANUAL mode"
        ):
            TrafficService.set_active_lane_manually("north")

        with pytest.raises(
            ValueError, match="Manual lane control is allowed only in MANUAL mode"
        ):
            TrafficService.set_lane_signal_manually("north", SignalState.GREEN)

    def test_set_active_lane_manually(self, engine):
        """Test manual active lane setting."""
        engine.state.intersection.mode = Mode.MANUAL

        TrafficService.set_active_lane_manually("south")

        # Check south is green, others red
        for lane in engine.state.intersection.lanes:
            if lane.id == "south":
                assert lane.signal_state == SignalState.GREEN
            else:
                assert lane.signal_state == SignalState.RED
        assert engine.state.intersection.current_active_lane == "south"

    def test_set_lane_signal_manually(self, engine):
        """Test manual signal setting."""
        engine.state.intersection.mode = Mode.MANUAL

        TrafficService.set_lane_signal_manually("east", SignalState.YELLOW)

        east_lane = next(
            lane for lane in engine.state.intersection.lanes if lane.id == "east"
        )
        assert east_lane.signal_state == SignalState.YELLOW

        # Setting to green should update current_active_lane
        TrafficService.set_lane_signal_manually("west", SignalState.GREEN)
        assert engine.state.intersection.current_active_lane == "west"
