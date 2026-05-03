from app.models.schemas import Intersection, Alert, EventLog
from app.models.enums import AlertSeverity, EventType
from typing import List, Tuple

HIGH_VEHICLE_COUNT_THRESHOLD = 10
WAITING_TIME_ALERT_THRESHOLD_SECONDS = 10.0


class RulesEngine:
    """
    Evaluates business rules to generate alerts and events.
    """

    @staticmethod
    def evaluate_rules(
        intersection: Intersection,
    ) -> Tuple[List[Alert], List[EventLog]]:
        """
        Checks current intersection state against defined thresholds.
        """
        alerts = []
        events = []
        for lane in intersection.lanes:
            # Check for high vehicle count
            if lane.vehicle_count > HIGH_VEHICLE_COUNT_THRESHOLD:
                alerts.append(
                    Alert(
                        type=EventType.CONGESTION_ALERT,
                        severity=AlertSeverity.HIGH,
                        message=f"High vehicle count in {lane.name} ({lane.vehicle_count} vehicles)",
                    )
                )
                events.append(
                    EventLog(
                        type=EventType.CONGESTION_ALERT,
                        description=f"Congestion alert: High vehicle count in {lane.name} ({lane.vehicle_count} vehicles)",
                    )
                )

            # Check for high waiting time
            if lane.waiting_time > WAITING_TIME_ALERT_THRESHOLD_SECONDS:
                alerts.append(
                    Alert(
                        type=EventType.CONGESTION_ALERT,
                        severity=AlertSeverity.MEDIUM,
                        message=f"High waiting time in {lane.name} ({lane.waiting_time:.1f} seconds)",
                    )
                )
                events.append(
                    EventLog(
                        type=EventType.CONGESTION_ALERT,
                        description=f"Congestion alert: High waiting time in {lane.name} ({lane.waiting_time:.1f} seconds)",
                    )
                )

            # Check for emergency vehicles
            if lane.emergency_flag:
                alerts.append(
                    Alert(
                        type=EventType.EMERGENCY_VEHICLE,
                        severity=AlertSeverity.HIGH,
                        message=f"Emergency vehicle detected in {lane.name}",
                    )
                )

            if lane.pedestrian_request:
                alerts.append(
                    Alert(
                        type=EventType.PEDESTRIAN_REQUEST,
                        severity=AlertSeverity.MEDIUM,
                        message=f"Pedestrian crossing requested at {lane.name}",
                    )
                )
        return alerts, events
