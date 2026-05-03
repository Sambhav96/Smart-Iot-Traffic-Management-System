import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.enums import SimulationStatus, Mode


class TestSimulationEndpoints:
    @pytest.fixture
    def client(self):
        return TestClient(app)

    def test_start_endpoint(self, client):
        """Test that start endpoint changes simulation status to RUNNING."""
        response = client.post("/api/simulation/start")
        assert response.status_code == 200
        assert response.json() == {"message": "Simulation started"}

        # Check state endpoint
        state_response = client.get("/api/simulation/state")
        assert state_response.status_code == 200
        state_data = state_response.json()
        assert state_data["intersection"]["simulation_status"] == "RUNNING"

    def test_pause_endpoint(self, client):
        """Test that pause endpoint changes simulation status to PAUSED."""
        # First start simulation
        client.post("/api/simulation/start")

        response = client.post("/api/simulation/pause")
        assert response.status_code == 200
        assert response.json() == {"message": "Simulation paused"}

        # Check state
        state_response = client.get("/api/simulation/state")
        state_data = state_response.json()
        assert state_data["intersection"]["simulation_status"] == "PAUSED"

    def test_reset_endpoint(self, client):
        """Test that reset endpoint resets simulation to initial state."""
        # Start and modify state
        client.post("/api/simulation/start")
        client.post("/api/simulation/mode", json={"mode": "MANUAL"})

        response = client.post("/api/simulation/reset")
        assert response.status_code == 200
        assert response.json() == {"message": "Simulation reset"}

        # Check state is reset
        state_response = client.get("/api/simulation/state")
        state_data = state_response.json()
        assert state_data["intersection"]["simulation_status"] == "STOPPED"
        assert state_data["intersection"]["mode"] == "TIMED"

    def test_step_endpoint(self, client):
        """Test that step endpoint advances simulation by one tick."""
        response = client.post("/api/simulation/step")
        assert response.status_code == 200
        assert response.json() == {"message": "Simulation stepped forward one tick"}

        # Verify it only works when stopped/paused
        client.post("/api/simulation/start")
        step_response = client.post("/api/simulation/step")
        assert (
            step_response.status_code == 200
        )  # Should still work, but doesn't change status


class TestEmergencyActivation:
    @pytest.fixture
    def client(self):
        return TestClient(app)

    def test_emergency_activation(self, client):
        """Test emergency activation sets lane to priority."""
        response = client.post(
            "/api/simulation/emergency/activate", json={"lane_id": "north"}
        )
        assert response.status_code == 200
        assert "Emergency priority activated" in response.json()["message"]

        # Check state
        state_response = client.get("/api/simulation/state")
        state_data = state_response.json()
        north_lane = next(
            lane
            for lane in state_data["intersection"]["lanes"]
            if lane["id"] == "north"
        )
        assert north_lane["emergency_flag"] is True
        assert north_lane["signal_state"] == "GREEN"
        assert state_data["intersection"]["current_active_lane"] == "north"

    def test_emergency_resolution(self, client):
        """Test emergency resolution clears priority."""
        # Activate emergency first
        client.post("/api/simulation/emergency/activate", json={"lane_id": "south"})

        # Resolve it
        response = client.post(
            "/api/simulation/emergency/resolve", json={"lane_id": "south"}
        )
        assert response.status_code == 200
        assert "Emergency resolved" in response.json()["message"]

        # Check state
        state_response = client.get("/api/simulation/state")
        state_data = state_response.json()
        south_lane = next(
            lane
            for lane in state_data["intersection"]["lanes"]
            if lane["id"] == "south"
        )
        assert south_lane["emergency_flag"] is False


class TestModeSwitching:
    @pytest.fixture
    def client(self):
        return TestClient(app)

    def test_mode_switch_to_manual(self, client):
        """Test switching to manual mode."""
        response = client.post("/api/simulation/mode", json={"mode": "MANUAL"})
        assert response.status_code == 200
        assert response.json() == {"message": "Mode switched to MANUAL"}

        # Check state
        state_response = client.get("/api/simulation/state")
        state_data = state_response.json()
        assert state_data["intersection"]["mode"] == "MANUAL"

    def test_mode_switch_to_adaptive(self, client):
        """Test switching to adaptive mode."""
        response = client.post("/api/simulation/mode", json={"mode": "ADAPTIVE"})
        assert response.status_code == 200
        assert response.json() == {"message": "Mode switched to ADAPTIVE"}

        # Check state
        state_response = client.get("/api/simulation/state")
        state_data = state_response.json()
        assert state_data["intersection"]["mode"] == "ADAPTIVE"
