"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";

type DataPoint = {
  date: string;
  maxWeight: number;
  totalVolume: number;
  sets: number;
};

export function ProgressChart({
  data,
  dataKey,
  label,
  color,
}: {
  data: DataPoint[];
  dataKey: "maxWeight" | "totalVolume";
  label: string;
  color: string;
}) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-muted">
        No data yet
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickFormatter={(val) => format(parseISO(val), "MMM d")}
          />
          <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid #e2e8f0",
            }}
            labelFormatter={(val) => format(parseISO(val as string), "MMM d, yyyy")}
            formatter={(value) => [
              dataKey === "maxWeight" ? `${value} lbs` : Number(value).toLocaleString(),
              label,
            ]}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={{ r: 4, fill: color }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
