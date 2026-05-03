import { Lane } from "../../types/traffic";
import { formatSeconds, getCongestionDisplay } from "../../lib/helpers";
import { SignalLight } from "./SignalLight";

export type Direction = "North" | "South" | "East" | "West";

interface LaneCardProps {
  direction: Direction;
  lane?: Lane;
  loading?: boolean;
}

function congestionBadge(level: "Low" | "Medium" | "High"): { className: string } {
  if (level === "High") {
    return { className: "bg-rose-900 text-rose-200 border-rose-700" };
  }

  if (level === "Medium") {
    return { className: "bg-amber-900 text-amber-200 border-amber-700" };
  }

  return { className: "bg-emerald-900 text-emerald-200 border-emerald-700" };
}

export function LaneCard({ direction, lane, loading = false }: LaneCardProps) {
  if (loading) {
    return (
      <article className="rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-sm animate-pulse min-h-[172px]">
        <div className="h-5 w-24 bg-slate-700 rounded mb-3" />
        <div className="h-4 w-32 bg-slate-700 rounded mb-4" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-4 w-full bg-slate-800 rounded" />
          <div className="h-4 w-full bg-slate-800 rounded" />
          <div className="h-4 w-full bg-slate-800 rounded" />
          <div className="h-4 w-full bg-slate-800 rounded" />
        </div>
      </article>
    );
  }

  if (!lane) {
    return (
      <article className="rounded-2xl border border-dashed border-slate-600 bg-slate-900 p-4 shadow-sm min-h-[172px]">
        <h3 className="text-sm font-semibold text-slate-300">{direction} Approach</h3>
        <p className="text-sm text-slate-500 mt-2">No lane data available.</p>
      </article>
    );
  }

  const congestionDisplay = getCongestionDisplay(
    lane.vehicle_count,
    lane.congestion_level,
  );
  const congestion = congestionBadge(congestionDisplay.level);

  return (
    <article className={`rounded-2xl border p-4 shadow-sm min-h-[172px] transition-all ${lane.emergency_flag ? "border-rose-500 bg-rose-950/40 animate-pulse shadow-rose-500/30 shadow-lg" : "border-slate-700 bg-slate-900"}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-300">{direction} Approach</h3>
          <p className="text-base font-bold text-slate-100">{lane.name}</p>
          {lane.emergency_flag && (
            <span className="inline-flex mt-1 rounded-full border border-rose-700 bg-rose-900 px-2 py-0.5 text-xs font-semibold text-rose-200">
              EMERGENCY ACTIVE
            </span>
          )}
        </div>
        <SignalLight state={lane.signal_state} />
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-4 text-sm">
        <p className="text-slate-400">Vehicles</p>
        <p className="font-semibold text-slate-100 text-right">{lane.vehicle_count}</p>

        <p className="text-slate-400">Waiting Time</p>
        <p className="font-semibold text-slate-100 text-right">{formatSeconds(lane.waiting_time)}</p>

        <p className="text-slate-400">Congestion</p>
        <div className="text-right">
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${congestion.className}`}>
            {congestionDisplay.text}
          </span>
        </div>

        <p className="text-slate-400">Emergency</p>
        <p className={`font-semibold text-right ${lane.emergency_flag ? "text-rose-300" : "text-slate-300"}`}>
          {lane.emergency_flag ? "Active" : "None"}
        </p>

        <p className="text-slate-400">Pedestrian Request</p>
        <p className={`font-semibold text-right ${lane.pedestrian_request ? "text-blue-300" : "text-slate-300"}`}>
          {lane.pedestrian_request ? "Pending" : "None"}
        </p>
      </div>
    </article>
  );
}
