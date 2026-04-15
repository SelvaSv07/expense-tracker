"use client";

import { Button } from "@/components/ui/button";
import { resolveCategoryIcon } from "@/lib/category-icon";
import type { AssistantUiOutput } from "@/lib/ai/output";
import type { AssistantToolData, AssistantToolDataList } from "@/lib/ai/tool-ui";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowUp,
  BarChart2,
  CheckCircle2,
  CircleX,
  Coins,
  ImagePlus,
  Paperclip,
  PanelLeft,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

const FEATURES = [
  {
    icon: Coins,
    title: "Smart Savings Planner",
    description:
      "Get personalized saving based on your income, spending, and goals.",
  },
  {
    icon: BarChart2,
    title: "Budget Optimizer",
    description:
      "AI highlights overspending and helps you stay on track each month.",
  },
  {
    icon: TrendingUp,
    title: "Cash Flow Forecaster",
    description:
      "AI predicts future cash positions and alerts you to potential shortfalls.",
  },
] as const;

function SoundWaveIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
    >
      <rect x="1" y="6" width="2" height="4" rx="0.5" />
      <rect x="4.5" y="4" width="2" height="8" rx="0.5" />
      <rect x="8" y="2" width="2" height="12" rx="0.5" />
      <rect x="11.5" y="5" width="2" height="6" rx="0.5" />
      <rect x="15" y="7" width="2" height="2" rx="0.5" />
    </svg>
  );
}

function AssistantRichContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none text-[var(--cazura-text)] prose-p:my-1 prose-li:my-0.5 prose-strong:text-[var(--cazura-text)] prose-em:text-[var(--cazura-text)]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto rounded-lg border border-[var(--cazura-border)]">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[var(--cazura-canvas)]">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[var(--cazura-muted)]">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-t border-[var(--cazura-border)] px-3 py-2 text-sm text-[var(--cazura-text)]">
              {children}
            </td>
          ),
          ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
          p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function AssistantStructuredContent({ payload }: { payload: AssistantUiOutput }) {
  return (
    <div className="space-y-2">
      {payload.cards?.length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {payload.cards.map((card, idx) => (
            <div
              key={`${card.title}-${idx}`}
              className="rounded-lg border border-[var(--cazura-border)] bg-[var(--cazura-panel)] p-2"
            >
              <p className="text-xs font-semibold text-[var(--cazura-text)]">{card.title}</p>
              <div className="mt-1 space-y-1">
                {card.fields.map((field, fIdx) => (
                  <div key={`${field.label}-${fIdx}`} className="text-xs">
                    <span className="font-semibold text-[var(--cazura-muted)]">{field.label}: </span>
                    <span className="text-[var(--cazura-text)]">{field.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {payload.table ? (
        <div className="overflow-x-auto rounded-lg border border-[var(--cazura-border)]">
          <table className="w-full border-collapse text-xs">
            <thead className="bg-[var(--cazura-canvas)]">
              <tr>
                {payload.table.columns.map((col) => (
                  <th
                    key={col}
                    className="px-2 py-1.5 text-left font-semibold uppercase tracking-wide text-[var(--cazura-muted)]"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payload.table.rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td
                      key={`${rIdx}-${cIdx}`}
                      className="border-t border-[var(--cazura-border)] px-2 py-1.5 text-[var(--cazura-text)]"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function GenericKeyValueTable({
  rows,
  emptyLabel,
}: {
  rows: Record<string, unknown>[];
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-[var(--cazura-border)] bg-[var(--cazura-panel)] px-2 py-2 text-xs text-[var(--cazura-muted)]">
        {emptyLabel}
      </p>
    );
  }
  const keys = Object.keys(rows[0]!);
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--cazura-border)]">
      <table className="w-full min-w-[480px] border-collapse text-xs">
        <thead className="bg-[var(--cazura-canvas)]">
          <tr>
            {keys.map((k) => (
              <th
                key={k}
                className="px-2 py-1.5 text-left font-semibold uppercase tracking-wide text-[var(--cazura-muted)]"
              >
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rIdx) => (
            <tr key={rIdx}>
              {keys.map((k) => (
                <td
                  key={k}
                  className="border-t border-[var(--cazura-border)] px-2 py-1.5 text-[var(--cazura-text)] break-all"
                >
                  {formatCell(row[k])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function AssistantToolDataView({ toolData }: { toolData: AssistantToolData }) {
  switch (toolData.kind) {
    case "transaction_list": {
      if (toolData.data.rows.length === 0) {
        return (
          <p className="mb-2 text-xs text-[var(--cazura-muted)]">No transactions found.</p>
        );
      }
      return (
        <div className="mb-2 overflow-x-auto rounded-lg border border-[var(--cazura-border)]">
          <table className="w-full border-collapse text-xs">
            <thead className="bg-[var(--cazura-canvas)]">
              <tr>
                <th className="px-2 py-1.5 text-left font-semibold uppercase tracking-wide text-[var(--cazura-muted)]">
                  Date
                </th>
                <th className="px-2 py-1.5 text-left font-semibold uppercase tracking-wide text-[var(--cazura-muted)]">
                  Name / Note
                </th>
                <th className="px-2 py-1.5 text-left font-semibold uppercase tracking-wide text-[var(--cazura-muted)]">
                  Category
                </th>
                <th className="px-2 py-1.5 text-left font-semibold uppercase tracking-wide text-[var(--cazura-muted)]">
                  Method
                </th>
                <th className="px-2 py-1.5 text-right font-semibold uppercase tracking-wide text-[var(--cazura-muted)]">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {toolData.data.rows.map((row) => (
                <tr key={row.id}>
                  <td className="border-t border-[var(--cazura-border)] px-2 py-1.5 text-[var(--cazura-text)]">
                    {new Date(row.dateTimeIso).toLocaleString()}
                  </td>
                  <td className="border-t border-[var(--cazura-border)] px-2 py-1.5 text-[var(--cazura-text)]">
                    {row.nameNote}
                  </td>
                  <td className="border-t border-[var(--cazura-border)] px-2 py-1.5 text-[var(--cazura-text)]">
                    {row.category}
                  </td>
                  <td className="border-t border-[var(--cazura-border)] px-2 py-1.5 text-[var(--cazura-text)]">
                    {row.method}
                  </td>
                  <td className="border-t border-[var(--cazura-border)] px-2 py-1.5 text-right text-[var(--cazura-text)]">
                    {`INR ${Math.round(row.amountInr)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case "transaction_summary":
      return (
        <div className="mb-2 rounded-lg border border-[var(--cazura-border)] bg-[var(--cazura-panel)] px-3 py-2 text-xs">
          <p className="font-semibold text-[var(--cazura-text)]">Balance</p>
          <p className="text-[var(--cazura-muted)]">
            INR {Math.round(toolData.data.balanceInr)}
          </p>
        </div>
      );
    case "category_list": {
      if (toolData.data.rows.length === 0) {
        return (
          <p className="mb-2 text-xs text-[var(--cazura-muted)]">No categories found.</p>
        );
      }
      return (
        <div className="mb-2 grid gap-2 sm:grid-cols-2">
          {toolData.data.rows.map((cat) => {
            const Icon = resolveCategoryIcon(cat.icon);
            return (
              <div
                key={cat.id}
                className="flex items-center gap-2.5 rounded-lg border border-[var(--cazura-border)] bg-[var(--cazura-panel)] px-3 py-2"
              >
                <div
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `${cat.color}22`, color: cat.color }}
                >
                  <Icon className="size-4" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--cazura-text)]">{cat.name}</p>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--cazura-muted)]">
                    {cat.type}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    case "budget_list":
      return (
        <div className="mb-2">
          <GenericKeyValueTable rows={toolData.data.rows} emptyLabel="No budgets." />
        </div>
      );
    case "goal_list":
      return (
        <div className="mb-2">
          <GenericKeyValueTable rows={toolData.data.rows} emptyLabel="No goals." />
        </div>
      );
    case "mutation_result":
      return toolData.data.ok ? (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-[#bfd8cc] bg-[#ebf5f0] px-3 py-2.5">
          <CheckCircle2 className="size-4 shrink-0 text-[var(--cazura-teal)]" strokeWidth={2} />
          <p className="text-sm font-medium text-[var(--cazura-teal)]">Done</p>
        </div>
      ) : (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
          <CircleX className="size-4 shrink-0 text-red-500" strokeWidth={2} />
          <p className="text-sm font-medium text-red-600">Action failed</p>
        </div>
      );
    case "export_link":
      return (
        <div className="mb-2 text-xs">
          <Link className="font-medium text-[var(--cazura-teal)] underline" href={toolData.data.href}>
            Download export
          </Link>
        </div>
      );
    default:
      return null;
  }
}

function ApprovalDetails({
  toolName,
  argumentsText,
  categoriesById,
}: {
  toolName: string;
  argumentsText: string;
  categoriesById: Record<
    string,
    { id: string; name: string; icon: string | null; color: string; type: string }
  >;
}) {
  let parsed: Record<string, unknown> | null = null;
  try {
    const j = JSON.parse(argumentsText);
    if (j && typeof j === "object") parsed = j as Record<string, unknown>;
  } catch {
    parsed = null;
  }

  const entries = parsed ? Object.entries(parsed) : [];
  const displayEntries = entries.slice(0, 8);
  const categoryId =
    parsed && typeof parsed.categoryId === "string" ? parsed.categoryId : null;
  const category = categoryId ? categoriesById[categoryId] : null;
  const Icon = resolveCategoryIcon(category?.icon);

  const niceLabel: Record<string, string> = {
    categoryId: "Category",
    amountInr: "Amount (INR)",
    occurredAtIso: "Date/Time",
    transactionName: "Description",
    note: "Note",
    paymentMethod: "Payment",
  };

  return (
    <div className="rounded-2xl border border-[#d8e6df] bg-gradient-to-b from-[#f7fbf9] to-[var(--cazura-panel)] p-4 shadow-[0_10px_30px_rgba(59,96,100,0.08)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {category ? (
            <div
              className="flex size-9 items-center justify-center rounded-xl border"
              style={{
                background: `${category.color}22`,
                borderColor: "var(--cazura-border)",
                color: category.color,
              }}
            >
              <Icon className="size-4" strokeWidth={2} />
            </div>
          ) : null}
          <div>
            <p className="text-sm font-semibold text-[var(--cazura-text)]">Approval needed</p>
            {category ? (
              <p className="text-xs text-[var(--cazura-muted)]">
                {category.name} ({category.type})
              </p>
            ) : null}
          </div>
        </div>
        <span className="rounded-full border border-[#bfd8cc] bg-[#ebf5f0] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--cazura-teal)]">
          {toolName}
        </span>
      </div>
      <p className="mb-2 text-xs text-[var(--cazura-muted)]">
        Please confirm this action before it modifies your data.
      </p>
      {displayEntries.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {displayEntries.map(([k, v]) => (
            <div key={k} className="rounded-lg border border-[var(--cazura-border)] bg-[var(--cazura-panel)] px-2.5 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--cazura-label)]">
                {niceLabel[k] ?? k}
              </p>
              <p className="mt-0.5 text-xs text-[var(--cazura-text)] break-all">
                {k === "categoryId" && category
                  ? category.name
                  : typeof v === "string"
                    ? v
                    : JSON.stringify(v)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[var(--cazura-muted)] break-all">{argumentsText}</p>
      )}
    </div>
  );
}

export function AiAssistantCanvas({
  chatCollapsed,
  onExpandChat,
  messages,
  input,
  onInputChange,
  onSend,
  sending,
  approvals,
  categoriesById,
  onResolveApproval,
  error,
}: {
  chatCollapsed: boolean;
  onExpandChat: () => void;
  messages: {
    id: string;
    role: "user" | "assistant";
    content: string;
    payload?: AssistantUiOutput | null;
    toolDataList?: AssistantToolDataList;
  }[];
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  sending: boolean;
  approvals: { approvalId: string; toolName: string; arguments: string }[];
  categoriesById: Record<
    string,
    { id: string; name: string; icon: string | null; color: string; type: string }
  >;
  onResolveApproval: (approvalId: string, decision: "approve" | "reject") => void;
  error: string | null;
}) {
  const hasMessages = messages.length > 0;
  const needsApiKey = useMemo(
    () => Boolean(error && error.toLowerCase().includes("api key")),
    [error],
  );

  return (
    <div
      className="relative flex min-h-0 min-w-0 flex-1 flex-col"
      style={{
        backgroundImage: `radial-gradient(circle at center, var(--cazura-border) 1px, transparent 1px)`,
        backgroundSize: "10px 10px",
        backgroundColor: "var(--cazura-canvas)",
      }}
    >
      {chatCollapsed ? (
        <button
          type="button"
          onClick={onExpandChat}
          className="absolute top-3 left-3 z-10 flex items-center rounded-lg border p-1.5 shadow-sm md:left-4"
          style={{
            background: "var(--cazura-panel)",
            borderColor: "var(--cazura-border)",
            color: "var(--cazura-text)",
          }}
          aria-label="Show chat history"
        >
          <PanelLeft className="size-4" strokeWidth={1.8} />
        </button>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col px-4 pt-4 pb-6 md:px-6">
        <div className="mb-6 shrink-0 text-sm font-medium text-[var(--cazura-text)] md:mb-8">
          Cazura 4.0
        </div>

        {!hasMessages ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-2">
            <div className="flex w-full max-w-[782px] flex-col items-center text-center">
            <div
              className="relative mb-5 flex size-20 items-center justify-center rounded-full border shadow-[0_0_28px_rgba(59,96,100,0.35)]"
              style={{
                borderColor: "#dcece5",
                background:
                  "linear-gradient(145deg, #dfefe7 0%, #e8f5ef 45%, #d4eadf 100%)",
              }}
            >
              <Sparkles
                className="size-9"
                strokeWidth={1.6}
                style={{ color: "var(--cazura-teal)" }}
              />
            </div>

            <h1
              className="mb-2 text-2xl font-bold tracking-tight md:text-[28px]"
              style={{ color: "var(--cazura-text)" }}
            >
              Welcome to{" "}
              <span
                className="bg-gradient-to-r from-[var(--cazura-teal)] via-[var(--cazura-teal-light)] to-[var(--cazura-teal-soft)] bg-clip-text text-transparent"
                style={{ WebkitTextFillColor: "transparent" }}
              >
                Cazura AI
              </span>
            </h1>
            <p
              className="mb-10 max-w-lg text-base font-medium md:text-lg"
              style={{ color: "var(--cazura-muted)" }}
            >
              Let&apos;s talk about your finance today
            </p>

            <div className="mb-10 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="flex flex-col gap-6 rounded-xl border p-6 text-left"
                  style={{
                    background: "var(--cazura-panel)",
                    borderColor: "var(--cazura-border)",
                  }}
                >
                  <div
                    className="relative flex size-9 items-center justify-center rounded-lg border"
                    style={{
                      borderColor: "#dcece5",
                      background: "#dfefe7",
                      boxShadow:
                        "inset 0 0 4px rgba(255,255,255,0.25), 0 0 16px rgba(59,96,100,0.35)",
                    }}
                  >
                    <Icon
                      className="size-5"
                      strokeWidth={1.8}
                      style={{ color: "var(--cazura-teal)" }}
                    />
                  </div>
                  <div className="space-y-1">
                    <p
                      className="text-base font-bold"
                      style={{ color: "var(--cazura-text)" }}
                    >
                      {title}
                    </p>
                    <p
                      className="text-xs font-medium leading-snug"
                      style={{ color: "var(--cazura-muted)" }}
                    >
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto rounded-xl border border-[var(--cazura-border)] bg-[var(--cazura-panel)] p-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn("max-w-[90%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap")}
                style={
                  m.role === "user"
                    ? {
                        marginLeft: "auto",
                        background: "var(--cazura-teal)",
                        color: "#fff",
                      }
                    : {
                        background: "var(--cazura-canvas)",
                        color: "var(--cazura-text)",
                      }
                }
              >
                {m.role === "assistant" ? (
                  <>
                    {(m.toolDataList ?? []).map((toolData, idx) => (
                      <AssistantToolDataView
                        key={`${m.id}-tool-${idx}`}
                        toolData={toolData}
                      />
                    ))}
                    {(() => {
                      const hasTxTool = (m.toolDataList ?? []).some(
                        (t) => t.kind === "transaction_list",
                      );
                      const payloadForStructure =
                        m.payload && hasTxTool ? { ...m.payload, table: null } : m.payload;
                      return payloadForStructure ? (
                        <AssistantStructuredContent payload={payloadForStructure} />
                      ) : null;
                    })()}
                    {(m.toolDataList ?? []).some((t) => t.kind === "transaction_list") ? (
                      <div className="mt-1 space-y-1 text-sm text-[var(--cazura-text)]">
                        {m.payload?.message ? (
                          <p className="whitespace-pre-wrap">{m.payload.message}</p>
                        ) : m.content.trim() ? (
                          <p className="whitespace-pre-wrap">{m.content}</p>
                        ) : null}
                        {m.payload?.followUpQuestion ? (
                          <p className="text-[var(--cazura-muted)]">{m.payload.followUpQuestion}</p>
                        ) : null}
                      </div>
                    ) : (
                      <AssistantRichContent content={m.content} />
                    )}
                  </>
                ) : (
                  m.content
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mx-auto mt-4 w-full max-w-[782px] shrink-0 space-y-3">
          {error ? (
            <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
              {needsApiKey ? (
                <span className="ml-2">
                  <Link className="underline" href="/settings/ai">
                    Configure key
                  </Link>
                </span>
              ) : null}
            </div>
          ) : null}

          {approvals.length > 0 ? (
            <div className="space-y-2">
              {approvals.map((a) => (
                <div
                  key={a.approvalId}
                  className="rounded-2xl border border-[var(--cazura-border)] bg-[var(--cazura-panel)] p-3 shadow-sm"
                >
                  <ApprovalDetails
                    toolName={a.toolName}
                    argumentsText={a.arguments}
                    categoriesById={categoriesById}
                  />
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      className="rounded-full px-4"
                      onClick={() => onResolveApproval(a.approvalId, "approve")}
                    >
                      Yes
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full px-4"
                      onClick={() => onResolveApproval(a.approvalId, "reject")}
                    >
                      No
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div
            className="flex flex-col gap-8 rounded-xl border p-3 shadow-[0px_4px_24px_rgba(0,0,0,0.05)]"
            style={{
              background: "var(--cazura-panel)",
              borderColor: "var(--cazura-border)",
            }}
          >
            <textarea
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="Ask any question..."
              rows={2}
              className={cn(
                "min-h-[48px] w-full resize-none border-0 bg-transparent text-sm font-medium outline-none placeholder:font-medium placeholder:text-[var(--cazura-label)]",
              )}
              style={{
                color: "var(--cazura-text)",
              }}
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-medium transition-colors hover:bg-[var(--cazura-canvas)]"
                  style={{
                    background: "var(--cazura-panel)",
                    borderColor: "var(--cazura-border)",
                    color: "var(--cazura-text)",
                  }}
                >
                  <Paperclip className="size-3" strokeWidth={2} />
                  Attach
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-medium transition-colors hover:bg-[var(--cazura-canvas)]"
                  style={{
                    background: "var(--cazura-panel)",
                    borderColor: "var(--cazura-border)",
                    color: "var(--cazura-text)",
                  }}
                >
                  <ImagePlus className="size-3" strokeWidth={2} />
                  Add Image
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-md p-1 transition-colors hover:bg-[var(--cazura-canvas)]"
                  style={{ color: "var(--cazura-text)" }}
                  aria-label="Voice input"
                >
                  <SoundWaveIcon className="size-4" />
                </button>
                <Button
                  type="button"
                  size="icon"
                  disabled={sending || input.trim().length === 0}
                  onClick={onSend}
                  className="size-8 rounded-md border-[#54767a] shadow-[0px_2px_12px_rgba(0,0,0,0.1)]"
                  style={{
                    background: "var(--cazura-teal)",
                    boxShadow:
                      "inset 0 0 4px rgba(255,255,255,0.5), 0px 2px 12px rgba(0,0,0,0.1)",
                  }}
                  aria-label="Send message"
                >
                  <ArrowUp className="size-4 text-white" strokeWidth={2.2} />
                </Button>
              </div>
            </div>
          </div>
          <p
            className="text-center text-xs font-medium"
            style={{ color: "var(--cazura-label)" }}
          >
            Cazura AI may make errors. Check important information.
          </p>
        </div>
      </div>
    </div>
  );
}
