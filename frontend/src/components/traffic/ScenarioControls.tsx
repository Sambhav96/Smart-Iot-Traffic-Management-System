import { useMemo, useState } from "react";
import { Lane, Scenario } from "../../types/traffic";

interface ScenarioControlsProps {
  scenario?: Scenario;
  lanes: Lane[];
  loading?: boolean;
  onSetScenario: (scenario: Scenario) => Promise<void>;
  onRequestPedestrian: (laneId: string) => Promise<void>;
  onClearPedestrian: (laneId: string) => Promise<void>;
}

const scenarioDescriptions: Record<Scenario, string> = {
  DAY: "Moderate to high traffic variation",
  NIGHT: "Lower traffic volume with faster lane switching",
  RAIN: "Slower vehicle clearing with higher congestion tendency",
};

export function ScenarioControls({
  scenario = "DAY",
  lanes,
  loading = false,
  onSetScenario,
  onRequestPedestrian,
  onClearPedestrian,
}: ScenarioControlsProps) {
  const [selectedLaneId, setSelectedLaneId] = useState<string>("");
  const [pendingAction, setPendingAction] = useState<"scenario" | "request" | "clear" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeSelectedLaneId = selectedLaneId || lanes[0]?.id || "";

  const requestedCount = useMemo(() => lanes.filter((lane) => lane.pedestrian_request).length, [lanes]);

  async function runAction(
    action: "scenario" | "request" | "clear",
    successMessage: string,
    fn: () => Promise<void>,
  ) {
    setPendingAction(action);
    setMessage(null);
    setError(null);
    try {
      await fn();
      setMessage(successMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scenario action failed");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Scenario & Pedestrian Controls</h2>
          <p className="text-sm text-slate-500">Scenario behavior and crossing requests are applied from backend simulation logic.</p>
        </div>
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
          Pending Pedestrian Requests: {requestedCount}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600" htmlFor="scenario-select">Scenario</label>
          <div className="flex flex-wrap gap-2" id="scenario-select">
            {(["DAY", "NIGHT", "RAIN"] as Scenario[]).map((option) => (
              <button
                key={option}
                onClick={() => runAction("scenario", `Scenario set to ${option}`, async () => {
                  await onSetScenario(option);
                })}
                disabled={loading || pendingAction !== null || scenario === option}
                className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors border ${scenario === option ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {option}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500">{scenarioDescriptions[scenario]}</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600" htmlFor="pedestrian-lane-select">Pedestrian Lane</label>
          <select
            id="pedestrian-lane-select"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            value={activeSelectedLaneId}
            onChange={(event) => setSelectedLaneId(event.target.value)}
            disabled={loading || lanes.length === 0 || pendingAction !== null}
          >
            {lanes.map((lane) => (
              <option key={lane.id} value={lane.id}>{lane.name}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => runAction("request", "Pedestrian crossing requested", async () => {
                if (!activeSelectedLaneId) throw new Error("Select a lane first");
                await onRequestPedestrian(activeSelectedLaneId);
              })}
              disabled={loading || !activeSelectedLaneId || pendingAction !== null}
              className="px-3 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pendingAction === "request" ? "Requesting..." : "Request Crossing"}
            </button>
            <button
              onClick={() => runAction("clear", "Pedestrian request cleared", async () => {
                if (!activeSelectedLaneId) throw new Error("Select a lane first");
                await onClearPedestrian(activeSelectedLaneId);
              })}
              disabled={loading || !activeSelectedLaneId || pendingAction !== null}
              className="px-3 py-2 rounded-xl text-sm font-semibold bg-slate-700 hover:bg-slate-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pendingAction === "clear" ? "Clearing..." : "Clear Request"}
            </button>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</p>}
      {!error && message && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{message}</p>}
    </section>
  );
}
