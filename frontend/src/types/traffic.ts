export type SignalState = "RED" | "GREEN" | "YELLOW";
export type Mode = "MANUAL" | "ADAPTIVE" | "TIMED";
export type Scenario = "DAY" | "NIGHT" | "RAIN";
export type SimulationStatus = "RUNNING" | "PAUSED" | "STOPPED";
export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type EventType = "SIGNAL_CHANGE" | "EMERGENCY_VEHICLE" | "MODE_CHANGE" | "CONGESTION_ALERT" | "PEDESTRIAN_REQUEST" | "SCENARIO_CHANGE" | "SYSTEM_ERROR";

export interface Lane {
  id: string;
  name: string;
  vehicle_count: number;
  congestion_level: number;
  waiting_time: number;
  signal_state: SignalState;
  emergency_flag: boolean;
  pedestrian_request: boolean;
}

export interface Intersection {
  lanes: Lane[];
  current_active_lane: string | null;
  mode: Mode;
  scenario: Scenario;
  simulation_status: SimulationStatus;
  simulation_speed: number;
}

export interface EventLog {
  timestamp: string;
  type: EventType;
  description: string;
}

export interface Alert {
  type: EventType;
  severity: AlertSeverity;
  message: string;
  timestamp: string;
}

export interface SimulationState {
  intersection: Intersection;
  recent_events: EventLog[];
  active_alerts: Alert[];
}

export interface AnalyticsSnapshot {
  timestamp: string;
  average_waiting_time: number;
  congestion_trends: Record<string, number>;
}
