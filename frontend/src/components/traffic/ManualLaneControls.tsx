import { useMemo, useState } from "react";
import { Lane, Mode, SignalState } from "../../types/traffic";
import { validateLaneId, validateVehicleCount } from "../../lib/validation";

interface ManualLaneControlsProps {
  mode?: Mode;
  lanes: Lane[];
  loading?: boolean;
  onSetActiveLane: (laneId: string) => Promise<void>;
  onSetVehicleCount: (laneId: string, vehicleCount: number) => Promise<void>;
  onSetLaneSignal: (laneId: string, signalState: SignalState) => Promise<void>;
}

export function ManualLaneControls({
  mode,
  lanes,
  loading = false,
  onSetActiveLane,
  onSetVehicleCount,
  onSetLaneSignal,
}: ManualLaneControlsProps) {
  const [selectedLaneId, setSelectedLaneId] = useState<string>("");
  const [vehicleCountInput, setVehicleCountInput] = useState<string>("0");
  const [signalState, setSignalState] = useState<SignalState>("GREEN");
  const [pendingAction, setPendingAction] = useState<"active" | "vehicle" | "signal" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isManualMode = mode === "MANUAL";

  const activeSelectedLaneId = selectedLaneId || lanes[0]?.id || "";

  const selectedLane = useMemo(() => {
    return lanes.find((lane) => lane.id === activeSelectedLaneId);
  }, [lanes, activeSelectedLaneId]);

  async function runAction(
    action: "active" | "vehicle" | "signal",
    successMessage: string,
    fn: () => Promise<void>,
  ) {
    setPendingAction(action);
    setError(null);
    setMessage(null);
    try {
      await fn();
      setMessage(successMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Manual action failed");
    } finally {
      setPendingAction(null);
    }
  }

  const manualDisabled = loading || !isManualMode || !selectedLane;

  const vehicleCountValidation = validateVehicleCount(vehicleCountInput);
  const laneIdValidation = validateLaneId(activeSelectedLaneId);

  const isVehicleCountValid = vehicleCountValidation.isValid;
  const isLaneValid = laneIdValidation.isValid;

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-900 p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Manual Lane Controls</h2>
          <p className="text-sm text-slate-400">Direct control of lane signals and vehicle counts when in MANUAL mode.</p>
        </div>
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${isManualMode ? "border-emerald-700 bg-emerald-900 text-emerald-200" : "border-slate-600 bg-slate-800 text-slate-300"}`}>
          {isManualMode ? "MANUAL MODE ACTIVE" : "ADAPTIVE/TIMED MODE (LOCKED)"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300" htmlFor="lane-select">Lane</label>
          <select
            id="lane-select"
            className="w-full rounded-lg border border-slate-600 px-3 py-2 text-sm bg-slate-800 text-slate-100"
            value={activeSelectedLaneId}
            onChange={(event) => {
              const nextLaneId = event.target.value;
              setSelectedLaneId(nextLaneId);
              const nextLane = lanes.find((lane) => lane.id === nextLaneId);
              setVehicleCountInput(String(nextLane?.vehicle_count ?? 0));
            }}
            disabled={loading || lanes.length === 0}
          >
            {lanes.map((lane) => (
              <option key={lane.id} value={lane.id}>{lane.name}</option>
            ))}
          </select>
          {!isLaneValid && laneIdValidation.error && (
            <p className="text-xs text-rose-300">{laneIdValidation.error}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300" htmlFor="vehicle-count">Vehicle Count (0-50)</label>
          <input
            id="vehicle-count"
            type="number"
            min={0}
            max={50}
            step={1}
            value={vehicleCountInput}
            onChange={(event) => setVehicleCountInput(event.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm bg-slate-800 text-slate-100 ${!isVehicleCountValid ? 'border-rose-600' : 'border-slate-600'}`}
            disabled={manualDisabled}
          />
          {!isVehicleCountValid && vehicleCountValidation.error && (
            <p className="text-xs text-rose-300">{vehicleCountValidation.error}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300" htmlFor="signal-state">Force Signal State</label>
          <select
            id="signal-state"
            value={signalState}
            onChange={(event) => setSignalState(event.target.value as SignalState)}
            className="w-full rounded-lg border border-slate-600 px-3 py-2 text-sm bg-slate-800 text-slate-100"
            disabled={manualDisabled}
          >
            <option value="GREEN">GREEN</option>
            <option value="YELLOW">YELLOW</option>
            <option value="RED">RED</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          onClick={() => runAction("active", "Active lane updated", async () => {
            if (!selectedLane) {
              throw new Error("Select a lane first");
            }
            await onSetActiveLane(selectedLane.id);
          })}
          disabled={manualDisabled || pendingAction !== null}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {pendingAction === "active" ? "Applying..." : "Set Active Lane"}
        </button>

        <button
          onClick={() => runAction("vehicle", "Vehicle count updated", async () => {
            if (!selectedLane) {
              throw new Error("Select a lane first");
            }
            if (!isVehicleCountValid) {
              throw new Error(vehicleCountValidation.error || "Invalid vehicle count");
            }
            await onSetVehicleCount(selectedLane.id, Number(vehicleCountInput));
          })}
          disabled={manualDisabled || pendingAction !== null || !isVehicleCountValid}
          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {pendingAction === "vehicle" ? "Updating..." : "Update Vehicle Count"}
        </button>

        <button
          onClick={() => runAction("signal", `Signal forced to ${signalState}`, async () => {
            if (!selectedLane) {
              throw new Error("Select a lane first");
            }
            await onSetLaneSignal(selectedLane.id, signalState);
          })}
          disabled={manualDisabled || pendingAction !== null}
          className="px-3 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {pendingAction === "signal" ? "Forcing..." : "Force Signal"}
        </button>
      </div>

      {!isManualMode && (
        <p className="text-sm text-slate-300 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2">
          Switch to MANUAL mode to enable lane-level controls.
        </p>
      )}

      {error && (
        <p className="text-sm text-rose-300 bg-rose-950 border border-rose-800 rounded-lg px-3 py-2">{error}</p>
      )}
      {!error && message && (
        <p className="text-sm text-emerald-300 bg-emerald-950 border border-emerald-800 rounded-lg px-3 py-2">{message}</p>
      )}
    </section>
  );
}
