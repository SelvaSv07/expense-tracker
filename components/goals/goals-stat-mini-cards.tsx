import { formatInr } from "@/lib/money";
import { cn } from "@/lib/utils";
import { PiggyBank, Target, Wallet } from "lucide-react";
import type { ReactNode } from "react";

function StatCard({
  title,
  primary,
  sublabel,
  icon,
  primaryIsInr = true,
}: {
  title: string;
  primary: string;
  sublabel: string;
  icon?: ReactNode;
  primaryIsInr?: boolean;
}) {
  return (
    <div
      className="flex min-w-[180px] flex-1 flex-col gap-4 rounded-xl border p-3"
      style={{
        background: "var(--cazura-panel)",
        borderColor: "var(--cazura-border)",
      }}
    >
      <div className="flex items-center gap-2">
        {icon ? <span className="shrink-0">{icon}</span> : null}
        <span
          className="min-w-0 flex-1 text-base font-bold"
          style={{ color: "var(--cazura-text)" }}
        >
          {title}
        </span>
      </div>
      <div className="flex flex-col gap-2 px-1">
        <span
          className="text-2xl font-medium tracking-tight"
          style={{ color: "var(--cazura-text)" }}
        >
          {primaryIsInr ? formatInr(Number(primary)) : primary}
        </span>
        <p className="text-xs leading-snug" style={{ color: "var(--cazura-label)" }}>
          {sublabel}
        </p>
      </div>
    </div>
  );
}

export function GoalsStatMiniCards({
  totalSaved,
  active,
  avgMonthly,
}: {
  totalSaved: number;
  active: number;
  avgMonthly: number;
}) {
  return (
    <div
      className={cn(
        "flex gap-4 overflow-x-auto pb-1",
        "md:overflow-visible",
      )}
    >
      <StatCard
        title="Total saved"
        primary={String(totalSaved)}
        sublabel="Across all your savings goals"
        primaryIsInr
        icon={
          <PiggyBank
            className="size-4"
            strokeWidth={1.8}
            style={{ color: "var(--cazura-teal-mid)" }}
          />
        }
      />
      <StatCard
        title="Active goals"
        primary={String(active)}
        sublabel="Goals still in progress"
        primaryIsInr={false}
        icon={
          <Target
            className="size-4"
            strokeWidth={1.8}
            style={{ color: "var(--cazura-teal-mid)" }}
          />
        }
      />
      <StatCard
        title="Avg. monthly contribution"
        primary={String(avgMonthly)}
        sublabel="Based on months with contributions"
        primaryIsInr
        icon={
          <Wallet
            className="size-4"
            strokeWidth={1.8}
            style={{ color: "var(--cazura-teal-mid)" }}
          />
        }
      />
    </div>
  );
}
