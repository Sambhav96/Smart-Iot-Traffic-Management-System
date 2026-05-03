"use client";

import { useMemo } from "react";
import { IntersectionView } from "../../components/traffic/IntersectionView";
import { useTraffic } from "../../hooks/useSimulation";
import { TrafficControls } from "../../components/traffic/TrafficControls";
import { SimulationAPI } from "../../lib/api";
import { Mode, Scenario, SignalState } from "../../types/traffic";
import { ManualLaneControls } from "../../components/traffic/ManualLaneControls";
import { EmergencyControls } from "../../components/traffic/EmergencyControls";
import { ScenarioControls } from "../../components/traffic/ScenarioControls";
import { formatTimestamp, getSeverityColorClass } from "../../lib/helpers";

export default function TrafficPage() {
  const { state, logs, loading, error, refresh, retry } = useTraffic({
    intervalMs: 2000,
    includeState: true,
    includeLogs: true,
    includeAnalytics: false,
  });

  const handleStart = async (): Promise<void> => {
    await SimulationAPI.start();
    await refresh();
  };

  const handlePause = async (): Promise<void> => {
    await SimulationAPI.pause();
    await refresh();
  };

  const handleReset = async (): Promise<void> => {
    await SimulationAPI.reset();
    await refresh();
  };

  const handleStep = async (): Promise<void> => {
    await SimulationAPI.step();
    await refresh();
  };

  const handleSetMode = async (nextMode: Mode): Promise<void> => {
    await SimulationAPI.setMode(nextMode);
    await refresh();
  };

  const handleSetScenario = async (scenario: Scenario): Promise<void> => {
    await SimulationAPI.setScenario(scenario);
    await refresh();
  };

  const handleSetActiveLane = async (laneId: string): Promise<void> => {
    await SimulationAPI.setActiveLane(laneId);
    await refresh();
  };

  const handleSetVehicleCount = async (laneId: string, vehicleCount: number): Promise<void> => {
    await SimulationAPI.setLaneVehicleCount(laneId, vehicleCount);
    await refresh();
  };

  const handleSetLaneSignal = async (laneId: string, signalState: SignalState): Promise<void> => {
    await SimulationAPI.setLaneSignal(laneId, signalState);
    await refresh();
  };

  const handleActivateEmergency = async (laneId: string): Promise<void> => {
    await SimulationAPI.activateEmergency(laneId);
    await refresh();
  };

  const handleResolveEmergency = async (laneId?: string): Promise<void> => {
    await SimulationAPI.resolveEmergency(laneId);
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

  const hasLaneData = useMemo(() => {
    return Boolean(state?.intersection.lanes && state.intersection.lanes.length > 0);
  }, [state]);

  const emergencyLaneNames = useMemo(() => {
    return (state?.intersection.lanes ?? [])
      .filter((lane) => lane.emergency_flag)
      .map((lane) => lane.name);
  }, [state]);

  const pedestrianLaneNames = useMemo(() => {
    return (state?.intersection.lanes ?? [])
      .filter((lane) => lane.pedestrian_request)
      .map((lane) => lane.name);
  }, [state]);

  if (error && !state) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center p-4">
        <section className="max-w-xl w-full rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <h1 className="text-xl font-bold text-rose-800">Traffic View Unavailable</h1>
          <p className="text-sm text-rose-700 mt-2">{error}</p>
          <button
            onClick={retry}
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
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Live Traffic Intersection</h1>
        <p className="text-sm sm:text-base text-slate-300">
          Operational view of lane conditions, signal lights, and emergency priority state.
        </p>
      </header>

      {error && state && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Live update warning: {error}
        </div>
      )}

      {emergencyLaneNames.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          EMERGENCY ACTIVE on: {emergencyLaneNames.join(", ")}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        Scenario: <span className="font-semibold text-slate-900">{state?.intersection.scenario ?? "--"}</span>
      </div>

      {pedestrianLaneNames.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Pedestrian requests pending on: {pedestrianLaneNames.join(", ")}
        </div>
      )}

      <TrafficControls
        status={state?.intersection.simulation_status}
        mode={state?.intersection.mode}
        loading={loading && !state}
        onStart={handleStart}
        onPause={handlePause}
        onReset={handleReset}
        onStep={handleStep}
        onSetMode={handleSetMode}
      />

      <EmergencyControls
        lanes={state?.intersection.lanes ?? []}
        loading={loading && !state}
        onActivate={handleActivateEmergency}
        onResolve={handleResolveEmergency}
      />

      <ScenarioControls
        scenario={state?.intersection.scenario}
        lanes={state?.intersection.lanes ?? []}
        loading={loading && !state}
        onSetScenario={handleSetScenario}
        onRequestPedestrian={handleRequestPedestrian}
        onClearPedestrian={handleClearPedestrian}
      />

      <ManualLaneControls
        mode={state?.intersection.mode}
        lanes={state?.intersection.lanes ?? []}
        loading={loading && !state}
        onSetActiveLane={handleSetActiveLane}
        onSetVehicleCount={handleSetVehicleCount}
        onSetLaneSignal={handleSetLaneSignal}
      />

      {(!loading && !hasLaneData) ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h2 className="text-lg font-bold text-slate-800">No Lane Data Yet</h2>
          <p className="text-sm text-slate-600 mt-2">Simulation state is available but lane entries are currently empty.</p>
        </section>
      ) : (
        <IntersectionView
          lanes={state?.intersection.lanes}
          mode={state?.intersection.mode}
          scenario={state?.intersection.scenario}
          status={state?.intersection.simulation_status}
          activeLaneId={state?.intersection.current_active_lane}
          loading={loading && !state}
        />
      )}

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-base font-bold text-slate-800">Recent Events</h3>
          <div className="mt-3 space-y-2 max-h-72 overflow-auto">
            {(logs?.recent_events ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">No events yet.</p>
            ) : (
              (logs?.recent_events ?? []).slice(0, 12).map((event, index) => (
                <div key={`${event.timestamp}-${index}`} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="text-xs text-slate-500">{formatTimestamp(event.timestamp)}</p>
                  <p className="text-sm font-semibold text-slate-800">{event.type}</p>
                  <p className="text-sm text-slate-700">{event.description}</p>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-base font-bold text-slate-800">Active Alerts</h3>
          <div className="mt-3 space-y-2 max-h-72 overflow-auto">
            {(logs?.active_alerts ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">No active alerts.</p>
            ) : (
              (logs?.active_alerts ?? []).slice(0, 12).map((alert, index) => (
                <div key={`${alert.timestamp}-${index}`} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${getSeverityColorClass(alert.severity)}`}>
                      {alert.severity}
                    </span>
                    <span className="text-xs text-slate-500">{formatTimestamp(alert.timestamp)}</span>
                  </div>
                  <p className="text-sm text-slate-800 mt-1">{alert.message}</p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
