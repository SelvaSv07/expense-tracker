import { Button, buttonVariants } from "@/components/ui/button";
import { formatInr } from "@/lib/money";
import { cn } from "@/lib/utils";
import { ChevronRight, Plus, Send } from "lucide-react";
import Link from "next/link";

export function OverviewBalanceBanner({
  balance,
  todaySpend,
}: {
  balance: number;
  todaySpend: number;
}) {
  return (
    <div
      className="relative flex min-h-[90px] items-end justify-between overflow-hidden rounded-xl px-4 py-3.5"
      style={{
        backgroundImage:
          "linear-gradient(154.72deg, #ecf4ec 50%, #dbecdc 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 120% at 100% 0%, rgba(59,96,100,0.12), transparent 55%)",
        }}
      />

      <div className="relative flex flex-wrap items-end gap-3 md:gap-4">
        <div>
          <p
            className="mb-1 text-[13px] font-medium"
            style={{ color: "var(--cazura-label)" }}
          >
            Total balance
          </p>
          <p
            className="text-[30px] leading-none font-bold"
            style={{ color: "var(--cazura-teal)" }}
          >
            {formatInr(balance)}
          </p>
        </div>
        <div className="flex items-center gap-1 pb-0.5">
          <span
            className="text-xs font-medium"
            style={{ color: "var(--cazura-label)" }}
          >
            Today&apos;s spend:
          </span>
          <span
            className="text-[13px] font-bold"
            style={{ color: "var(--cazura-teal-mid)" }}
          >
            {formatInr(todaySpend)}
          </span>
          <ChevronRight
            className="size-[13px] shrink-0"
            strokeWidth={2.5}
            color="var(--cazura-teal-mid)"
          />
        </div>
      </div>

      <div className="relative flex items-center gap-3">
        <div className="flex flex-col items-center gap-1">
          <Link
            href="/transactions"
            aria-label="Add transaction"
            className={cn(
              buttonVariants({ size: "icon" }),
              "size-8 rounded-full border-0 shadow-[0_4px_12px_rgba(59,96,100,0.5)]",
            )}
            style={{ background: "var(--cazura-teal)" }}
          >
            <Plus className="size-[15px] text-white" strokeWidth={2.5} />
          </Link>
          <span
            className="text-[10px] font-medium"
            style={{ color: "var(--cazura-muted)" }}
          >
            Add
          </span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Button
            size="icon"
            variant="secondary"
            className="size-8 rounded-full border-0"
            style={{ background: "var(--cazura-panel)" }}
            type="button"
            aria-label="Send"
          >
            <Send
              className="size-3.5"
              strokeWidth={1.8}
              color="var(--cazura-teal)"
            />
          </Button>
          <span
            className="text-[10px] font-medium"
            style={{ color: "var(--cazura-muted)" }}
          >
            Send
          </span>
        </div>
      </div>
    </div>
  );
}
