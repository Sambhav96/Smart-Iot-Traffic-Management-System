import { SimulationState, AnalyticsSnapshot, Mode, Scenario } from "../types/traffic";
import { SimulationLogsResponse, AnalyticsSummaryResponse, HealthResponse } from "../types/api";
import { API_BASE_URL } from "./constants";

/**
 * Core generic fetcher
 */
async function fetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API error ${response.status}: ${errorBody}`);
    }

    return response.json();
  } catch (error) {
    console.error(`Fetch failed for ${url}:`, error);
    throw error;
  }
}

export const SimulationAPI = {
  // Health
  getHealth: () => fetcher<HealthResponse>("/health"),

  // State fetching
  getState: () => fetcher<SimulationState>("/simulation/state"),
  
  // Controls
  start: () => fetcher<{message: string}>("/simulation/start", { method: "POST" }),
  pause: () => fetcher<{message: string}>("/simulation/pause", { method: "POST" }),
  reset: () => fetcher<{message: string}>("/simulation/reset", { method: "POST" }),
  step: () => fetcher<{message: string}>("/simulation/step", { method: "POST" }),
  
  // Settings
  setMode: (mode: Mode) => fetcher<{message: string}>("/simulation/mode", {
    method: "POST",
    body: JSON.stringify({ mode })
  }),
  setScenario: (scenario: Scenario) => fetcher<{message: string}>("/simulation/scenario", {
    method: "POST",
    body: JSON.stringify({ scenario }),
  }),
  requestPedestrianCrossing: (laneId: string) => fetcher<{message: string}>("/simulation/pedestrian/request", {
    method: "POST",
    body: JSON.stringify({ lane_id: laneId }),
  }),
  clearPedestrianCrossing: (laneId: string) => fetcher<{message: string}>("/simulation/pedestrian/clear", {
    method: "POST",
    body: JSON.stringify({ lane_id: laneId }),
  }),

  // Manual lane controls (MANUAL mode only)
  setActiveLane: (laneId: string) => fetcher<{message: string}>("/simulation/lane/active", {
    method: "POST",
    body: JSON.stringify({ lane_id: laneId }),
  }),
  setLaneVehicleCount: (laneId: string, vehicleCount: number) => fetcher<{message: string}>("/simulation/lane/vehicle-count", {
    method: "POST",
    body: JSON.stringify({ lane_id: laneId, vehicle_count: vehicleCount }),
  }),
  setLaneSignal: (laneId: string, signalState: "RED" | "YELLOW" | "GREEN") => fetcher<{message: string}>("/simulation/lane/signal", {
    method: "POST",
    body: JSON.stringify({ lane_id: laneId, signal_state: signalState }),
  }),

  // Emergency priority controls
  activateEmergency: (laneId: string) => fetcher<{message: string}>("/simulation/emergency", {
    method: "POST",
    body: JSON.stringify({ lane_id: laneId }),
  }),
  resolveEmergency: (laneId?: string) => fetcher<{message: string}>("/simulation/emergency/clear", {
    method: "POST",
    body: JSON.stringify({ lane_id: laneId ?? null }),
  }),
  
  // Analytics
  getAnalytics: () => fetcher<AnalyticsSnapshot>("/simulation/analytics"),
  getAnalyticsSummary: () => fetcher<AnalyticsSummaryResponse>("/simulation/analytics/summary"),

  // Logs
  getLogs: () => fetcher<SimulationLogsResponse>("/simulation/logs")
};
