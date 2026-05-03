import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LaneCongestionSummary } from "../../types/api";

interface TrafficChartProps {
  data: LaneCongestionSummary[];
}

export function TrafficChart({ data }: TrafficChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 20, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="lane_name" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value, name) => {
              const numericValue = typeof value === "number" ? value : Number(value ?? 0);
              if (name?.toString().toLowerCase().includes("waiting")) {
                return `${numericValue.toFixed(1)} s`;
              }
              return Math.round(numericValue);
            }}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="vehicle_count" name="Vehicle Count" fill="#2563eb" radius={[4, 4, 0, 0]} />
          <Bar yAxisId="right" dataKey="waiting_time" name="Waiting Time (s)" fill="#0f766e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
