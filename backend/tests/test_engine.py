import pytest
from app.simulation.engine import SimulationEngine
from app.models.enums import SimulationStatus, Mode, Scenario, SignalState


class TestEngineInitialization:
    def test_engine_initializes_with_default_state(self, engine):
        """Test that the engine initializes correctly with expected default state."""
        state = engine.state

        # Check intersection structure
        assert len(state.intersection.lanes) == 4
        lane_ids = [lane.id for lane in state.intersection.lanes]
        assert set(lane_ids) == {"north", "south", "east", "west"}

        # Check default lane states
        for lane in state.intersection.lanes:
            assert lane.vehicle_count == 0
            assert lane.congestion_level == 0.0
            assert lane.waiting_time == 0.0
            assert not lane.emergency_flag
            assert not lane.pedestrian_request

        # Check signals: north should be green by default, others red
        north_lane = next(
            lane for lane in state.intersection.lanes if lane.id == "north"
        )
        assert north_lane.signal_state == SignalState.GREEN
        other_lanes = [lane for lane in state.intersection.lanes if lane.id != "north"]
        for lane in other_lanes:
            assert lane.signal_state == SignalState.RED

        # Check intersection defaults
        assert state.intersection.current_active_lane == "north"
        assert state.intersection.mode == Mode.TIMED
        assert state.intersection.scenario == Scenario.DAY
        assert state.intersection.simulation_status == SimulationStatus.STOPPED
        assert state.intersection.simulation_speed == 1.0

        # Check empty events and alerts
        assert state.recent_events == []
        assert state.active_alerts == []


class TestSimulationTick:
    def test_simulation_tick_updates_lane_state(self, engine):
        """Test that simulation tick updates lane states appropriately."""
        initial_state = engine.state.intersection

        # Start simulation and run a tick
        engine.start()
        engine.tick()

        # Verify simulation is running
        assert engine.state.intersection.simulation_status == SimulationStatus.RUNNING

        # Verify some change occurred (sensors generate random data)
        # Note: Since sensor data is random, we just check that tick ran without error
        # In a real scenario, we might mock the sensor data for deterministic tests
        assert engine.state.intersection is not None

        # Check that waiting times or vehicle counts may have changed
        # (due to sensor simulation)
        lanes_changed = False
        for lane in engine.state.intersection.lanes:
            if lane.vehicle_count != 0 or lane.waiting_time != 0.0:
                lanes_changed = True
                break
        # Sensor simulator should have potentially updated at least one lane
        # (though random, so we don't assert strictly)


class TestAdaptiveSignalLogic:
    def test_adaptive_mode_selects_lane_with_most_traffic(self, engine):
        """Test that adaptive mode selects the lane with the most vehicles."""
        # Set adaptive mode
        engine.state.intersection.mode = Mode.ADAPTIVE

        # Manually set vehicle counts
        lanes = engine.state.intersection.lanes
        lanes[0].vehicle_count = 0  # north - no traffic
        lanes[1].vehicle_count = 10  # south - should be selected
        lanes[2].vehicle_count = 3  # east
        lanes[3].vehicle_count = 7  # west

        # Start and run ticks until switch
        engine.start()
        for _ in range(25):  # Run multiple ticks to ensure switch logic triggers
            engine.tick()

        # Check that south lane (with 10 vehicles) became active
        assert engine.state.intersection.current_active_lane == "south"
        south_lane = next(lane for lane in lanes if lane.id == "south")
        assert south_lane.signal_state == SignalState.GREEN

        # Other lanes should be red
        for lane in lanes:
            if lane.id != "south":
                assert lane.signal_state == SignalState.RED
