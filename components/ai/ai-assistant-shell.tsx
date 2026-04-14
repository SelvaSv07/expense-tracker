"use client";

import { useEffect, useState } from "react";
import { AiAssistantCanvas } from "./ai-assistant-canvas";
import { AiChatSidebar } from "./ai-chat-sidebar";

type Conversation = {
  id: string;
  title: string;
  updatedAt: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type Approval = {
  approvalId: string;
  toolName: string;
  arguments: string;
};

function randomId() {
  return crypto.randomUUID();
}

export function AiAssistantShell() {
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/ai/conversations");
      if (!res.ok) return;
      const json = await res.json();
      const list = (json.conversations ?? []) as Conversation[];
      setConversations(list);
      if (list.length > 0) {
        setActiveConversationId(list[0].id);
      }
    })();
  }, []);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    void (async () => {
      const res = await fetch(`/api/ai/conversations/${activeConversationId}/messages`);
      if (!res.ok) return;
      const json = await res.json();
      const list = (json.messages ?? []) as {
        id: string;
        role: "user" | "assistant" | "tool" | "system";
        content: string;
      }[];
      const visible = list.filter(
        (m): m is { id: string; role: "user" | "assistant"; content: string } =>
          m.role === "user" || m.role === "assistant",
      );
      setMessages(
        visible.map((m) => ({ id: m.id, role: m.role, content: m.content })),
      );
    })();
  }, [activeConversationId]);

  async function refreshConversations(nextActive?: string) {
    const res = await fetch("/api/ai/conversations");
    if (!res.ok) return;
    const json = await res.json();
    const list = (json.conversations ?? []) as Conversation[];
    setConversations(list);
    if (nextActive) setActiveConversationId(nextActive);
    else if (!activeConversationId && list.length > 0) setActiveConversationId(list[0].id);
  }

  async function createNewConversation() {
    setError(null);
    const res = await fetch("/api/ai/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!res.ok) return;
    const json = await res.json();
    const id = json.conversationId as string;
    await refreshConversations(id);
    setMessages([]);
    setApprovals([]);
  }

  async function consumeSse(response: Response) {
    const reader = response.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();
    let buf = "";
    let draftAssistantId: string | null = null;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buf += decoder.decode(chunk.value, { stream: true });

      while (true) {
        const split = buf.indexOf("\n\n");
        if (split === -1) break;
        const rawEvent = buf.slice(0, split);
        buf = buf.slice(split + 2);

        const lines = rawEvent.split("\n");
        const eventLine = lines.find((l) => l.startsWith("event: "));
        const dataLine = lines.find((l) => l.startsWith("data: "));
        if (!eventLine || !dataLine) continue;
        const eventName = eventLine.slice(7).trim();
        const data = JSON.parse(dataLine.slice(6));

        if (eventName === "meta" && data.conversationId) {
          setActiveConversationId(data.conversationId);
          void refreshConversations(data.conversationId);
        } else if (eventName === "token") {
          const value = String(data.value ?? "");
          if (!value) continue;
          setMessages((prev) => {
            if (!draftAssistantId) {
              draftAssistantId = randomId();
              return [...prev, { id: draftAssistantId, role: "assistant", content: value }];
            }
            return prev.map((m) =>
              m.id === draftAssistantId ? { ...m, content: `${m.content}${value}` } : m,
            );
          });
        } else if (eventName === "assistant") {
          const content = String(data.content ?? "");
          if (!content) continue;
          if (draftAssistantId) {
            setMessages((prev) =>
              prev.map((m) => (m.id === draftAssistantId ? { ...m, content } : m)),
            );
          } else {
            setMessages((prev) => [...prev, { id: randomId(), role: "assistant", content }]);
          }
        } else if (eventName === "interruptions") {
          setApprovals(data.approvals ?? []);
        } else if (eventName === "error") {
          setError(String(data.message ?? "AI request failed"));
        }
      }
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    setApprovals([]);
    setInput("");
    setMessages((prev) => [...prev, { id: randomId(), role: "user", content: text }]);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationId: activeConversationId ?? undefined,
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

  return (
    <div
      className="-mx-4 -mt-4 flex min-h-[calc(100svh-7.5rem)] flex-col overflow-hidden md:flex-row"
      style={{ background: "var(--cazura-panel)" }}
    >
      <AiChatSidebar
        collapsed={chatCollapsed}
        onToggleCollapse={() => setChatCollapsed((c) => !c)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversationId}
        onCreateConversation={createNewConversation}
      />
      <AiAssistantCanvas
        chatCollapsed={chatCollapsed}
        onExpandChat={() => setChatCollapsed(false)}
        messages={messages}
        input={input}
        onInputChange={setInput}
        onSend={sendMessage}
        sending={sending}
        approvals={approvals}
        onResolveApproval={resolveApproval}
        error={error}
      />
    </div>
  );
}
