"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SimulationAPI } from "../../lib/api";
import { HealthResponse } from "../../types/api";
import { SimulationState } from "../../types/traffic";
import { formatTimestamp, getStatusBadgeClass } from "../../lib/helpers";

const POLLING_OPTIONS = [1000, 2000, 5000] as const;

export default function SettingsPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [state, setState] = useState<SimulationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollingMs, setPollingMs] = useState<number>(2000);

  const fetchSystemData = useCallback(async (background = false) => {
    if (!background) {
      setLoading(true);
    }

    const [healthResult, stateResult] = await Promise.allSettled([
      SimulationAPI.getHealth(),
      SimulationAPI.getState(),
    ]);

    const errors: string[] = [];

    if (healthResult.status === "fulfilled") {
      setHealth(healthResult.value);
    } else {
      errors.push("Health endpoint unavailable");
    }

    if (stateResult.status === "fulfilled") {
      setState(stateResult.value);
    } else {
      errors.push("State endpoint unavailable");
    }

    setError(errors.length > 0 ? errors.join(". ") : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSystemData(true);
    const intervalId = window.setInterval(() => {
      fetchSystemData(true);
    }, pollingMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [fetchSystemData, pollingMs]);

  const statusClass = useMemo(() => {
    return getStatusBadgeClass(state?.intersection.simulation_status ?? "STOPPED");
  }, [state?.intersection.simulation_status]);

  const backendHealthy = health?.status === "ok";

  if (error && !health && !state) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center p-4">
        <section className="max-w-xl w-full rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <h1 className="text-xl font-bold text-rose-800">System Settings Unavailable</h1>
          <p className="text-sm text-rose-700 mt-2">{error}</p>
          <button
            onClick={() => fetchSystemData(false)}
            className="mt-4 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            Retry
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="space-y-6 animate-in fade-in duration-300">
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">System Settings & Health</h1>
        <p className="text-sm sm:text-base text-slate-300">
          Operational overview of backend availability and current simulation runtime settings.
        </p>
      </header>

      {error && (health || state) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Partial update warning: {error}
        </div>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Backend Health</p>
          <p className={`text-2xl font-bold mt-1 ${backendHealthy ? "text-emerald-700" : "text-rose-700"}`}>
            {loading && !health ? "--" : backendHealthy ? "Healthy" : "Unavailable"}
          </p>
          <p className="text-xs text-slate-500 mt-1">{health?.service ?? "Service not reachable"}</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Simulation Status</p>
          <div className="mt-2">
            <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-sm font-semibold ${statusClass}`}>
              {state?.intersection.simulation_status ?? "--"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Live runtime execution state</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Current Mode</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{state?.intersection.mode ?? "--"}</p>
          <p className="text-xs text-slate-500 mt-1">Operational control policy</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Active Scenario</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{state?.intersection.scenario ?? "--"}</p>
          <p className="text-xs text-slate-500 mt-1">Environment profile in effect</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Polling Interval</p>
          <div className="mt-2">
            <select
              value={pollingMs}
              onChange={(event) => setPollingMs(Number(event.target.value))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
            >
              {POLLING_OPTIONS.map((option) => (
                <option key={option} value={option}>{option} ms</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-slate-500 mt-2">Local page refresh setting (demo placeholder)</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Last Backend Check</p>
          <p className="text-lg font-bold text-slate-900 mt-1">
            {health?.timestamp ? formatTimestamp(health.timestamp) : "--"}
          </p>
          <p className="text-xs text-slate-500 mt-1">Health endpoint timestamp</p>
        </article>
      </section>
    </main>
  );
}
