import React from "react";

export interface SummaryCardProps {
  title: string;
  value?: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  emptyLabel?: string;
}

export function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  loading = false,
  error = null,
  isEmpty = false,
  emptyLabel = "No data",
}: SummaryCardProps) {
  const displayValue = value ?? "--";

  return (
    <div className="bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-700 flex flex-col justify-between hover:shadow-md transition-shadow h-full">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-slate-400 font-medium text-sm">{title}</h3>
        {icon && <div className="text-slate-500">{icon}</div>}
      </div>

      {loading ? (
        <div className="animate-pulse flex flex-col gap-2">
          <div className="h-8 bg-slate-700 rounded w-1/2"></div>
          {subtitle && <div className="h-4 bg-slate-800 rounded w-1/3 mt-1"></div>}
        </div>
      ) : error ? (
        <div>
          <p className="text-sm font-semibold text-rose-300">Unavailable</p>
          <p className="text-xs text-rose-400 mt-1 line-clamp-2">{error}</p>
        </div>
      ) : isEmpty ? (
        <div>
          <p className="text-2xl font-semibold text-slate-500">--</p>
          <p className="text-sm text-slate-400 mt-1">{emptyLabel}</p>
        </div>
      ) : (
        <div>
          <p className="text-3xl font-bold text-slate-100">{displayValue}</p>
          {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
        </div>
      )}
    </div>
  );
}
