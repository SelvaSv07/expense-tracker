"use client";

import { formatInr } from "@/lib/money";
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

export function BudgetBarChart({
  data,
}: {
  data: { month: string; budgeted: number; spent: number }[];
}) {
  const chart = data.map((d) => ({
    month: d.month,
    budgeted: d.budgeted / 100,
    spent: d.spent / 100,
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chart}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v) => `₹${v}`} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value) =>
              formatInr(Math.round(Number(value ?? 0) * 100))
            }
          />
          <Legend />
          <Bar
            dataKey="budgeted"
            name="Budgeted"
            fill="hsl(220 14% 86%)"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="spent"
            name="Spent"
            fill="hsl(173 58% 39%)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
