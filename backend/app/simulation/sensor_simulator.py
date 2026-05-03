import random
from app.models.schemas import Lane
from app.models.enums import Scenario

MAX_VEHICLES_PER_LANE = 15


class SensorSimulator:
    """
    Simulates traffic sensors generating data for lanes.
    """

    @staticmethod
    def generate_sensor_data(lane: Lane, scenario: Scenario = Scenario.DAY) -> None:
        """
        Simulates smooth variation in vehicle count for a lane.
        Updates vehicle_count and congestion_level in-place.
        """
        delta = random.randint(-2, 2)
        new_count = lane.vehicle_count + delta
        lane.vehicle_count = max(0, min(new_count, MAX_VEHICLES_PER_LANE))
        lane.congestion_level = lane.vehicle_count / MAX_VEHICLES_PER_LANE
