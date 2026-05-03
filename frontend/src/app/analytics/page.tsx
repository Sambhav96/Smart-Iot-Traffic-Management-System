"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LineChart, Line, BarChart, Bar,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import { SimulationAPI } from "../../lib/api";
import { AnalyticsSummaryResponse } from "../../types/api";
import { formatSeconds, formatTimestamp, getCongestionDisplay } from "../../lib/helpers";

// Colours per lane direction
const LANE_COLORS: Record<string, string> = {
  north: "#3b82f6",
  south: "#22c55e",
  east:  "#f97316",
  west:  "#a855f7",
};
const MAX_HISTORY = 20;

function laneKey(name: string): string {
  return name.toLowerCase();
}

function getColor(name: string): string {
  for (const key of Object.keys(LANE_COLORS)) {
    if (name.toLowerCase().includes(key)) return LANE_COLORS[key];
  }
  return "#94a3b8";
}

function congestionBarColor(percent: number): string {
  if (percent >= 80) return "#ef4444";
  if (percent >= 50) return "#f97316";
  return "#22c55e";
}

interface HistoryPoint {
  tick: number;
  [laneName: string]: number;
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Accumulated history across polls — never resets
  const historyRef = useRef<HistoryPoint[]>([]);
  const tickRef    = useRef(0);
  const [history, setHistory] = useState<HistoryPoint[]>([]);

  const fetchAnalytics = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    try {
      const response = await SimulationAPI.getAnalyticsSummary();
      setSummary(response);
      setError(null);

      // Build a history point with congestion % per lane
      tickRef.current += 1;
      const point: HistoryPoint = { tick: tickRef.current };
      response.lane_congestion_summaries.forEach((lane) => {
        point[laneKey(lane.lane_name)] = Math.round(lane.congestion_percent);
      });
      historyRef.current = [...historyRef.current, point].slice(-MAX_HISTORY);
      setHistory([...historyRef.current]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to fetch analytics summary");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(true);
    const id = window.setInterval(() => fetchAnalytics(true), 2000);
    return () => window.clearInterval(id);
  }, [fetchAnalytics]);

  const laneSummaries = useMemo(() => summary?.lane_congestion_summaries ?? [], [summary]);
  const hasData = Boolean(summary && laneSummaries.length > 0);

  // Detect lane names from history for LineChart keys
  const laneNames = useMemo(() => {
    const names = new Set<string>();
    historyRef.current.forEach((p) => {
      Object.keys(p).filter((k) => k !== "tick").forEach((k) => names.add(k));
    });
    return Array.from(names);
  }, [history]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error && !summary) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center p-4 bg-slate-950">
        <section className="max-w-xl w-full rounded-2xl border border-rose-800 bg-rose-950 p-6 text-center">
          <h1 className="text-xl font-bold text-rose-300">Analytics Unavailable</h1>
          <p className="text-sm text-rose-400 mt-2">{error}</p>
          <button onClick={() => fetchAnalytics(false)}
            className="mt-4 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 transition-colors">
            Retry
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="space-y-6 animate-in fade-in duration-300 bg-slate-950 min-h-screen text-slate-100">
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Simulation Analytics</h1>
        <p className="text-sm sm:text-base text-slate-400">
          Live metrics and lane-level trend summaries. Line chart accumulates up to {MAX_HISTORY} data points across polls.
        </p>
      </header>

      {error && summary && (
        <div className="rounded-xl border border-amber-700 bg-amber-950 px-4 py-3 text-sm text-amber-300">
          Live update warning: {error}
        </div>
      )}

      {/* ── Headline metric cards ─────────────────────────────────────── */}
      <section className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: "Avg Waiting Time", value: summary ? formatSeconds(summary.average_waiting_time, 2) : "--", accent: "text-blue-400" },
          { label: "Most Congested",   value: summary?.most_congested_lane?.lane_name ?? "--",                 accent: "text-orange-400" },
          { label: "Total Vehicles",   value: summary?.total_vehicles ?? 0,                                    accent: "text-emerald-400" },
          { label: "Total Alerts",     value: summary?.total_alerts ?? 0,                                      accent: "text-rose-400" },
          { label: "Total Events",     value: summary?.total_events ?? 0,                                      accent: "text-purple-400" },
          { label: "Snapshot Time",    value: summary ? formatTimestamp(summary.timestamp) : "--",             accent: "text-slate-300" },
        ].map(({ label, value, accent }) => (
          <div key={label} className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-400">{label}</p>
            <p className={`text-xl font-bold mt-1 ${accent}`}>{String(value)}</p>
          </div>
        ))}
      </section>

      {loading && !summary ? (
        <section className="rounded-2xl border border-slate-700 bg-slate-800/60 p-6 shadow-sm">
          <p className="text-sm text-slate-400">Loading analytics...</p>
        </section>
      ) : !hasData ? (
        <section className="rounded-2xl border border-slate-700 bg-slate-800/60 p-6 shadow-sm text-center">
          <h2 className="text-lg font-bold text-slate-200">No Analytics Data Yet</h2>
          <p className="text-sm text-slate-400 mt-1">Start the simulation to generate lane-level metrics.</p>
        </section>
      ) : (
        <>
          {/* ── LineChart: Congestion % over time ──────────────────── */}
          <section className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4 sm:p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-100">Congestion % Over Time</h2>
            <p className="text-xs text-slate-400 mt-1 mb-4">Live accumulation — last {MAX_HISTORY} snapshots. North=blue, South=green, East=orange, West=purple.</p>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 8, right: 20, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="tick" tick={{ fill: "#94a3b8", fontSize: 11 }} label={{ value: "Poll #", position: "insideBottomRight", offset: -4, fill: "#64748b", fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }} unit="%" />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "1px solid #475569", borderRadius: "8px", color: "#e2e8f0" }}
                    formatter={(v) => [`${v ?? 0}%`, ""]}
                  />
                  <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
                  {laneNames.map((name) => (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      name={name.charAt(0).toUpperCase() + name.slice(1)}
                      stroke={getColor(name)}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* ── BarChart: Current vehicle counts ───────────────────── */}
          <section className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4 sm:p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-100">Current Vehicle Counts by Lane</h2>
            <p className="text-xs text-slate-400 mt-1 mb-4">Live snapshot from latest poll.</p>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={laneSummaries} margin={{ top: 8, right: 20, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="lane_name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "1px solid #475569", borderRadius: "8px", color: "#e2e8f0" }}
                  />
                  <Bar dataKey="vehicle_count" name="Vehicles" radius={[4, 4, 0, 0]}>
                    {laneSummaries.map((lane) => (
                      <Cell key={lane.lane_id} fill={getColor(lane.lane_name)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* ── Summary Table ──────────────────────────────────────── */}
          <section className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4 sm:p-6 shadow-sm overflow-x-auto">
            <h2 className="text-base font-bold text-slate-100 mb-4">Lane Summary Table</h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-700">
                  {["Lane", "Vehicles", "Congestion %", "Waiting Time", "Signal State"].map((h) => (
                    <th key={h} className="py-2 px-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {laneSummaries.map((lane) => {
                  const { level } = getCongestionDisplay(lane.vehicle_count, lane.congestion_level);
                  const isHigh = level === "High";
                  return (
                    <tr key={lane.lane_id}
                      className={`border-b border-slate-800 transition-colors ${isHigh ? "bg-rose-950/50 text-rose-200" : "hover:bg-slate-700/30 text-slate-200"}`}>
                      <td className="py-2 px-3 font-semibold">{lane.lane_name}</td>
                      <td className="py-2 px-3">{lane.vehicle_count}</td>
                      <td className="py-2 px-3">
                        <span style={{ color: congestionBarColor(lane.congestion_percent) }}>
                          {Math.round(lane.congestion_percent)}%
                        </span>
                      </td>
                      <td className="py-2 px-3">{formatSeconds(lane.waiting_time)}</td>
                      <td className="py-2 px-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold border ${
                          isHigh ? "border-rose-700 bg-rose-900 text-rose-200" : "border-slate-600 bg-slate-700 text-slate-200"
                        }`}>
                          {isHigh ? "HIGH" : level.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        </>
      )}
    </main>
  );
}
