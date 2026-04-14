import { CategoryIconShelf } from "@/lib/category-color";
import { cn } from "@/lib/utils";
import { ArrowUpRight, MoreHorizontal } from "lucide-react";
import Link from "next/link";

const BUBBLE_COLORS = ["#3b6064", "#528186", "#7f9da0", "#a2b046"] as const;

const BUBBLE_LAYOUT = [
  { size: 100, top: 17, left: 8.5, textSize: 20, subSize: 12 },
  { size: 80, top: 0, left: 95.5, textSize: 16, subSize: 10 },
  { size: 60, top: 71, left: 90.5, textSize: 14, subSize: 8 },
  { size: 40, top: 61, left: 144, textSize: 10, subSize: 6 },
] as const;

export function ExpenseBreakdownCazura({
  breakdown,
  categoryIcons,
}: {
  breakdown: { name: string; value: number }[];
  categoryIcons: Record<string, string | null>;
}) {
  const sorted = [...breakdown].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((s, x) => s + x.value, 0);
  const top4 = sorted.slice(0, 4);
  const others = sorted.slice(4, 8);

  if (total === 0 || top4.length === 0) {
    return (
      <div
        className="flex flex-col gap-6 rounded-xl border p-3"
        style={{
          background: "var(--cazura-panel)",
          borderColor: "var(--cazura-border)",
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="flex-1 text-[15px] font-bold"
            style={{ color: "var(--cazura-text)" }}
          >
            Expense Breakdown
          </span>
          <div
            className="flex items-center justify-center rounded-lg border p-1.5"
            style={{ borderColor: "var(--cazura-border)" }}
          >
            <MoreHorizontal
              className="size-3.5 text-[var(--cazura-label)]"
              strokeWidth={2}
            />
          </div>
        </div>
        <p className="text-center text-xs" style={{ color: "var(--cazura-muted)" }}>
          No expense data in this range.
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-6 rounded-xl border p-3"
      style={{
        background: "var(--cazura-panel)",
        borderColor: "var(--cazura-border)",
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex-1 text-[15px] font-bold"
          style={{ color: "var(--cazura-text)" }}
        >
          Expense Breakdown
        </span>
        <div
          className="flex items-center justify-center rounded-lg border p-1.5"
          style={{ borderColor: "var(--cazura-border)" }}
        >
          <MoreHorizontal
            className="size-3.5 text-[var(--cazura-label)]"
            strokeWidth={2}
          />
        </div>
      </div>

      <div className="relative mx-auto h-[131px] w-[193px]">
        {top4.map((b, i) => {
          const layout = BUBBLE_LAYOUT[i] ?? BUBBLE_LAYOUT[3]!;
          const pct = Math.round((b.value / total) * 100);
          const color =
            categoryColors[b.name] ??
            BUBBLE_COLORS[i % BUBBLE_COLORS.length];
          return (
            <div
              key={b.name}
              className="absolute flex flex-col items-center justify-center border-2"
              style={{
                left: layout.left,
                top: layout.top,
                width: layout.size,
                height: layout.size,
                borderRadius: layout.size / 2,
                background: color,
                borderColor: "var(--cazura-panel)",
              }}
            >
              <span
                className="font-bold leading-none text-[var(--cazura-panel)]"
                style={{ fontSize: layout.textSize }}
              >
                {pct}%
              </span>
              <span
                className="max-w-[90%] truncate text-center leading-tight text-[rgba(248,248,248,0.85)]"
                style={{ fontSize: layout.subSize }}
              >
                {b.name}
              </span>
            </div>
          );
        })}
      </div>

      {others.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p
            className="text-[13px] font-bold"
            style={{ color: "var(--cazura-text)" }}
          >
            Other Categories
          </p>
          <div className="flex flex-col gap-2">
            {others.map((o) => {
              const pct = (o.value / total) * 100;
              return (
                <div key={o.name} className="flex items-center gap-2">
                  <CategoryIconShelf
                    icon={categoryIcons[o.name] ?? null}
                    color={categoryColors[o.name]}
                    className="size-6 rounded-md border p-1"
                    style={{
                      borderColor: "var(--cazura-border)",
                    }}
                    iconClassName="size-[11px]"
                  />
                  <span
                    className="min-w-0 flex-1 truncate text-xs"
                    style={{ color: "var(--cazura-text)" }}
                  >
                    {o.name}
                  </span>
                  <span
                    className="text-[10px] font-bold whitespace-nowrap"
                    style={{ color: "var(--cazura-text)" }}
                  >
                    {pct < 0.1 ? pct.toFixed(2) : pct.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <Link
        href="/budget"
        className={cn(
          "flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium",
        )}
        style={{
          background: "var(--cazura-panel)",
          borderColor: "var(--cazura-border)",
          color: "var(--cazura-text)",
        }}
      >
        See All
        <ArrowUpRight className="size-3.5" strokeWidth={2} />
      </Link>
    </div>
  );
}
