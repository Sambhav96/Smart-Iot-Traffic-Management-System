export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const MODES = {
  MANUAL: "MANUAL",
  ADAPTIVE: "ADAPTIVE",
  TIMED: "TIMED"
} as const;

export const SIGNAL_STATES = {
  RED: "RED",
  GREEN: "GREEN",
  YELLOW: "YELLOW"
} as const;

export const SIMULATION_STATUS = {
  RUNNING: "RUNNING",
  PAUSED: "PAUSED",
  STOPPED: "STOPPED"
} as const;
