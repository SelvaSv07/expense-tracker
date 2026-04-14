"use client";

import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

function BudgetRadarTooltip({
  active,
  payload,
  label,
  cazura,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ value?: unknown }> | undefined;
  label?: string | number;
  cazura: boolean;
}) {
  if (!active || !payload?.length || label == null) return null;
  const raw = payload[0]?.value;
  const pct = Math.round(Number(Array.isArray(raw) ? raw[0] : raw ?? 0));

  if (cazura) {
    return (
      <div
        className="min-w-0 rounded-lg border bg-white px-2.5 py-1.5 shadow-md"
        style={{
          borderColor: "var(--cazura-border)",
          boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
        }}
      >
        <p
          className="mb-0.5 text-[11px] font-semibold leading-tight"
          style={{ color: "var(--cazura-text)" }}
        >
          {String(label)}
        </p>
        <p
          className="text-[11px] font-bold tabular-nums leading-tight"
          style={{ color: "var(--cazura-teal)" }}
        >
          {pct}%
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-popover px-2 py-1.5 text-xs shadow-md">
      <p className="font-medium">{String(label)}</p>
      <p className="tabular-nums text-muted-foreground">{pct}%</p>
    </div>
  );
}

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
        <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
          <PolarGrid
            stroke={cazura ? "var(--cazura-border)" : undefined}
            strokeWidth={cazura ? 0.75 : 1}
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
            tickCount={5}
            tick={false}
            axisLine={false}
          />
          <Tooltip
            content={(props) => (
              <BudgetRadarTooltip
                active={props.active}
                payload={
                  props.payload as
                    | ReadonlyArray<{ value?: unknown }>
                    | undefined
                }
                label={props.label}
                cazura={cazura}
              />
            )}
            wrapperStyle={{ outline: "none" }}
          />
          <Legend
            wrapperStyle={
              cazura
                ? {
                    paddingTop: 4,
                    fontSize: 11,
                    color: "var(--cazura-muted)",
                  }
                : undefined
            }
            formatter={(value) => (
              <span style={cazura ? { color: "var(--cazura-text)" } : undefined}>
                {value}
              </span>
            )}
          />
          <Radar
            name="Budget used"
            dataKey="pct"
            stroke={cazura ? "var(--cazura-teal)" : "hsl(173 58% 39%)"}
            strokeWidth={cazura ? 2 : 1.5}
            fill={cazura ? "var(--cazura-teal)" : "hsl(173 58% 39%)"}
            fillOpacity={cazura ? 0.18 : 0.35}
            dot={
              cazura
                ? {
                    r: 3.5,
                    fill: "var(--cazura-teal)",
                    stroke: "var(--cazura-panel)",
                    strokeWidth: 2,
                  }
                : undefined
            }
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
