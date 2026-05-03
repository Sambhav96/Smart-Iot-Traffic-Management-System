import { useCallback, useEffect, useRef, useState } from "react";
import { SimulationAPI } from "../lib/api";
import { SimulationLogsResponse } from "../types/api";
import { AnalyticsSnapshot, SimulationState } from "../types/traffic";

export interface UseTrafficOptions {
  intervalMs?: number;
  enabled?: boolean;
  immediate?: boolean;
  includeState?: boolean;
  includeLogs?: boolean;
  includeAnalytics?: boolean;
}

export interface UseTrafficResult {
  state: SimulationState | null;
  logs: SimulationLogsResponse | null;
  analytics: AnalyticsSnapshot | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  retry: () => Promise<void>;
}

const DEFAULT_INTERVAL_MS = 2000;

/** @alias for useSimulation - kept for backward compatibility with pages that import useTraffic */
export function useTraffic(options: UseTrafficOptions = {}): UseTrafficResult {
  return useSimulation(options);
}

export function useSimulation(options: UseTrafficOptions = {}): UseTrafficResult {
  const {
    intervalMs = DEFAULT_INTERVAL_MS,
    enabled = true,
    immediate = true,
    includeState = true,
    includeLogs = true,
    includeAnalytics = true,
  } = options;

  const [state, setState] = useState<SimulationState | null>(null);
  const [logs, setLogs] = useState<SimulationLogsResponse | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(immediate && enabled);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef<boolean>(true);
  const inFlightRef = useRef<boolean>(false);
  // Mirrors `state` in a ref so polling callbacks can read it without stale closures.
  const stateRef = useRef<SimulationState | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchTraffic = useCallback(async (background = false) => {
    if (!enabled || inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;

    if (!background && mountedRef.current) {
      setLoading(true);
    }

    // Auto-advance the simulation when it is RUNNING so live data flows.
    // Uses the locally cached state ref to avoid an extra network call.
    if (background && stateRef.current?.intersection.simulation_status === "RUNNING") {
      await SimulationAPI.step().catch(() => null);
    }

    const tasks: Array<Promise<unknown>> = [];
    const taskKeys: Array<"state" | "logs" | "analytics"> = [];

    if (includeState) {
      tasks.push(SimulationAPI.getState());
      taskKeys.push("state");
    }

    if (includeLogs) {
      tasks.push(SimulationAPI.getLogs());
      taskKeys.push("logs");
    }

    if (includeAnalytics) {
      tasks.push(SimulationAPI.getAnalytics());
      taskKeys.push("analytics");
    }

    if (tasks.length === 0) {
      if (mountedRef.current) {
        setError(null);
        setLoading(false);
      }
      inFlightRef.current = false;
      return;
    }

    const result = await Promise.allSettled(tasks);

    if (!mountedRef.current) {
      inFlightRef.current = false;
      return;
    }

    const errors: string[] = [];

    result.forEach((entry, index) => {
      const key = taskKeys[index];

      if (entry.status === "rejected") {
        errors.push(`${key} endpoint unavailable`);
        return;
      }

      if (key === "state") {
        const newState = entry.value as SimulationState;
        stateRef.current = newState;
        setState(newState);
      } else if (key === "logs") {
        setLogs(entry.value as SimulationLogsResponse);
      } else if (key === "analytics") {
        setAnalytics(entry.value as AnalyticsSnapshot);
      }
    });

    setError(errors.length > 0 ? errors.join(". ") : null);
    setLoading(false);
    inFlightRef.current = false;
  }, [enabled, includeState, includeLogs, includeAnalytics]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (immediate) {
      fetchTraffic(false);
    }

    const intervalId = window.setInterval(() => {
      fetchTraffic(true);
    }, intervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [enabled, immediate, intervalMs, fetchTraffic]);

  const refresh = useCallback(async () => {
    await fetchTraffic(false);
  }, [fetchTraffic]);

  return {
    state,
    logs,
    analytics,
    loading,
    error,
    refresh,
    retry: refresh,
  };
}
