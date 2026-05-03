import { SimulationStatus, Mode } from "../../types/traffic";
import { formatModeLabel, getStatusBadgeClass } from "../../lib/helpers";

interface SystemStatusProps {
  status?: SimulationStatus | null;
  mode?: Mode | null;
  activeLaneName?: string | null;
  loading?: boolean;
  error?: string | null;
}

export function SystemStatus({
  status,
  mode,
  activeLaneName,
  loading,
  error,
}: SystemStatusProps) {
  if (loading) {
    return (
      <div className="bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
         <div className="space-y-3 w-full max-w-[200px]">
           <div className="h-6 bg-slate-700 rounded w-3/4"></div>
           <div className="h-4 bg-slate-700 rounded w-1/2"></div>
         </div>
         <div className="flex items-center gap-2">
            <div className="h-9 w-20 bg-slate-700 rounded-xl"></div>
            <div className="h-9 w-20 bg-slate-700 rounded-xl"></div>
            <div className="h-9 w-20 bg-slate-700 rounded-xl"></div>
         </div>
      </div>
    );
  }

  if (error && !status && !mode) {
    return (
      <div className="bg-rose-950 p-5 rounded-2xl border border-rose-800 flex flex-col gap-2">
        <h2 className="text-lg font-bold text-rose-200">System Status Unavailable</h2>
        <p className="text-sm text-rose-300">{error}</p>
      </div>
    );
  }

  if (!status && !mode) {
    return (
      <div className="bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-700 flex flex-col gap-2">
        <h2 className="text-lg font-bold text-slate-100">System Status</h2>
        <p className="text-sm text-slate-400">No simulation snapshot available.</p>
      </div>
    );
  }

  const badgeClass = getStatusBadgeClass(status || "STOPPED");

  return (
    <div className="bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-700">
      <div>
        <h2 className="text-lg font-bold text-slate-100">System Status</h2>
        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm">
          <span className={`px-2.5 py-0.5 rounded-full font-semibold border ${badgeClass}`}>
            {status || "UNKNOWN"}
          </span>
          <span className="text-slate-400 font-medium">
            Mode: <span className="text-slate-100">{formatModeLabel(mode)}</span>
          </span>
          <span className="text-slate-400 font-medium">
            Active lane: <span className="text-slate-100">{activeLaneName || "None"}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
