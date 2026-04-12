"use client";

import { formatInr } from "@/lib/money";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function SavingsLineChart({
  data,
}: {
  data: { date: string; cumulative: number }[];
}) {
  const chart = data.map((d) => ({
    date: d.date,
    cumulative: d.cumulative / 100,
  }));

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chart}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis tickFormatter={(v) => `₹${v}`} tick={{ fontSize: 10 }} />
          <Tooltip
            formatter={(value) =>
              formatInr(Math.round(Number(value ?? 0) * 100))
            }
          />
          <Line
            type="monotone"
            dataKey="cumulative"
            name="Total saved"
            stroke="hsl(173 58% 39%)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
