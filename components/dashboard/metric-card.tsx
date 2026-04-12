import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatInr } from "@/lib/money";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";

export function MetricCard({
  title,
  value,
  deltaLabel,
  delta,
  trend,
  sublabel,
}: {
  title: string;
  value: number;
  deltaLabel?: string;
  delta?: number;
  trend?: "up" | "down" | "neutral";
  sublabel?: string;
}) {
  const positive = trend === "up";
  const negative = trend === "down";

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">
          {formatInr(value)}
        </div>
        {sublabel ? (
          <p className="text-muted-foreground mt-1 text-xs">{sublabel}</p>
        ) : null}
        {deltaLabel !== undefined && delta !== undefined ? (
          <div
            className={cn(
              "mt-2 flex flex-wrap items-center gap-1 text-xs font-medium",
              positive && "text-emerald-600",
              negative && "text-red-600",
              !positive && !negative && "text-muted-foreground",
            )}
          >
            {positive ? (
              <TrendingUp className="size-3.5" />
            ) : negative ? (
              <TrendingDown className="size-3.5" />
            ) : null}
            <span>{deltaLabel}</span>
            <span className="text-muted-foreground font-normal">
              ({formatInr(Math.abs(delta))} vs previous)
            </span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
