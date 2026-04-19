"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AiAssistantCanvas } from "./ai-assistant-canvas";
import { assistantUiOutputSchema, type AssistantUiOutput } from "@/lib/ai/output";
import {
  assistantToolDataSchema,
  type AssistantToolDataList,
} from "@/lib/ai/tool-ui";
import {
  clearAiChatSession,
  loadAiChatSession,
  saveAiChatSession,
  type PersistedChatMessage,
} from "@/lib/ai/client-chat-session";
import { cn } from "@/lib/utils";
import { useEffect, useLayoutEffect, useState } from "react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  payload?: AssistantUiOutput | null;
  toolDataList?: AssistantToolDataList;
};

type Approval = {
  approvalId: string;
  toolName: string;
  arguments: string;
};

type AiCategory = {
  id: string;
  name: string;
  icon: string | null;
  color: string;
  type: string;
};

function randomId() {
  return crypto.randomUUID();
}

export function AiAssistantShell() {
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [categoriesById, setCategoriesById] = useState<Record<string, AiCategory>>({});
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);

  useLayoutEffect(() => {
    const loaded = loadAiChatSession();
    if (loaded) {
      setSessionId(loaded.sessionId);
      setMessages(loaded.messages as ChatMessage[]);
      setInput(loaded.input);
    }
    setSessionReady(true);
  }, []);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/ai/categories");
      if (!res.ok) return;
      const json = await res.json();
      const list = (json.categories ?? []) as AiCategory[];
      const map: Record<string, AiCategory> = {};
      for (const c of list) map[c.id] = c;
      setCategoriesById(map);
    })();
  }, []);

  useEffect(() => {
    if (!sessionReady) return;
    saveAiChatSession({
      sessionId,
      messages: messages as unknown as PersistedChatMessage[],
      input,
    });
  }, [sessionReady, sessionId, messages, input]);

  function requestNewChat() {
    if (messages.length === 0) {
      confirmNewChat();
      return;
    }
    setNewChatDialogOpen(true);
  }

  function confirmNewChat() {
    clearAiChatSession();
    setSessionId(crypto.randomUUID());
    setMessages([]);
    setApprovals([]);
    setError(null);
    setInput("");
    setNewChatDialogOpen(false);
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;
    if (approvals.length > 0) {
      const normalized = text.toLowerCase();
      if (["approve", "yes", "y"].includes(normalized)) {
        setInput("");
        await resolveApproval(approvals[0]!.approvalId, "approve");
        return;
      }
      if (["reject", "no", "n"].includes(normalized)) {
        setInput("");
        await resolveApproval(approvals[0]!.approvalId, "reject");
        return;
      }
    }
    setSending(true);
    setError(null);
    setApprovals([]);
    setInput("");

    const userMsg: ChatMessage = { id: randomId(), role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);

    const transcript = nextMessages.map(({ role, content }) => ({ role, content }));

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: sessionId,
          messages: transcript,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(String(json.error ?? "AI request failed"));
        return;
      }
      await consumeSse(res);
    } finally {
      setSending(false);
    }
  }

  async function resolveApproval(approvalId: string, decision: "approve" | "reject") {
    if (sending) return;
    setSending(true);
    setError(null);
    setApprovals((prev) => prev.filter((a) => a.approvalId !== approvalId));
    try {
      const res = await fetch("/api/ai/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalId, decision }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(String(json.error ?? "Approval request failed"));
        return;
      }
      await consumeSse(res);
    } finally {
      setSending(false);
    }
  }

  async function consumeSse(response: Response) {
    const reader = response.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();
    let buffer = "";
    let draftAssistantId: string | null = null;

    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });

      while (true) {
        const boundary = buffer.indexOf("\n\n");
        if (boundary === -1) break;
        const eventBlock = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        const lines = eventBlock.split("\n");
        const event = lines.find((l) => l.startsWith("event: "))?.slice(7).trim();
        const dataRaw = lines.find((l) => l.startsWith("data: "))?.slice(6);
        if (!event || !dataRaw) continue;

        const payload = JSON.parse(dataRaw);
        if (event === "meta") {
          /* session id is client-owned; server echoes the same id */
        } else if (event === "token") {
          const token = String(payload.value ?? "");
          if (!token) continue;
          setMessages((prev) => {
            if (!draftAssistantId) {
              draftAssistantId = randomId();
              return [...prev, { id: draftAssistantId, role: "assistant", content: token }];
            }
            return prev.map((m) =>
              m.id === draftAssistantId ? { ...m, content: `${m.content}${token}` } : m,
            );
          });
        } else if (event === "assistant") {
          const content = String(payload.content ?? "");
          if (!content) continue;
          setMessages((prev) => {
            if (draftAssistantId) {
              return prev.map((m) =>
                m.id === draftAssistantId ? { ...m, content } : m,
              );
            }
            return [...prev, { id: randomId(), role: "assistant", content }];
          });
        } else if (event === "assistant_payload") {
          const parsed = assistantUiOutputSchema.safeParse(payload.payload);
          if (!parsed.success) continue;
          setMessages((prev) => {
            if (draftAssistantId) {
              return prev.map((m) =>
                m.id === draftAssistantId ? { ...m, payload: parsed.data } : m,
              );
            }
            if (prev.length === 0) return prev;
            const last = prev[prev.length - 1];
            if (last?.role !== "assistant") return prev;
            return prev.map((m, idx) =>
              idx === prev.length - 1 ? { ...m, payload: parsed.data } : m,
            );
          });
        } else if (event === "assistant_tool_data") {
          const rawList = Array.isArray(payload.toolDataList)
            ? payload.toolDataList
            : [payload.toolDataList];
          const parsedList: AssistantToolDataList = [];
          for (const entry of rawList as unknown[]) {
            const parsed = assistantToolDataSchema.safeParse(entry);
            if (parsed.success) parsedList.push(parsed.data);
          }
          if (parsedList.length === 0) continue;
          setMessages((prev) => {
            if (draftAssistantId) {
              return prev.map((m) =>
                m.id === draftAssistantId
                  ? {
                      ...m,
                      toolDataList: [...(m.toolDataList ?? []), ...parsedList],
                    }
                  : m,
              );
            }
            if (prev.length === 0) return prev;
            const last = prev[prev.length - 1];
            if (last?.role !== "assistant") return prev;
            return prev.map((m, idx) =>
              idx === prev.length - 1
                ? {
                    ...m,
                    toolDataList: [...(m.toolDataList ?? []), ...parsedList],
                  }
                : m,
            );
          });
        } else if (event === "interruptions") {
          setApprovals((payload.approvals ?? []) as Approval[]);
        } else if (event === "error") {
          setError(String(payload.message ?? "AI request failed"));
        }
      }
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <AiAssistantCanvas
        onNewChat={requestNewChat}
        messages={messages}
        input={input}
        onInputChange={setInput}
        onSend={sendMessage}
        sending={sending}
        approvals={approvals}
        categoriesById={categoriesById}
        onResolveApproval={resolveApproval}
        error={error}
      />

      <Dialog open={newChatDialogOpen} onOpenChange={setNewChatDialogOpen}>
        <DialogContent
          className="border-[var(--cazura-border)] bg-[var(--cazura-panel)] text-[var(--cazura-text)] ring-[var(--cazura-border)] sm:max-w-md"
          showCloseButton
        >
          <DialogHeader>
            <DialogTitle>Clear chat history?</DialogTitle>
            <DialogDescription style={{ color: "var(--cazura-muted)" }}>
              All messages in this conversation will be removed. This cannot be undone. Your chat
              is only kept in this browser tab until you close it or clear it here.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className={cn(
                "cursor-pointer",
                "border-[var(--cazura-border)] bg-[var(--cazura-panel)] text-[var(--cazura-text)] hover:bg-[var(--cazura-canvas)]",
              )}
              onClick={() => setNewChatDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="cursor-pointer"
              onClick={confirmNewChat}
            >
              Clear and start new
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
