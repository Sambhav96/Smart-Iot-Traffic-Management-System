import { SignalState } from "../../types/traffic";

interface SignalLightProps {
  state: SignalState;
  className?: string;
}

function bulbClass(active: boolean, tone: "red" | "yellow" | "green"): string {
  const base = "w-4 h-4 rounded-full border transition-all duration-200";

  if (!active) {
    return `${base} bg-slate-200 border-slate-300`;
  }

  switch (tone) {
    case "red":
      return `${base} bg-rose-500 border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.75)]`;
    case "yellow":
      return `${base} bg-amber-400 border-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.75)]`;
    case "green":
      return `${base} bg-emerald-500 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.75)]`;
    default:
      return `${base} bg-slate-300 border-slate-200`;
  }
}

export function SignalLight({ state, className = "" }: SignalLightProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-900/95 px-2 py-1 ${className}`}
      aria-label={`Signal state ${state}`}
      title={`Signal: ${state}`}
    >
      <span className={bulbClass(state === "RED", "red")} />
      <span className={bulbClass(state === "YELLOW", "yellow")} />
      <span className={bulbClass(state === "GREEN", "green")} />
    </div>
  );
}
