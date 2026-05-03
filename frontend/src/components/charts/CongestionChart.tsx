import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LaneCongestionSummary } from "../../types/api";
import { getCongestionDisplay } from "../../lib/helpers";

interface CongestionChartProps {
  data: LaneCongestionSummary[];
}

function barColor(percent: number): string {
  if (percent >= 80) return "#dc2626";
  if (percent >= 50) return "#d97706";
  return "#16a34a";
}

export function CongestionChart({ data }: CongestionChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 20, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="lane_name" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
          <Tooltip
            formatter={(value, _name, item) => {
              const payload = item?.payload as LaneCongestionSummary | undefined;
              const numericValue = typeof value === "number" ? value : Number(value ?? 0);
              if (!payload) {
                return `${Math.round(numericValue)}%`;
              }
              return getCongestionDisplay(payload.vehicle_count, payload.congestion_level).text;
            }}
          />
          <Bar dataKey="congestion_percent" name="Congestion (%)" radius={[4, 4, 0, 0]}>
            {data.map((item) => (
              <Cell key={item.lane_id} fill={barColor(item.congestion_percent)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
