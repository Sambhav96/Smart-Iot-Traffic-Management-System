"use client";

import { useEffect, useRef, useState } from "react";
import { useTraffic } from "../../hooks/useSimulation";

// ── Types ──────────────────────────────────────────────────────────────
interface SensorTelemetry {
  rssi: number;
  battery: number;
}

interface MqttMessage {
  time: string;
  text: string;
}

const LANE_SENSORS = [
  { id: "SENSOR-N-001", label: "Inductive Loop Sensor", lane: "north", topic: "traffic/north/count" },
  { id: "SENSOR-S-002", label: "Inductive Loop Sensor", lane: "south", topic: "traffic/south/count" },
  { id: "SENSOR-E-003", label: "Inductive Loop Sensor", lane: "east",  topic: "traffic/east/count"  },
  { id: "SENSOR-W-004", label: "Inductive Loop Sensor", lane: "west",  topic: "traffic/west/count"  },
];

const CAM_ID   = "CAM-INT-001";
const MAX_MSGS = 15;

function rssiColor(rssi: number): string {
  if (rssi > -60) return "#22c55e";
  if (rssi > -75) return "#eab308";
  return "#ef4444";
}

function battColor(pct: number): string {
  if (pct > 60) return "#22c55e";
  if (pct > 30) return "#eab308";
  return "#ef4444";
}

function randRssi(): number { return -40 - Math.floor(Math.random() * 55); }
function randBatt(): number { return 30 + Math.floor(Math.random() * 70); }

function nowHHMMSS(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

function ProgressBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────
export default function IoTPage() {
  const { state } = useTraffic({
    intervalMs: 2000,
    includeState: true,
    includeLogs: false,
    includeAnalytics: false,
  });

  // Telemetry that randomises every 2s
  const [telemetry, setTelemetry] = useState<Record<string, SensorTelemetry>>(() => {
    const init: Record<string, SensorTelemetry> = {};
    [...LANE_SENSORS.map((s) => s.id), CAM_ID].forEach((id) => {
      init[id] = { rssi: randRssi(), battery: randBatt() };
    });
    return init;
  });

  // MQTT message stream
  const [messages, setMessages] = useState<MqttMessage[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);

  const lanes = state?.intersection.lanes ?? [];

  function getLane(key: string) {
    return lanes.find((l) => l.id.toLowerCase().includes(key) || l.name.toLowerCase().includes(key));
  }

  const activeAlerts = state?.active_alerts.length ?? 0;
  const hasEmergency = lanes.some((l) => l.emergency_flag);
  const hasPedestrian = lanes.some((l) => l.pedestrian_request);

  // Devices Online = all 5 when connected
  const devicesOnline = state ? 5 : 0;

  // ── Telemetry + MQTT refresh every 2s ───────────────────────────────
  useEffect(() => {
    function tick() {
      // Randomise telemetry
      const next: Record<string, SensorTelemetry> = {};
      [...LANE_SENSORS.map((s) => s.id), CAM_ID].forEach((id) => {
        next[id] = { rssi: randRssi(), battery: randBatt() };
      });
      setTelemetry(next);

      // Build MQTT messages
      const time = nowHHMMSS();
      const newMsgs: MqttMessage[] = [];

      LANE_SENSORS.forEach((sensor) => {
        const lane = getLane(sensor.lane);
        const count = lane?.vehicle_count ?? 0;
        const motion = count > 0;
        newMsgs.push({
          time,
          text: `${sensor.id} → ${sensor.topic} | count=${count} motion=${motion}`,
        });
      });

      // Camera heartbeat
      newMsgs.push({
        time,
        text: `${CAM_ID} → traffic/camera/status | monitoring=active alerts=${activeAlerts}`,
      });

      // Emergency message
      if (hasEmergency) {
        const emergLane = lanes.find((l) => l.emergency_flag);
        newMsgs.push({
          time,
          text: `EMERGENCY → traffic/priority/alert | lane=${emergLane?.name ?? "unknown"} priority=CRITICAL`,
        });
      }

      // Pedestrian message
      if (hasPedestrian) {
        const pedLane = lanes.find((l) => l.pedestrian_request);
        newMsgs.push({
          time,
          text: `PEDESTRIAN → traffic/pedestrian/request | lane=${pedLane?.name ?? "unknown"} status=PENDING`,
        });
      }

      setMessages((prev) => [...prev, ...newMsgs].slice(-MAX_MSGS));
    }

    const id = window.setInterval(tick, 2000);
    tick(); // immediate first run
    return () => window.clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, hasEmergency, hasPedestrian, activeAlerts]);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 space-y-6 animate-in fade-in duration-500">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">IoT Sensor Dashboard</h1>
        <p className="text-sm text-slate-400">Real-time telemetry from deployed intersection sensors via MQTT.</p>
      </header>

      {/* ── Protocol Info Bar ─────────────────────────────────────── */}
      <section className="rounded-2xl border border-indigo-700/60 bg-indigo-950/50 px-4 py-3 flex flex-wrap gap-x-6 gap-y-2 items-center">
        {[
          { label: "Protocol",         value: "MQTT v3.1.1" },
          { label: "Broker",           value: "tcp://intersection-hub.local:1883" },
          { label: "QoS Level",        value: "1 (At least once)" },
          { label: "Update Interval",  value: "2000 ms" },
          { label: "Devices Online",   value: `${devicesOnline} / 5` },
          { label: "Network",          value: "802.11n 2.4 GHz" },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-xs font-semibold text-indigo-400">{label}:</span>
            <span className="text-xs font-mono text-indigo-200">{value}</span>
          </div>
        ))}
      </section>

      {/* ── Device Cards ──────────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Lane Sensors */}
        {LANE_SENSORS.map((sensor) => {
          const lane = getLane(sensor.lane);
          const tel  = telemetry[sensor.id] ?? { rssi: -70, battery: 80 };
          const vehicleCount = lane?.vehicle_count ?? 0;
          const motionDetected = vehicleCount > 0;

          return (
            <article key={sensor.id} className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4 shadow-sm space-y-3 hover:border-slate-500 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-mono font-semibold text-slate-400">{sensor.id}</p>
                  <p className="text-sm font-bold text-slate-100 mt-0.5">{sensor.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Lane: {sensor.lane.toUpperCase()}</p>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-emerald-700 bg-emerald-950 text-emerald-400 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ONLINE
                </span>
              </div>

              {/* RSSI */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">RSSI Signal</span>
                  <span style={{ color: rssiColor(tel.rssi) }} className="font-mono font-semibold">{tel.rssi} dBm</span>
                </div>
                <ProgressBar value={tel.rssi + 100} max={60} color={rssiColor(tel.rssi)} />
              </div>

              {/* Battery */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Battery</span>
                  <span style={{ color: battColor(tel.battery) }} className="font-mono font-semibold">{tel.battery}%</span>
                </div>
                <ProgressBar value={tel.battery} color={battColor(tel.battery)} />
              </div>

              {/* Sensor readings */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-700 text-xs">
                <div>
                  <p className="text-slate-400">Vehicle Count</p>
                  <p className="font-bold text-blue-300 text-lg">{vehicleCount}</p>
                </div>
                <div>
                  <p className="text-slate-400">Motion Detected</p>
                  <p className={`font-bold text-lg ${motionDetected ? "text-emerald-400" : "text-slate-500"}`}>
                    {motionDetected ? "TRUE" : "FALSE"}
                  </p>
                </div>
              </div>

              {/* Alerts */}
              {lane?.emergency_flag && (
                <div className="rounded-lg border border-rose-700 bg-rose-950 px-3 py-1.5 text-xs font-semibold text-rose-300 flex items-center gap-2">
                  🚨 EMERGENCY PRIORITY ACTIVE
                </div>
              )}
              {lane?.pedestrian_request && (
                <div className="rounded-lg border border-blue-700 bg-blue-950 px-3 py-1.5 text-xs font-semibold text-blue-300 flex items-center gap-2">
                  🚶 PEDESTRIAN CROSSING REQUESTED
                </div>
              )}
            </article>
          );
        })}

        {/* Intersection Camera */}
        <article className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4 shadow-sm space-y-3 hover:border-slate-500 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-mono font-semibold text-slate-400">{CAM_ID}</p>
              <p className="text-sm font-bold text-slate-100 mt-0.5">Intersection Camera</p>
              <p className="text-xs text-slate-500 mt-0.5">4K Wide-Angle · RTSP Stream</p>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-emerald-700 bg-emerald-950 text-emerald-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">RSSI Signal</span>
              <span style={{ color: rssiColor(telemetry[CAM_ID]?.rssi ?? -60) }} className="font-mono font-semibold">
                {telemetry[CAM_ID]?.rssi ?? -60} dBm
              </span>
            </div>
            <ProgressBar value={(telemetry[CAM_ID]?.rssi ?? -60) + 100} max={60} color={rssiColor(telemetry[CAM_ID]?.rssi ?? -60)} />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Battery</span>
              <span style={{ color: battColor(telemetry[CAM_ID]?.battery ?? 80) }} className="font-mono font-semibold">
                {telemetry[CAM_ID]?.battery ?? 80}%
              </span>
            </div>
            <ProgressBar value={telemetry[CAM_ID]?.battery ?? 80} color={battColor(telemetry[CAM_ID]?.battery ?? 80)} />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-700 text-xs">
            <div>
              <p className="text-slate-400">Monitoring</p>
              <p className="font-bold text-emerald-400 text-sm">ACTIVE ✓</p>
            </div>
            <div>
              <p className="text-slate-400">Active Alerts</p>
              <p className={`font-bold text-lg ${activeAlerts > 0 ? "text-rose-400" : "text-slate-400"}`}>{activeAlerts}</p>
            </div>
          </div>
        </article>
      </section>

      {/* ── MQTT Message Terminal ─────────────────────────────────── */}
      <section className="rounded-2xl border border-emerald-900 bg-black p-4 shadow-sm shadow-emerald-900/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-sm font-semibold text-emerald-400 font-mono">MQTT MESSAGE STREAM</h2>
          </div>
          <span className="text-xs text-emerald-700 font-mono">QoS=1 · broker:1883</span>
        </div>
        <div
          ref={terminalRef}
          className="h-64 overflow-y-auto font-mono text-xs leading-relaxed text-emerald-400 space-y-0.5 pr-1"
          style={{ scrollbarColor: "#065f46 #000" }}
        >
          {messages.length === 0 ? (
            <p className="text-emerald-800">Waiting for messages...</p>
          ) : (
            messages.map((msg, i) => (
              <p key={i} className="whitespace-pre-wrap break-all">
                <span className="text-emerald-700">[{msg.time}] </span>
                <span>{msg.text}</span>
              </p>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
