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
  variant = "default",
}: {
  data: { month: string; pct: number }[];
  variant?: "default" | "cazura";
}) {
  const cazura = variant === "cazura";

  return (
    <div className="h-[300px] w-full min-w-0">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        initialDimension={{ width: 400, height: 300 }}
      >
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid
            stroke={cazura ? "var(--cazura-border)" : undefined}
            strokeWidth={1}
          />
          <PolarAngleAxis
            dataKey="month"
            tick={{
              fontSize: cazura ? 11 : 10,
              fill: cazura ? "var(--cazura-muted)" : undefined,
            }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{
              fontSize: cazura ? 10 : 9,
              fill: cazura ? "var(--cazura-label)" : undefined,
            }}
          />
          <Tooltip
            contentStyle={
              cazura
                ? {
                    background: "var(--cazura-panel)",
                    border: "1px solid var(--cazura-border)",
                    borderRadius: 8,
                    boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
                  }
                : undefined
            }
            labelStyle={
              cazura ? { color: "var(--cazura-muted)", fontSize: 11 } : undefined
            }
            formatter={(v) => `${Number(v ?? 0)}% of budget`}
          />
          <Radar
            name="% used"
            dataKey="pct"
            stroke={cazura ? "#487478" : "hsl(173 58% 39%)"}
            fill={cazura ? "rgba(72, 116, 120, 0.2)" : "hsl(173 58% 39%)"}
            fillOpacity={cazura ? 1 : 0.35}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
