import { useMemo, useState } from "react";
import { Lane } from "../../types/traffic";

interface EmergencyControlsProps {
  lanes: Lane[];
  loading?: boolean;
  onActivate: (laneId: string) => Promise<void>;
  onResolve: (laneId?: string) => Promise<void>;
}

export function EmergencyControls({
  lanes,
  loading = false,
  onActivate,
  onResolve,
}: EmergencyControlsProps) {
  const [selectedLaneId, setSelectedLaneId] = useState<string>("");
  const [pending, setPending] = useState<"activate" | "resolve-lane" | "resolve-all" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const emergencyLanes = useMemo(() => lanes.filter((lane) => lane.emergency_flag), [lanes]);

  const activeSelectedLaneId = selectedLaneId || lanes[0]?.id || "";

  const disabled = loading || lanes.length === 0;

  async function runAction(
    action: "activate" | "resolve-lane" | "resolve-all",
    successMessage: string,
    fn: () => Promise<void>,
  ) {
    setPending(action);
    setMessage(null);
    setError(null);
    try {
      await fn();
      setMessage(successMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Emergency action failed");
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-rose-900">Emergency Priority Controls</h2>
          <p className="text-sm text-rose-700">Trigger lane priority for emergency vehicles and resolve when cleared.</p>
        </div>
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${emergencyLanes.length > 0 ? "border-rose-300 bg-rose-100 text-rose-800" : "border-slate-200 bg-white text-slate-600"}`}>
          {emergencyLanes.length > 0 ? `${emergencyLanes.length} emergency lane(s)` : "No active emergency"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-semibold text-rose-800" htmlFor="emergency-lane-select">Target Lane</label>
          <select
            id="emergency-lane-select"
            className="w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-slate-900"
            value={activeSelectedLaneId}
            onChange={(event) => setSelectedLaneId(event.target.value)}
            disabled={disabled}
          >
            {lanes.map((lane) => (
              <option key={lane.id} value={lane.id}>{lane.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          onClick={() => runAction("activate", "Emergency priority activated", async () => {
            if (!activeSelectedLaneId) throw new Error("Select a lane first");
            await onActivate(activeSelectedLaneId);
          })}
          disabled={disabled || !activeSelectedLaneId || pending !== null}
          className="px-3 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {pending === "activate" ? "Triggering..." : "Trigger Emergency (Select Lane)"}
        </button>

        <button
          onClick={() => runAction("resolve-lane", "Emergency resolved for lane", async () => {
            if (!activeSelectedLaneId) throw new Error("Select a lane first");
            await onResolve(activeSelectedLaneId);
          })}
          disabled={disabled || !activeSelectedLaneId || pending !== null}
          className="px-3 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {pending === "resolve-lane" ? "Resolving..." : "Resolve Selected"}
        </button>

        <button
          onClick={() => runAction("resolve-all", "All emergency states resolved", async () => {
            await onResolve();
          })}
          disabled={disabled || pending !== null}
          className="px-3 py-2 bg-slate-700 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {pending === "resolve-all" ? "Clearing..." : "Clear Emergency"}
        </button>
      </div>

      {error && <p className="text-sm text-rose-800 bg-white border border-rose-200 rounded-lg px-3 py-2">{error}</p>}
      {!error && message && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{message}</p>}
    </section>
  );
}
