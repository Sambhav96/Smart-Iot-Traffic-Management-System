import { AlertSeverity, SignalState, SimulationStatus } from "../types/traffic";

export interface CongestionDisplay {
  level: "Low" | "Medium" | "High";
  percent: number;
  text: string;
}

export function getSignalColorClass(state: SignalState): string {
  switch (state) {
    case "GREEN": return "bg-emerald-500 shadow-emerald-500/50 text-white border-emerald-400";
    case "YELLOW": return "bg-amber-400 shadow-amber-400/50 text-black border-amber-300";
    case "RED": return "bg-rose-500 shadow-rose-500/50 text-white border-rose-400";
    default: return "bg-slate-300 text-slate-800 border-slate-200";
  }
}

export function getSeverityColorClass(severity: AlertSeverity): string {
  switch (severity) {
    case "CRITICAL": return "bg-rose-600 border-rose-500 text-white shadow-rose-600/30";
    case "HIGH": return "bg-orange-500 border-orange-400 text-white shadow-orange-500/30";
    case "MEDIUM": return "bg-amber-500 border-amber-400 text-white shadow-amber-500/30";
    case "LOW": return "bg-blue-500 border-blue-400 text-white shadow-blue-500/30";
    default: return "bg-slate-500 border-slate-400 text-white";
  }
}

export function getStatusBadgeClass(status: SimulationStatus): string {
  switch (status) {
    case "RUNNING": return "bg-emerald-900 text-emerald-200 border-emerald-700";
    case "PAUSED": return "bg-amber-900 text-amber-200 border-amber-700";
    case "STOPPED": return "bg-slate-800 text-slate-300 border-slate-600";
    default: return "bg-slate-800 text-slate-300 border-slate-600";
  }
}

export function formatTimestamp(isoString: string): string {
  if (!isoString) return "--:--:--";
  try {
    const normalized = /z$/i.test(isoString) ? isoString : `${isoString}Z`;
    const date = new Date(normalized);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return isoString;
  }
}

export function roundTo(value: number, digits = 1): number {
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
}

export function formatSeconds(value: number, digits = 1): string {
  return `${roundTo(value, digits).toFixed(digits)} s`;
}

export function formatModeLabel(mode?: string | null): string {
  if (!mode) return "UNKNOWN";
  return mode.toUpperCase();
}

export function getCongestionDisplay(vehicleCount: number, congestionLevel: number): CongestionDisplay {
  const percent = Math.max(0, Math.min(100, Math.round(congestionLevel * 100)));

  if (vehicleCount >= 10) {
    return { level: "High", percent, text: `High (${percent}%)` };
  }

  if (vehicleCount >= 5) {
    return { level: "Medium", percent, text: `Medium (${percent}%)` };
  }

  return { level: "Low", percent, text: `Low (${percent}%)` };
}
