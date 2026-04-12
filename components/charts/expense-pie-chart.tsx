"use client";

import { formatInr } from "@/lib/money";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const COLORS = [
  "hsl(173 58% 39%)",
  "hsl(199 89% 48%)",
  "hsl(43 96% 56%)",
  "hsl(280 65% 60%)",
  "hsl(340 75% 55%)",
  "hsl(152 60% 40%)",
];

export function ExpensePieChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const chartData = data.map((d) => ({
    name: d.name,
    value: d.value / 100,
  }));

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={90}
            paddingAngle={2}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) =>
              formatInr(Math.round(Number(value ?? 0) * 100))
            }
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
