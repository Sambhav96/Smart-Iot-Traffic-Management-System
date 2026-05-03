"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTraffic } from "../hooks/useSimulation";
import { SimulationAPI } from "../lib/api";
import { SystemStatus } from "../components/dashboard/SystemStatus";
import { SummaryCard } from "../components/dashboard/SummaryCard";
import { TrafficControls } from "../components/traffic/TrafficControls";
import { IntersectionView } from "../components/traffic/IntersectionView";
import { EmergencyControls } from "../components/traffic/EmergencyControls";
import { ScenarioControls } from "../components/traffic/ScenarioControls";
import { formatModeLabel, formatSeconds, getCongestionDisplay } from "../lib/helpers";
import { Mode, Scenario } from "../types/traffic";

export default function Dashboard() {
  const [actionError, setActionError] = useState<string | null>(null);

  // ── Cumulative alert counters (Bug 2 + Feature 5) ────────────────────
  const cumulativeAlertsRef  = useRef(0);
  const prevAlertCountRef    = useRef(0);
  const congestionAlertsRef  = useRef(0);
  const emergencyAlertsRef   = useRef(0);
  const pedestrianAlertsRef  = useRef(0);
  const waitingAlertsRef     = useRef(0);
  const [alertCounts, setAlertCounts] = useState({
    cumulative: 0, active: 0,
    congestion: 0, emergency: 0, pedestrian: 0, waiting: 0,
  });

  const { state, analytics, loading, error, refresh, retry } = useTraffic({
    intervalMs: 2000,
    includeState: true,
    includeAnalytics: true,
    includeLogs: false,
  });

  // ── Track cumulative alerts from active_alerts ─────────────────────────
  useEffect(() => {
    if (!state) return;
    const active = state.active_alerts;
    const activeCount = active.length;

    // Only increment when we see MORE alerts than before
    if (activeCount > prevAlertCountRef.current) {
      const newAlerts = activeCount - prevAlertCountRef.current;
      cumulativeAlertsRef.current += newAlerts;

      // Categorise each new alert by type
      active.slice(prevAlertCountRef.current).forEach((alert) => {
        const t = alert.type;
        if (t === "CONGESTION_ALERT")      congestionAlertsRef.current++;
        else if (t === "EMERGENCY_VEHICLE") emergencyAlertsRef.current++;
        else if (t === "PEDESTRIAN_REQUEST") pedestrianAlertsRef.current++;
        else                                waitingAlertsRef.current++;
      });
    }
    prevAlertCountRef.current = activeCount;

    setAlertCounts({
      cumulative: cumulativeAlertsRef.current,
      active: activeCount,
      congestion:  congestionAlertsRef.current,
      emergency:   emergencyAlertsRef.current,
      pedestrian:  pedestrianAlertsRef.current,
      waiting:     waitingAlertsRef.current,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.active_alerts]);

  // ── Simulation control handlers ───────────────────────────────────────
  const handleStart = async (): Promise<void> => {
    try { await SimulationAPI.start(); setActionError(null); await refresh(); }
    catch (err) { setActionError(err instanceof Error ? err.message : "Unable to start simulation."); throw err; }
  };
  const handlePause = async (): Promise<void> => {
    try { await SimulationAPI.pause(); setActionError(null); await refresh(); }
    catch (err) { setActionError(err instanceof Error ? err.message : "Unable to pause simulation."); throw err; }
  };
  const handleStep = async (): Promise<void> => {
    try { await SimulationAPI.step(); setActionError(null); await refresh(); }
    catch (err) { setActionError(err instanceof Error ? err.message : "Unable to step simulation."); throw err; }
  };
  const handleReset = async (): Promise<void> => {
    try {
      await SimulationAPI.reset();
      // Reset cumulative counters too
      cumulativeAlertsRef.current = 0;
      prevAlertCountRef.current = 0;
      congestionAlertsRef.current = 0;
      emergencyAlertsRef.current = 0;
      pedestrianAlertsRef.current = 0;
      waitingAlertsRef.current = 0;
      setAlertCounts({ cumulative: 0, active: 0, congestion: 0, emergency: 0, pedestrian: 0, waiting: 0 });
      setActionError(null);
      await refresh();
    } catch (err) { setActionError(err instanceof Error ? err.message : "Unable to reset simulation."); throw err; }
  };
  const handleSetMode = async (nextMode: Mode): Promise<void> => {
    try { await SimulationAPI.setMode(nextMode); setActionError(null); await refresh(); }
    catch (err) { setActionError(err instanceof Error ? err.message : "Unable to switch simulation mode."); throw err; }
  };

  // ── Emergency handlers (Bug 1) ────────────────────────────────────────
  const handleActivateEmergency = async (laneId: string): Promise<void> => {
    await SimulationAPI.activateEmergency(laneId);
    await refresh();
  };
  const handleResolveEmergency = async (laneId?: string): Promise<void> => {
    await SimulationAPI.resolveEmergency(laneId);
    await refresh();
  };

  // ── Scenario / pedestrian handlers (Bug 1) ────────────────────────────
  const handleSetScenario = async (scenario: Scenario): Promise<void> => {
    await SimulationAPI.setScenario(scenario);
    await refresh();
  };
  const handleRequestPedestrian = async (laneId: string): Promise<void> => {
    await SimulationAPI.requestPedestrianCrossing(laneId);
    await refresh();
  };
  const handleClearPedestrian = async (laneId: string): Promise<void> => {
    await SimulationAPI.clearPedestrianCrossing(laneId);
    await refresh();
  };

  // ── Summary computations ─────────────────────────────────────────────
  const summary = useMemo(() => {
    if (!state) {
      return {
        totalVehicles: 0, activeLaneName: "None", emergencyCount: 0,
        emergencyLaneNames: "None", scenario: "--",
        pedestrianRequestCount: 0, peakCongestion: "--",
      };
    }
    const totalVehicles = state.intersection.lanes.reduce((s, l) => s + l.vehicle_count, 0);
    const activeLane = state.intersection.lanes.find((l) => l.id === state.intersection.current_active_lane);
    const mostCongestedLane = state.intersection.lanes.reduce((max, l) =>
      (!max || l.vehicle_count > max.vehicle_count) ? l : max
    , state.intersection.lanes[0]);
    const peakCongestion = mostCongestedLane
      ? `${mostCongestedLane.name}: ${getCongestionDisplay(mostCongestedLane.vehicle_count, mostCongestedLane.congestion_level).text}`
      : "--";
    return {
      totalVehicles,
      activeLaneName: activeLane?.name ?? "None",
      emergencyCount: state.intersection.lanes.filter((l) => l.emergency_flag).length,
      emergencyLaneNames: state.intersection.lanes.filter((l) => l.emergency_flag).map((l) => l.name).join(", ") || "None",
      scenario: state.intersection.scenario,
      pedestrianRequestCount: state.intersection.lanes.filter((l) => l.pedestrian_request).length,
      peakCongestion,
    };
  }, [state]);

  const hasData = Boolean(state || analytics);
  const effectiveError = actionError || error;
  const initialLoading = loading && !hasData;
  const isEmpty = !loading && !hasData;

  if (effectiveError && !hasData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-slate-950 text-slate-100">
        <div className="p-4 bg-rose-950 border border-rose-800 rounded-xl text-rose-200 max-w-lg text-center">
          <h3 className="font-bold mb-1">Dashboard Connection Error</h3>
          <p className="text-sm">{effectiveError}</p>
        </div>
        <button onClick={retry} className="px-4 py-2 bg-slate-800 text-slate-100 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors">Retry</button>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-slate-950 text-slate-100">
        <div className="p-5 bg-slate-900 border border-slate-700 rounded-xl max-w-lg text-center shadow-sm">
          <h3 className="font-bold mb-1 text-slate-100">No Simulation Data</h3>
          <p className="text-sm text-slate-400">The backend returned no state or analytics snapshot yet.</p>
        </div>
        <button onClick={retry} className="px-4 py-2 bg-slate-800 text-slate-100 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors">Refresh</button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 space-y-6 animate-in fade-in duration-500">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Smart Traffic Dashboard</h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-3xl">
          Real-time traffic simulation with visual intersection view, adaptive signal control, emergency management, and comprehensive IoT monitoring.
        </p>
      </header>

      {effectiveError && hasData && (
        <div className="rounded-xl border border-amber-600 bg-amber-950 px-4 py-3 text-sm text-amber-200">
          Partial update: {effectiveError}
        </div>
      )}

      <SystemStatus
        status={state?.intersection.simulation_status}
        mode={state?.intersection.mode}
        activeLaneName={summary.activeLaneName}
        loading={initialLoading}
        error={effectiveError}
      />

      <IntersectionView
        lanes={state?.intersection.lanes}
        mode={state?.intersection.mode}
        scenario={state?.intersection.scenario}
        status={state?.intersection.simulation_status}
        activeLaneId={state?.intersection.current_active_lane}
        loading={initialLoading}
      />

      <TrafficControls
        status={state?.intersection.simulation_status}
        mode={state?.intersection.mode}
        loading={initialLoading}
        onStart={handleStart}
        onPause={handlePause}
        onReset={handleReset}
        onStep={handleStep}
        onSetMode={handleSetMode}
      />

      {/* ── Summary Cards (Bug 2: cumulative alert shown) ─────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <SummaryCard title="Simulation Status" value={state?.intersection.simulation_status}
          loading={initialLoading} error={!state ? effectiveError : null} isEmpty={!state} emptyLabel="No simulation state" />
        <SummaryCard title="Current Mode" value={formatModeLabel(state?.intersection.mode)}
          loading={initialLoading} error={!state ? effectiveError : null} isEmpty={!state} emptyLabel="No mode available" />
        <SummaryCard title="Current Scenario" value={summary.scenario}
          loading={initialLoading} error={!state ? effectiveError : null} isEmpty={!state} emptyLabel="No scenario available" />
        <SummaryCard title="Active Lane" value={summary.activeLaneName}
          loading={initialLoading} error={!state ? effectiveError : null} isEmpty={!state} emptyLabel="No active lane" />
        <SummaryCard title="Total Vehicle Count" value={summary.totalVehicles} subtitle="Across all lanes"
          loading={initialLoading} error={!state ? effectiveError : null} isEmpty={!state} emptyLabel="No lane data" />
        <SummaryCard
          title="Alert Count"
          value={alertCounts.cumulative}
          subtitle={`${alertCounts.active} currently active`}
          loading={initialLoading}
          error={!state ? effectiveError : null}
          isEmpty={!state}
          emptyLabel="No alerts data"
        />
        <SummaryCard title="Emergency Lanes" value={summary.emergencyCount} subtitle={summary.emergencyLaneNames}
          loading={initialLoading} error={!state ? effectiveError : null} isEmpty={!state} emptyLabel="No emergency data" />
        <SummaryCard
          title="Pedestrian Requests"
          value={summary.pedestrianRequestCount}
          subtitle={summary.pedestrianRequestCount > 0 ? "Crossing requests pending" : "No pending requests"}
          loading={initialLoading}
          error={!state ? effectiveError : null}
          isEmpty={!state}
          emptyLabel="No crossing data"
        />
        <SummaryCard title="Average Waiting Time" value={analytics ? formatSeconds(analytics.average_waiting_time) : "--"}
          loading={initialLoading} error={!analytics ? effectiveError : null} isEmpty={!analytics} emptyLabel="No analytics snapshot" />
        <SummaryCard title="Peak Congestion" value={summary.peakCongestion} subtitle="Vehicle-based classification"
          loading={initialLoading} error={!state ? effectiveError : null} isEmpty={!state} emptyLabel="No congestion data" />
      </section>

      {/* ── Feature 5: Cumulative Alert History Breakdown ─────────────── */}
      <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 sm:p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-100 mb-1">Cumulative Alert History</h2>
        <p className="text-xs text-slate-400 mb-4">Total alerts triggered since simulation started — counters only increase, never reset on tick.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Congestion Alerts",  count: alertCounts.congestion,  color: "from-amber-900 to-amber-800",  badge: "text-amber-300 border-amber-700",  icon: "⚠️" },
            { label: "Emergency Alerts",   count: alertCounts.emergency,   color: "from-rose-900 to-rose-800",    badge: "text-rose-300 border-rose-700",    icon: "🚨" },
            { label: "Pedestrian Alerts",  count: alertCounts.pedestrian,  color: "from-blue-900 to-blue-800",    badge: "text-blue-300 border-blue-700",    icon: "🚶" },
            { label: "Waiting Time Alerts",count: alertCounts.waiting,     color: "from-purple-900 to-purple-800",badge: "text-purple-300 border-purple-700", icon: "⏱️" },
          ].map(({ label, count, color, badge, icon }) => (
            <div key={label} className={`rounded-xl bg-gradient-to-br ${color} border border-slate-700 p-4 flex flex-col gap-2`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{icon}</span>
                <span className="text-xs font-semibold text-slate-300">{label}</span>
              </div>
              <p className={`text-3xl font-bold border rounded-lg px-2 py-0.5 w-fit ${badge}`}>{count}</p>
              <p className="text-xs text-slate-400">total triggered</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bug 1: Emergency Controls on dashboard ────────────────────── */}
      <EmergencyControls
        lanes={state?.intersection.lanes ?? []}
        loading={initialLoading}
        onActivate={handleActivateEmergency}
        onResolve={handleResolveEmergency}
      />

      {/* ── Bug 1: Scenario & Pedestrian Controls on dashboard ────────── */}
      <ScenarioControls
        scenario={state?.intersection.scenario}
        lanes={state?.intersection.lanes ?? []}
        loading={initialLoading}
        onSetScenario={handleSetScenario}
        onRequestPedestrian={handleRequestPedestrian}
        onClearPedestrian={handleClearPedestrian}
      />
    </main>
  );
}
