/**
 * Lightweight input validation utilities for frontend components
 */

export function validateLaneId(laneId: string): { isValid: boolean; error?: string } {
  const validLaneIds = ["north", "south", "east", "west"];

  if (!laneId || typeof laneId !== "string") {
    return { isValid: false, error: "Lane ID is required" };
  }

  if (!validLaneIds.includes(laneId)) {
    return { isValid: false, error: "Invalid lane ID. Must be one of: north, south, east, west" };
  }

  return { isValid: true };
}

export function validateVehicleCount(count: number | string): { isValid: boolean; error?: string } {
  const num = typeof count === "string" ? parseFloat(count) : count;

  if (isNaN(num)) {
    return { isValid: false, error: "Vehicle count must be a valid number" };
  }

  if (!Number.isInteger(num)) {
    return { isValid: false, error: "Vehicle count must be a whole number" };
  }

  if (num < 0 || num > 50) {
    return { isValid: false, error: "Vehicle count must be between 0 and 50" };
  }

  return { isValid: true };
}

export function validateMode(mode: string): { isValid: boolean; error?: string } {
  const validModes = ["TIMED", "ADAPTIVE", "MANUAL"];

  if (!mode || typeof mode !== "string") {
    return { isValid: false, error: "Mode is required" };
  }

  if (!validModes.includes(mode.toUpperCase())) {
    return { isValid: false, error: "Invalid mode. Must be one of: TIMED, ADAPTIVE, MANUAL" };
  }

  return { isValid: true };
}