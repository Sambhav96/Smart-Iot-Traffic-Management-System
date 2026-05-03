import { useMemo, useState } from "react";
import { Mode, SimulationStatus } from "../../types/traffic";

interface TrafficControlsProps {
  status?: SimulationStatus | null;
  mode?: Mode | null;
  loading?: boolean;
  onStart: () => Promise<void>;
  onPause: () => Promise<void>;
  onReset: () => Promise<void>;
  onStep: () => Promise<void>;
  onSetMode: (nextMode: Mode) => Promise<void>;
}

export function TrafficControls({
  status,
  mode,
  loading = false,
  onStart,
  onPause,
  onReset,
  onStep,
  onSetMode,
}: TrafficControlsProps) {
  const [pendingAction, setPendingAction] = useState<"start" | "pause" | "reset" | "step" | "mode" | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const currentMode: Mode = mode ?? "TIMED";

  const controlsDisabled = loading || !status;

  const canStart = status !== "RUNNING";
  const canPause = status === "RUNNING";
  const canStep = status !== "RUNNING";

  const modeLabel = useMemo(() => {
    return currentMode === "MANUAL" ? "Switch To ADAPTIVE" : "Switch To MANUAL";
  }, [currentMode]);

  async function runAction(
    action: "start" | "pause" | "reset" | "step" | "mode",
    successMessage: string,
    fn: () => Promise<void>,
  ) {
    setPendingAction(action);
    setActionError(null);
    setFeedback(null);

    try {
      await fn();
      setFeedback(successMessage);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Action failed";
      setActionError(message);
    } finally {
      setPendingAction(null);
    }
  }

  const nextBackendMode: Mode = currentMode === "MANUAL" ? "ADAPTIVE" : "MANUAL";

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-900 p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Simulation Controls</h2>
          <p className="text-sm text-slate-400">Control simulation execution and switch between operating modes.</p>
        </div>
        <span className="inline-flex items-center rounded-full border border-slate-600 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
          Mode: {currentMode}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        <button
          onClick={() => runAction("start", "Simulation started", onStart)}
          disabled={controlsDisabled || !canStart || pendingAction !== null}
          className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {pendingAction === "start" ? "Starting..." : "Start"}
        </button>

        <button
          onClick={() => runAction("pause", "Simulation paused", onPause)}
          disabled={controlsDisabled || !canPause || pendingAction !== null}
          className="px-3 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {pendingAction === "pause" ? "Pausing..." : "Pause"}
        </button>

        <button
          onClick={() => runAction("step", "Simulation advanced by one step", onStep)}
          disabled={controlsDisabled || !canStep || pendingAction !== null}
          className="px-3 py-2 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-800 text-sm font-semibold rounded-xl transition-colors"
        >
          {pendingAction === "step" ? "Stepping..." : "Step"}
        </button>

        <button
          onClick={() => runAction("reset", "Simulation reset", onReset)}
          disabled={controlsDisabled || pendingAction !== null}
          className="px-3 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {pendingAction === "reset" ? "Resetting..." : "Reset"}
        </button>

        <button
          onClick={() => runAction("mode", `Mode changed to ${nextBackendMode}`, async () => onSetMode(nextBackendMode))}
          disabled={controlsDisabled || pendingAction !== null}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {pendingAction === "mode" ? "Switching..." : modeLabel}
        </button>
      </div>

      {actionError && (
        <p className="text-sm text-rose-300 bg-rose-950 border border-rose-800 rounded-lg px-3 py-2">{actionError}</p>
      )}
      {!actionError && feedback && (
        <p className="text-sm text-emerald-300 bg-emerald-950 border border-emerald-800 rounded-lg px-3 py-2">{feedback}</p>
      )}
    </section>
  );
}
