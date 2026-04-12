"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatInr } from "@/lib/money";

export function IncomeExpenseChart({
  data,
}: {
  data: { label: string; income: number; expense: number }[];
}) {
  const chartData = data.map((d) => ({
    name: d.label,
    income: d.income / 100,
    expense: d.expense / 100,
  }));

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => `₹${v}`}
          />
          <Tooltip
            formatter={(value) =>
              formatInr(Math.round(Number(value ?? 0) * 100))
            }
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="income"
            name="Income"
            stroke="hsl(152 60% 40%)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="expense"
            name="Expenses"
            stroke="hsl(0 72% 51%)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
