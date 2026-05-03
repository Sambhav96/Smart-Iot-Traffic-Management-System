"use client";

import { Lane, Mode, Scenario, SimulationStatus, SignalState } from "../../types/traffic";
import { formatModeLabel } from "../../lib/helpers";
import { Direction, LaneCard } from "./LaneCard";

interface IntersectionViewProps {
  lanes?: Lane[];
  mode?: Mode;
  scenario?: Scenario;
  status?: SimulationStatus;
  activeLaneId?: string | null;
  loading?: boolean;
}

type DirectionalLanes = Record<Direction, Lane | undefined>;
const directions: Direction[] = ["North", "East", "South", "West"];

function inferDirection(lane: Lane): Direction | null {
  const text = `${lane.id} ${lane.name}`.toLowerCase();
  if (text.includes("north")) return "North";
  if (text.includes("south")) return "South";
  if (text.includes("east")) return "East";
  if (text.includes("west")) return "West";
  return null;
}

function mapLanesToDirections(lanes: Lane[] = []): DirectionalLanes {
  const directional: DirectionalLanes = {
    North: undefined, East: undefined, South: undefined, West: undefined,
  };
  const unassigned: Lane[] = [];
  lanes.forEach((lane) => {
    const guessed = inferDirection(lane);
    if (guessed && !directional[guessed]) { directional[guessed] = lane; return; }
    unassigned.push(lane);
  });
  directions.forEach((direction) => {
    if (!directional[direction]) directional[direction] = unassigned.shift();
  });
  return directional;
}

function signalFill(state: SignalState | undefined): { red: string; yellow: string; green: string } {
  const off = "#1e293b";
  switch (state) {
    case "RED":    return { red: "#ef4444", yellow: off, green: off };
    case "YELLOW": return { red: off, yellow: "#eab308", green: off };
    case "GREEN":  return { red: off, yellow: off, green: "#22c55e" };
    default:       return { red: off, yellow: off, green: off };
  }
}

// Rain streak animation keyframes injected once
const RAIN_STYLE = `
@keyframes rainFall {
  0%   { transform: translateY(-40px) translateX(0); opacity: 0.7; }
  100% { transform: translateY(600px) translateX(-120px); opacity: 0.3; }
}
.rain-streak { animation: rainFall linear infinite; }
`;

export function IntersectionView({
  lanes,
  mode,
  scenario,
  status,
  activeLaneId,
  loading = false,
}: IntersectionViewProps) {
  const dlanes = mapLanesToDirections(lanes ?? []);
  const activeLane = (lanes ?? []).find((lane) => lane.id === activeLaneId);

  const W = 700; const H = 700;
  const roadW = 120;         // width of road arm
  const cx = W / 2;          // centre x
  const cy = H / 2;          // centre y
  const boxHalf = roadW / 2; // half road width

  const isNight = scenario === "NIGHT";
  const isRain  = scenario === "RAIN";

  // ─── traffic light helper ───────────────────────────────────────────────
  // tx, ty = housing top-left; vertical = true → R/Y/G stacked top→bottom
  function TrafficLight({
    x, y, signalState, vertical = true,
  }: { x: number; y: number; signalState?: SignalState; vertical?: boolean }) {
    const { red, yellow, green } = signalFill(signalState);
    const dotR = 7;
    const gap = 18;
    const hw = vertical ? 18 : 54;
    const hh = vertical ? 54 : 18;

    const positions = vertical
      ? [
          { cx: x + 9, cy: y + 9,            fill: red    },
          { cx: x + 9, cy: y + 9 + gap,      fill: yellow },
          { cx: x + 9, cy: y + 9 + gap * 2,  fill: green  },
        ]
      : [
          { cx: x + 9,           cy: y + 9, fill: red    },
          { cx: x + 9 + gap,     cy: y + 9, fill: yellow },
          { cx: x + 9 + gap * 2, cy: y + 9, fill: green  },
        ];

    return (
      <g>
        <rect x={x} y={y} width={hw} height={hh} rx={4} fill="#0f172a" stroke="#334155" strokeWidth={1} />
        {positions.map((p, i) => (
          <circle key={i} cx={p.cx} cy={p.cy} r={dotR} fill={p.fill}
            style={p.fill !== "#1e293b" ? { filter: `drop-shadow(0 0 6px ${p.fill})` } : {}} />
        ))}
      </g>
    );
  }

  // ─── lane vehicle cars ────────────────────────────────────────────────────
  function CarIcon({ cx, cy }: { cx: number; cy: number }) {
    return (
      <g>
        {/* Car body */}
        <rect x={cx - 5} y={cy - 3} width={10} height={6} rx={1} fill="#60a5fa" stroke="#1e40af" strokeWidth={0.6} />
        {/* Car cabin/windows */}
        <rect x={cx - 3} y={cy - 2} width={6} height={2.5} rx={0.5} fill="#93c5fd" opacity={0.7} />
        {/* Front wheels */}
        <circle cx={cx - 3.5} cy={cy + 3.5} r={0.8} fill="#334155" />
        <circle cx={cx + 3.5} cy={cy + 3.5} r={0.8} fill="#334155" />
      </g>
    );
  }

  function VehicleDots({ count, x, y }: { count: number; x: number; y: number }) {
    const cars = Math.min(count, 8);
    return (
      <g>
        {Array.from({ length: cars }).map((_, i) => (
          <CarIcon key={i} cx={x + (i % 4) * 14} cy={y + Math.floor(i / 4) * 14} />
        ))}
        {count > 0 && (
          <text x={x + 30} y={y - 2} fill="#93c5fd" fontSize={10} fontWeight="bold" textAnchor="middle">
            {count}
          </text>
        )}
      </g>
    );
  }

  // ─── zebra crossing ──────────────────────────────────────────────────────
  function ZebraCrossing({ x, y, width, height }: { x: number; y: number; width: number; height: number }) {
    const stripes = 5;
    const stripeH = height / (stripes * 2 - 1);
    return (
      <g opacity={0.6}>
        {Array.from({ length: stripes }).map((_, i) => (
          <rect key={i} x={x} y={y + i * stripeH * 2} width={width} height={stripeH} fill="white" />
        ))}
      </g>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 sm:p-6 shadow-sm space-y-4">
      <h2 className="text-base font-bold text-slate-100">Intersection View</h2>

      {/* ── SVG Diagram ──────────────────────────────────────────────── */}
      <div className="w-full overflow-x-auto">
        {isRain && <style>{RAIN_STYLE}</style>}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full max-w-[700px] mx-auto block rounded-xl"
          style={{ background: isNight ? "#0a0e1a" : "#1a2332" }}
        >
          {/* ── Road surface ─────────────────────────────────────────── */}
          {/* N-S road */}
          <rect x={cx - boxHalf} y={0} width={roadW} height={H} fill="#334155" />
          {/* E-W road */}
          <rect x={0} y={cy - boxHalf} width={W} height={roadW} fill="#334155" />
          {/* Intersection box */}
          <rect x={cx - boxHalf} y={cy - boxHalf} width={roadW} height={roadW} fill="#1e293b" />

          {/* ── Dashed centre lines ───────────────────────────────────── */}
          <line x1={cx} y1={0} x2={cx} y2={cy - boxHalf} stroke="#f59e0b" strokeWidth={2} strokeDasharray="12 8" />
          <line x1={cx} y1={cy + boxHalf} x2={cx} y2={H} stroke="#f59e0b" strokeWidth={2} strokeDasharray="12 8" />
          <line x1={0} y1={cy} x2={cx - boxHalf} y2={cy} stroke="#f59e0b" strokeWidth={2} strokeDasharray="12 8" />
          <line x1={cx + boxHalf} y1={cy} x2={W} y2={cy} stroke="#f59e0b" strokeWidth={2} strokeDasharray="12 8" />

          {/* ── Stop lines ────────────────────────────────────────────── */}
          <line x1={cx - boxHalf} y1={cy - boxHalf - 2} x2={cx + boxHalf} y2={cy - boxHalf - 2} stroke="white" strokeWidth={3} />
          <line x1={cx - boxHalf} y1={cy + boxHalf + 2} x2={cx + boxHalf} y2={cy + boxHalf + 2} stroke="white" strokeWidth={3} />
          <line x1={cx - boxHalf - 2} y1={cy - boxHalf} x2={cx - boxHalf - 2} y2={cy + boxHalf} stroke="white" strokeWidth={3} />
          <line x1={cx + boxHalf + 2} y1={cy - boxHalf} x2={cx + boxHalf + 2} y2={cy + boxHalf} stroke="white" strokeWidth={3} />

          {/* ── Zebra crossings ──────────────────────────────────────── */}
          {/* North */}
          <ZebraCrossing x={cx - boxHalf} y={cy - boxHalf - 28} width={roadW} height={22} />
          {/* South */}
          <ZebraCrossing x={cx - boxHalf} y={cy + boxHalf + 6} width={roadW} height={22} />
          {/* West */}
          <ZebraCrossing x={cx - boxHalf - 28} y={cy - boxHalf} width={22} height={roadW} />
          {/* East */}
          <ZebraCrossing x={cx + boxHalf + 6} y={cy - boxHalf} width={22} height={roadW} />

          {/* ── Directional arrows ───────────────────────────────────── */}
          {/* North (going up) */}
          <text x={cx - 22} y={cy - boxHalf - 50} fill="#94a3b8" fontSize={20} textAnchor="middle">↑</text>
          {/* South (going down) */}
          <text x={cx + 22} y={cy + boxHalf + 70} fill="#94a3b8" fontSize={20} textAnchor="middle">↓</text>
          {/* West (going left) */}
          <text x={cx - boxHalf - 55} y={cy + 26} fill="#94a3b8" fontSize={20} textAnchor="middle">←</text>
          {/* East (going right) */}
          <text x={cx + boxHalf + 55} y={cy - 10} fill="#94a3b8" fontSize={20} textAnchor="middle">→</text>

          {/* ── Direction labels ─────────────────────────────────────── */}
          <text x={cx} y={18} fill="#cbd5e1" fontSize={12} fontWeight="bold" textAnchor="middle">NORTH</text>
          <text x={cx} y={H - 6} fill="#cbd5e1" fontSize={12} fontWeight="bold" textAnchor="middle">SOUTH</text>
          <text x={14} y={cy + 4} fill="#cbd5e1" fontSize={12} fontWeight="bold" textAnchor="middle" transform={`rotate(-90,14,${cy})`}>WEST</text>
          <text x={W - 14} y={cy + 4} fill="#cbd5e1" fontSize={12} fontWeight="bold" textAnchor="middle" transform={`rotate(90,${W - 14},${cy})`}>EAST</text>

          {/* ── Traffic lights ────────────────────────────────────────── */}
          {/* North – above stop line, left side of road */}
          <TrafficLight x={cx - boxHalf - 22} y={cy - boxHalf - 60} signalState={dlanes.North?.signal_state} />
          {/* South – below stop line, right side of road */}
          <TrafficLight x={cx + 4} y={cy + boxHalf + 32} signalState={dlanes.South?.signal_state} />
          {/* West – left of stop line, above centre */}
          <TrafficLight x={cx - boxHalf - 60} y={cy - 9} signalState={dlanes.West?.signal_state} vertical={false} />
          {/* East – right of stop line, below centre */}
          <TrafficLight x={cx + boxHalf + 4} y={cy - 9} signalState={dlanes.East?.signal_state} vertical={false} />

          {/* ── Vehicle dots ─────────────────────────────────────────── */}
          {/* North arm */}
          <VehicleDots count={dlanes.North?.vehicle_count ?? 0} x={cx - 42} y={80} />
          {/* South arm */}
          <VehicleDots count={dlanes.South?.vehicle_count ?? 0} x={cx + 8} y={H - 100} />
          {/* West arm */}
          <VehicleDots count={dlanes.West?.vehicle_count ?? 0} x={36} y={cy - 10} />
          {/* East arm */}
          <VehicleDots count={dlanes.East?.vehicle_count ?? 0} x={W - 90} y={cy - 10} />

          {/* ── Pedestrian icons (when request active) ──────────────── */}
          {dlanes.North?.pedestrian_request && (
            <text x={cx + boxHalf + 2} y={cy - boxHalf - 10} fontSize={18} textAnchor="start">🚶</text>
          )}
          {dlanes.South?.pedestrian_request && (
            <text x={cx - boxHalf - 20} y={cy + boxHalf + 22} fontSize={18} textAnchor="start">🚶</text>
          )}
          {dlanes.West?.pedestrian_request && (
            <text x={cx - boxHalf - 22} y={cy - boxHalf - 4} fontSize={18} textAnchor="start">🚶</text>
          )}
          {dlanes.East?.pedestrian_request && (
            <text x={cx + boxHalf + 4} y={cy + boxHalf + 22} fontSize={18} textAnchor="start">🚶</text>
          )}

          {/* ── Emergency ambulance icons ─────────────────────────────── */}
          {dlanes.North?.emergency_flag && (
            <text x={cx - boxHalf + 4} y={cy - boxHalf - 36} fontSize={18}>🚨</text>
          )}
          {dlanes.South?.emergency_flag && (
            <text x={cx + 4} y={cy + boxHalf + 54} fontSize={18}>🚨</text>
          )}
          {dlanes.West?.emergency_flag && (
            <text x={cx - boxHalf - 52} y={cy - boxHalf + 22} fontSize={18}>🚨</text>
          )}
          {dlanes.East?.emergency_flag && (
            <text x={cx + boxHalf + 28} y={cy + boxHalf - 10} fontSize={18}>🚨</text>
          )}

          {/* ── Centre info box ────────────────────────────────────────── */}
          <rect x={cx - 48} y={cy - 26} width={96} height={52} rx={6} fill="#0f172a" stroke="#475569" strokeWidth={1} opacity={0.9} />
          <text x={cx} y={cy - 8} fill="#e2e8f0" fontSize={9} fontWeight="bold" textAnchor="middle">
            {formatModeLabel(mode)}
          </text>
          <text x={cx} y={cy + 4} fill="#94a3b8" fontSize={8} textAnchor="middle">
            {status ?? "STOPPED"}
          </text>
          <text x={cx} y={cy + 17} fill="#64748b" fontSize={8} textAnchor="middle">
            Active: {activeLane?.name ?? "None"}
          </text>

          {/* ── NIGHT overlay ─────────────────────────────────────────── */}
          {isNight && (
            <>
              <rect x={0} y={0} width={W} height={H} fill="#00010f" opacity={0.55} />
              <text x={W - 16} y={28} fontSize={22} textAnchor="end">🌙</text>
              {/* Stars */}
              {[
                [40, 30], [120, 55], [200, 20], [430, 40], [510, 15],
                [80, 490], [160, 520], [490, 480], [540, 530],
              ].map(([sx, sy], i) => (
                <circle key={i} cx={sx} cy={sy} r={1.5} fill="white" opacity={0.6} />
              ))}
            </>
          )}

          {/* ── RAIN overlay ──────────────────────────────────────────── */}
          {isRain && (
            <>
              <rect x={0} y={0} width={W} height={H} fill="#0369a1" opacity={0.18} />
              <text x={W - 16} y={28} fontSize={22} textAnchor="end">🌧️</text>
              {/* Animated rain streaks */}
              {Array.from({ length: 30 }).map((_, i) => {
                const startX = (i * 23) % W;
                const delay = `${(i * 0.17).toFixed(2)}s`;
                const duration = `${0.6 + (i % 5) * 0.1}s`;
                return (
                  <line
                    key={i}
                    className="rain-streak"
                    x1={startX} y1={0}
                    x2={startX - 25} y2={60}
                    stroke="#7dd3fc" strokeWidth={1.2} opacity={0.55}
                    style={{ animationDuration: duration, animationDelay: delay }}
                  />
                );
              })}
            </>
          )}
        </svg>
      </div>

      {/* ── Lane Cards below SVG ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-2">
        {directions.map((dir) => (
          <LaneCard key={dir} direction={dir} lane={dlanes[dir]} loading={loading} />
        ))}
      </div>
    </section>
  );
}
