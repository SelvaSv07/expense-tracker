"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export function BudgetRadarChart({
  data,
}: {
  data: { month: string; pct: number }[];
}) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="month" tick={{ fontSize: 10 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
          <Tooltip
            formatter={(v) => `${Number(v ?? 0)}% of budget`}
          />
          <Radar
            name="% used"
            dataKey="pct"
            stroke="hsl(173 58% 39%)"
            fill="hsl(173 58% 39%)"
            fillOpacity={0.35}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
