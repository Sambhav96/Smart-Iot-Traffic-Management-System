"use client";

import { useMemo, useState } from "react";
import { useTraffic } from "../../hooks/useSimulation";
import { AlertSeverity, EventType } from "../../types/traffic";
import { formatTimestamp, getSeverityColorClass } from "../../lib/helpers";

type SeverityFilter = AlertSeverity | "ALL";
type EventTypeFilter = EventType | "ALL";

const ALERT_SEVERITY_OPTIONS: SeverityFilter[] = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"];
const EVENT_TYPE_OPTIONS: EventTypeFilter[] = [
  "ALL",
  "SCENARIO_CHANGE",
  "EMERGENCY_VEHICLE",
  "CONGESTION_ALERT",
  "SIGNAL_CHANGE",
  "MODE_CHANGE",
  "PEDESTRIAN_REQUEST",
  "SYSTEM_ERROR",
];

export default function LogsPage() {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("ALL");
  const [eventTypeFilter, setEventTypeFilter] = useState<EventTypeFilter>("ALL");

  const { logs, loading, error, retry } = useTraffic({
    intervalMs: 1000,
    includeState: false,
    includeLogs: true,
    includeAnalytics: false,
  });

  const filteredEvents = useMemo(() => {
    const events = logs?.recent_events ?? [];
    const sorted = [...events].sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    if (eventTypeFilter === "ALL") {
      return sorted;
    }

    return sorted.filter((event) => event.type === eventTypeFilter);
  }, [logs, eventTypeFilter]);

  const filteredAlerts = useMemo(() => {
    const alerts = logs?.active_alerts ?? [];
    const sorted = [...alerts].sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return sorted.filter((alert) => {
      const severityOk = severityFilter === "ALL" || alert.severity === severityFilter;
      const eventTypeOk = eventTypeFilter === "ALL" || alert.type === eventTypeFilter;
      return severityOk && eventTypeOk;
    });
  }, [logs, severityFilter, eventTypeFilter]);

  return (
    <main className="space-y-6 animate-in fade-in duration-300">
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Simulation Logs & Alerts</h1>
        <p className="text-sm sm:text-base text-slate-300">
          Live operational history and active alerts for demo monitoring and incident review.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center justify-between gap-3">
          <span>Live update warning: {error}</span>
          <button
            onClick={retry}
            className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-slate-800 mb-3">Filters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600" htmlFor="severity-filter">Alert Severity</label>
            <select
              id="severity-filter"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              value={severityFilter}
              onChange={(event) => setSeverityFilter(event.target.value as SeverityFilter)}
            >
              {ALERT_SEVERITY_OPTIONS.map((severity) => (
                <option key={severity} value={severity}>{severity}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600" htmlFor="event-type-filter">Event Type</label>
            <select
              id="event-type-filter"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              value={eventTypeFilter}
              onChange={(event) => setEventTypeFilter(event.target.value as EventTypeFilter)}
            >
              {EVENT_TYPE_OPTIONS.map((eventType) => (
                <option key={eventType} value={eventType}>{eventType}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-800">Event Logs</h2>
            <span className="text-xs font-semibold text-slate-500">{filteredEvents.length} items</span>
          </div>

          <div className="mt-3 space-y-2 max-h-[560px] overflow-auto">
            {loading && filteredEvents.length === 0 ? (
              <p className="text-sm text-slate-500">Loading events...</p>
            ) : filteredEvents.length === 0 ? (
              <p className="text-sm text-slate-500">No events match current filters.</p>
            ) : (
              filteredEvents.map((event, index) => (
                <div key={`${event.timestamp}-${index}`} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-500">{formatTimestamp(event.timestamp)}</p>
                    <span className="inline-flex rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700">
                      {event.type}
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 mt-1">{event.description}</p>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-800">Active Alerts</h2>
            <span className="text-xs font-semibold text-slate-500">{filteredAlerts.length} items</span>
          </div>

          <div className="mt-3 space-y-2 max-h-[560px] overflow-auto">
            {loading && filteredAlerts.length === 0 ? (
              <p className="text-sm text-slate-500">Loading alerts...</p>
            ) : filteredAlerts.length === 0 ? (
              <p className="text-sm text-slate-500">No alerts match current filters.</p>
            ) : (
              filteredAlerts.map((alert, index) => (
                <div key={`${alert.timestamp}-${index}`} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${getSeverityColorClass(alert.severity)}`}>
                      {alert.severity}
                    </span>
                    <span className="text-xs text-slate-500">{formatTimestamp(alert.timestamp)}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{alert.type}</p>
                  <p className="text-sm text-slate-800 mt-1">{alert.message}</p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
