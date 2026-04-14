"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowUp,
  BarChart2,
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

export function AiAssistantCanvas({
  chatCollapsed,
  onExpandChat,
  messages,
  input,
  onInputChange,
  onSend,
  sending,
  approvals,
  onResolveApproval,
  error,
}: {
  chatCollapsed: boolean;
  onExpandChat: () => void;
  messages: { id: string; role: "user" | "assistant"; content: string }[];
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  sending: boolean;
  approvals: { approvalId: string; toolName: string; arguments: string }[];
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
                {m.content}
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
                  className="rounded-lg border border-[var(--cazura-border)] bg-[var(--cazura-panel)] p-3"
                >
                  <p className="text-sm font-semibold text-[var(--cazura-text)]">
                    Approval needed: {a.toolName}
                  </p>
                  <p className="mt-1 text-xs text-[var(--cazura-muted)] break-all">
                    {a.arguments}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => onResolveApproval(a.approvalId, "approve")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onResolveApproval(a.approvalId, "reject")}
                    >
                      Reject
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
