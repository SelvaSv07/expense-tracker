/**
 * Persists the in-memory AI chat only for this browser tab (sessionStorage).
 * Survives client-side navigation within the app; cleared when the tab/window is closed.
 */

const STORAGE_KEY = "cazura-ai-chat-session-v1";

export type PersistedChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  payload?: unknown;
  toolDataList?: unknown;
};

export type PersistedAiChatSession = {
  sessionId: string;
  messages: PersistedChatMessage[];
  input: string;
};

export function loadAiChatSession(): PersistedAiChatSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const rec = parsed as Record<string, unknown>;
    if (typeof rec.sessionId !== "string" || !Array.isArray(rec.messages)) return null;
    return {
      sessionId: rec.sessionId,
      messages: rec.messages as PersistedChatMessage[],
      input: typeof rec.input === "string" ? rec.input : "",
    };
  } catch {
    return null;
  }
}

export function saveAiChatSession(session: PersistedAiChatSession): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Quota or private mode
  }
}

export function clearAiChatSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
