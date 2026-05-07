"use client";

import {
  CategoryIconShelf,
  categoryIconShelfBorderStyle,
} from "@/lib/category-color";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cazuraTooltipSurfaceClassName } from "@/components/ui/tooltip";
import { computeExpenseBubblePack } from "@/lib/expense-bubble-pack";
import { formatInr } from "@/lib/money";
import { cn } from "@/lib/utils";
import { ArrowUpRight, MoreHorizontal } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

const BUBBLE_COLORS = ["#3b6064", "#528186", "#7f9da0", "#a2b046"] as const;

const BUBBLE_LAYOUT = [
  { size: 100, top: 17, left: 8.5, textSize: 20, subSize: 12 },
  { size: 80, top: 0, left: 95.5, textSize: 16, subSize: 10 },
  { size: 60, top: 71, left: 90.5, textSize: 14, subSize: 8 },
  { size: 40, top: 61, left: 144, textSize: 10, subSize: 6 },
] as const;

const CARD_BUBBLE_COUNT = 4;
const DIALOG_BUBBLE_COUNT = 6;

const DIALOG_PACK_W = 300;
const DIALOG_PACK_H = 220;

type BreakdownItem = { name: string; value: number };

/** Same stack as chart tooltips + `TooltipContent`; portaled so main overflow doesn’t clip. */
function BubbleTooltipBody({
  name,
  amount,
  pctLabel,
  accentColor,
}: {
  name: string;
  amount: number;
  pctLabel: string;
  accentColor: string;
}) {
  return (
    <>
      <p
        className="mb-0.5 text-[11px] font-semibold leading-tight"
        style={{ color: "var(--cazura-text)" }}
      >
        {name}
      </p>
      <p
        className="mb-0.5 text-[11px] font-medium tabular-nums leading-tight"
        style={{ color: "var(--cazura-muted)" }}
      >
        {formatInr(amount)}
      </p>
      <p
        className="text-[11px] font-bold tabular-nums leading-tight"
        style={{ color: accentColor }}
      >
        {pctLabel}%
      </p>
    </>
  );
}

const TOOLTIP_MAX_WIDTH_PX = 224;

/** Lets pointer move from anchor row into portaled tooltip without flicker. */
const HOVER_TOOLTIP_CLOSE_DELAY_MS = 120;

/** Row lists: optional above icon; bubbles use centered-under-anchor. */
function BubbleTooltipPortal({
  anchorRef,
  open,
  children,
  placement = "below-center",
  onPointerEnter,
  onPointerLeave,
}: {
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  children: ReactNode;
  placement?: "below-center" | "below-start" | "above-center";
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [popupStyle, setPopupStyle] = useState<CSSProperties>({});

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) {
      setPopupStyle({});
      return;
    }

    const updatePosition = () => {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const gap = 8;
      const vw =
        typeof window !== "undefined" ? window.innerWidth : r.width + r.left;
      const approxWidth = Math.min(TOOLTIP_MAX_WIDTH_PX, vw - 16);
      const tip = tooltipRef.current;
      const tipRect = tip?.getBoundingClientRect();
      const measured =
        tipRect && tipRect.width > 0 ? tipRect.width : 0;
      const tw = measured > 0 ? measured : approxWidth;

      const anchorCenterX = r.left + r.width / 2;

      /** Clamp horizontal placement using real tooltip width (approx width skewed clamp vs icon). */
      const clampLeftEdgeCentered = () => {
        let left = anchorCenterX - tw / 2;
        left = Math.max(gap, Math.min(left, vw - gap - tw));
        return left;
      };

      if (placement === "below-start") {
        let left = r.left;
        left = Math.max(gap, Math.min(left, vw - gap - tw));
        setPopupStyle({
          position: "fixed",
          top: r.bottom + gap,
          left,
          transform: "none",
          zIndex: 100,
        });
      } else if (placement === "above-center") {
        setPopupStyle({
          position: "fixed",
          top: r.top - gap,
          left: clampLeftEdgeCentered(),
          transform: "translateY(-100%)",
          zIndex: 100,
        });
      } else {
        setPopupStyle({
          position: "fixed",
          top: r.bottom + gap,
          left: clampLeftEdgeCentered(),
          transform: "none",
          zIndex: 100,
        });
      }
    };

    updatePosition();
    const raf = requestAnimationFrame(() => updatePosition());
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    const tipEl = tooltipRef.current;
    const resizeObs =
      typeof ResizeObserver !== "undefined" && tipEl
        ? new ResizeObserver(() => updatePosition())
        : null;
    resizeObs?.observe(tipEl);

    return () => {
      cancelAnimationFrame(raf);
      resizeObs?.disconnect();
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, anchorRef, placement]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={tooltipRef}
      role="tooltip"
      data-slot="tooltip-content"
      style={popupStyle}
      className={cn(
        cazuraTooltipSurfaceClassName,
        "min-w-0 max-w-[min(14rem,calc(100vw-1.5rem))] text-left animate-in fade-in-0 zoom-in-95 duration-100",
      )}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {children}
    </div>,
    document.body,
  );
}

function formatPct(value: number, total: number) {
  const pct = (value / total) * 100;
  return String(Math.round(pct));
}

/** Matches subscription/tooltip panel styling; CSS hover avoids broken anchors on absolute bubbles. */
function BubbleHoverDetails({
  name,
  amount,
  pctLabel,
  accentColor,
}: {
  name: string;
  amount: number;
  pctLabel: string;
  accentColor: string;
}) {
  return (
    <div
      className={cn(
        cazuraTooltipSurfaceClassName,
        "pointer-events-none absolute top-[calc(100%+8px)] left-1/2 z-[100] max-w-[min(14rem,calc(100vw-1.5rem))] min-w-0 -translate-x-1/2 text-center opacity-0 transition-opacity duration-150 group-hover:opacity-100",
      )}
      role="tooltip"
    >
      <span className="block font-bold">{name}</span>
      <span className="block tabular-nums">{formatInr(amount)}</span>
      <span
        className="block font-semibold tabular-nums"
        style={{ color: accentColor }}
      >
        {pctLabel}%
      </span>
    </div>
  );
}

function BubblePack({
  items,
  total,
  layouts,
  categoryColors,
  className,
}: {
  items: BreakdownItem[];
  total: number;
  layouts: readonly {
    size: number;
    top: number;
    left: number;
    textSize: number;
    subSize: number;
  }[];
  categoryColors: Record<string, string>;
  className?: string;
}) {
  return (
    <div
      className={cn("relative mx-auto overflow-visible", className)}
      style={{ isolation: "isolate" }}
    >
      {items.map((b, i) => {
        const layout = layouts[i];
        if (!layout) return null;
        const pct = Math.round((b.value / total) * 100);
        const tipPct = formatPct(b.value, total);
        const color =
          categoryColors[b.name] ?? BUBBLE_COLORS[i % BUBBLE_COLORS.length];
        return (
          <div
            key={b.name}
            className="group absolute flex cursor-default flex-col items-center justify-center border-2 hover:!z-50"
            style={{
              left: layout.left,
              top: layout.top,
              width: layout.size,
              height: layout.size,
              borderRadius: layout.size / 2,
              background: color,
              borderColor: "var(--cazura-panel)",
              zIndex: i + 1,
            }}
          >
            <BubbleHoverDetails
              name={b.name}
              amount={b.value}
              pctLabel={tipPct}
              accentColor={color}
            />
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
  );
}

/** D3 circle-packing layout — bubbles touch tangentially in one tight cluster. */
function BubblePackD3({
  items,
  total,
  categoryColors,
  className,
}: {
  items: BreakdownItem[];
  total: number;
  categoryColors: Record<string, string>;
  className?: string;
}) {
  const packed = useMemo(
    () => computeExpenseBubblePack(items, DIALOG_PACK_W, DIALOG_PACK_H, 2),
    [items],
  );

  const rank = useMemo(
    () => new Map(items.map((b, i) => [b.name, i] as const)),
    [items],
  );

  const valueByName = useMemo(
    () => new Map(items.map((b) => [b.name, b.value] as const)),
    [items],
  );

  return (
    <div
      className={cn("relative mx-auto shrink-0 overflow-visible", className)}
      style={{
        width: DIALOG_PACK_W,
        height: DIALOG_PACK_H,
        isolation: "isolate",
      }}
    >
      {packed.map((node) => {
        const i = rank.get(node.name) ?? 0;
        const raw = valueByName.get(node.name) ?? 0;
        const pct = Math.round((raw / total) * 100);
        const tipPct = formatPct(raw, total);
        const color =
          categoryColors[node.name] ?? BUBBLE_COLORS[i % BUBBLE_COLORS.length];
        const d = node.r * 2;
        const textSize = Math.min(26, Math.max(9, node.r * 0.42));
        const subSize = Math.min(14, Math.max(7, node.r * 0.22));
        return (
          <div
            key={node.name}
            className="group absolute flex cursor-default flex-col items-center justify-center border-2 hover:!z-50"
            style={{
              left: node.x - node.r,
              top: node.y - node.r,
              width: d,
              height: d,
              borderRadius: node.r,
              background: color,
              borderColor: "var(--cazura-panel)",
              zIndex: i + 1,
            }}
          >
            <BubbleHoverDetails
              name={node.name}
              amount={raw}
              pctLabel={tipPct}
              accentColor={color}
            />
            <span
              className="font-bold leading-none text-[var(--cazura-panel)]"
              style={{ fontSize: textSize }}
            >
              {pct}%
            </span>
            <span
              className="max-w-[88%] truncate text-center leading-tight text-[rgba(248,248,248,0.85)]"
              style={{ fontSize: subSize }}
            >
              {node.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function OtherCategoryRow({
  item,
  total,
  rowIndex,
  categoryIcons,
  categoryColors,
}: {
  item: BreakdownItem;
  total: number;
  rowIndex: number;
  categoryIcons: Record<string, string | null>;
  categoryColors: Record<string, string>;
}) {
  const iconAnchorRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tipOpen, setTipOpen] = useState(false);
  const tipPct = formatPct(item.value, total);
  const accent =
    categoryColors[item.name] ?? BUBBLE_COLORS[rowIndex % BUBBLE_COLORS.length];

  const cancelScheduledClose = useCallback(() => {
    if (closeTimerRef.current != null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const showTooltip = useCallback(() => {
    cancelScheduledClose();
    setTipOpen(true);
  }, [cancelScheduledClose]);

  const hideTooltipSoon = useCallback(() => {
    cancelScheduledClose();
    closeTimerRef.current = setTimeout(() => {
      setTipOpen(false);
      closeTimerRef.current = null;
    }, HOVER_TOOLTIP_CLOSE_DELAY_MS);
  }, [cancelScheduledClose]);

  useEffect(() => () => cancelScheduledClose(), [cancelScheduledClose]);

  return (
    <>
      <div
        className="flex cursor-default items-center gap-2"
        onPointerEnter={showTooltip}
        onPointerLeave={hideTooltipSoon}
      >
        <div ref={iconAnchorRef} className="inline-flex shrink-0">
          <CategoryIconShelf
            icon={categoryIcons[item.name] ?? null}
            color={categoryColors[item.name]}
            className="size-6 shrink-0 rounded-md border p-1"
            style={categoryIconShelfBorderStyle(categoryColors[item.name])}
            iconClassName="size-[11px]"
          />
        </div>
        <span
          className="min-w-0 flex-1 truncate text-xs"
          style={{ color: "var(--cazura-text)" }}
        >
          {item.name}
        </span>
        <span
          className="text-[10px] font-bold whitespace-nowrap"
          style={{ color: "var(--cazura-text)" }}
        >
          {tipPct}%
        </span>
      </div>
      <BubbleTooltipPortal
        anchorRef={iconAnchorRef}
        open={tipOpen}
        placement="above-center"
        onPointerEnter={showTooltip}
        onPointerLeave={hideTooltipSoon}
      >
        <BubbleTooltipBody
          name={item.name}
          amount={item.value}
          pctLabel={tipPct}
          accentColor={accent}
        />
      </BubbleTooltipPortal>
    </>
  );
}

function OtherCategoriesList({
  items,
  total,
  categoryIcons,
  categoryColors,
}: {
  items: BreakdownItem[];
  total: number;
  categoryIcons: Record<string, string | null>;
  categoryColors: Record<string, string>;
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <p
        className="text-[13px] font-bold"
        style={{ color: "var(--cazura-text)" }}
      >
        Other Categories
      </p>
      <div className="flex flex-col gap-2">
        {items.map((o, i) => (
          <OtherCategoryRow
            key={o.name}
            item={o}
            total={total}
            rowIndex={i}
            categoryIcons={categoryIcons}
            categoryColors={categoryColors}
          />
        ))}
      </div>
    </div>
  );
}

export function ExpenseBreakdownCazura({
  breakdown,
  categoryIcons,
  categoryColors,
}: {
  breakdown: BreakdownItem[];
  categoryIcons: Record<string, string | null>;
  categoryColors: Record<string, string>;
}) {
  const [seeAllOpen, setSeeAllOpen] = useState(false);
  const sorted = [...breakdown].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((s, x) => s + x.value, 0);
  const top4 = sorted.slice(0, CARD_BUBBLE_COUNT);
  const others = sorted.slice(CARD_BUBBLE_COUNT, CARD_BUBBLE_COUNT + 4);
  const dialogBubbles = sorted.slice(0, DIALOG_BUBBLE_COUNT);

  if (total === 0 || top4.length === 0) {
    return (
      <div
          className="flex flex-col gap-4 rounded-xl border p-3"
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
          <p
            className="text-center text-xs"
            style={{ color: "var(--cazura-muted)" }}
          >
            No expense data in this range.
          </p>
        </div>
    );
  }

  return (
      <div
        className="flex flex-col gap-4 rounded-xl border p-3"
        style={{
          background: "var(--cazura-panel)",
          borderColor: "var(--cazura-border)",
        }}
      >
      <Dialog open={seeAllOpen} onOpenChange={setSeeAllOpen}>
        <DialogContent
          className="flex max-h-[min(92vh,720px)] w-full max-w-[calc(100%-2rem)] flex-col gap-4 overflow-y-auto border-[var(--cazura-border)] bg-[var(--cazura-panel)] p-4 text-[var(--cazura-text)] ring-[var(--cazura-border)] sm:max-w-2xl"
          showCloseButton
        >
          <DialogHeader className="shrink-0 space-y-1.5 text-left">
            <DialogTitle>Expense breakdown</DialogTitle>
            <DialogDescription style={{ color: "var(--cazura-muted)" }}>
              All expense categories in this period, by share of total.
            </DialogDescription>
          </DialogHeader>

          <div className="mb-1 flex shrink-0 justify-center overflow-visible px-1">
            <BubblePackD3
              items={dialogBubbles}
              total={total}
              categoryColors={categoryColors}
            />
          </div>

          <div className="flex min-h-0 flex-col gap-2">
            <p
              className="shrink-0 text-[13px] font-bold"
              style={{ color: "var(--cazura-text)" }}
            >
              All categories
            </p>
            <div
              className="max-h-[min(50vh,400px)] overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable]"
            >
              <div className="flex flex-col gap-2 pb-1">
                {sorted.map((o, i) => (
                  <OtherCategoryRow
                    key={o.name}
                    item={o}
                    total={total}
                    rowIndex={i}
                    categoryIcons={categoryIcons}
                    categoryColors={categoryColors}
                  />
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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

      <BubblePack
        items={top4}
        total={total}
        layouts={BUBBLE_LAYOUT}
        categoryColors={categoryColors}
        className="h-[131px] w-[193px]"
      />

      {others.length > 0 ? (
        <OtherCategoriesList
          items={others}
          total={total}
          categoryIcons={categoryIcons}
          categoryColors={categoryColors}
        />
      ) : null}

      <Button
        type="button"
        variant="outline"
        className="h-auto w-full cursor-pointer gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium shadow-none"
        style={{
          background: "var(--cazura-panel)",
          borderColor: "var(--cazura-border)",
          color: "var(--cazura-text)",
        }}
        onClick={() => setSeeAllOpen(true)}
      >
        See All
        <ArrowUpRight className="size-3.5" strokeWidth={2} />
      </Button>
    </div>
  );
}
