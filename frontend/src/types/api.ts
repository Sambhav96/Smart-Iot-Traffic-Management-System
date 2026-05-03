export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface HealthResponse {
  status: "ok" | "error";
  service: string;
  timestamp: string;
  simulation: {
    simulation_status: import("./traffic").SimulationStatus;
    mode: import("./traffic").Mode;
    scenario: import("./traffic").Scenario;
  };
}

export interface SimulationLogsResponse {
  recent_events: import("./traffic").EventLog[];
  active_alerts: import("./traffic").Alert[];
}

export interface MostCongestedLaneSummary {
  lane_id: string;
  lane_name: string;
  congestion_level: number;
  congestion_percent: number;
  vehicle_count: number;
}

export interface LaneCongestionSummary {
  lane_id: string;
  lane_name: string;
  congestion_level: number;
  congestion_percent: number;
  vehicle_count: number;
  waiting_time: number;
}

export interface AnalyticsSummaryResponse {
  timestamp: string;
  average_waiting_time: number;
  total_vehicles: number;
  total_alerts: number;
  total_events: number;
  most_congested_lane: MostCongestedLaneSummary | null;
  lane_congestion_summaries: LaneCongestionSummary[];
}

export interface ModeChangeRequest {
  mode: import("./traffic").Mode;
}

export interface ErrorResponse {
  detail: string;
}
