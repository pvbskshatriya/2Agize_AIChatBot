"use client";

import { FormEvent, KeyboardEvent, useMemo, useState } from "react";

type ChatRole = "user" | "assistant";

type ChatItem = {
  id: string;
  role: ChatRole;
  content: string;
};

type ChatPanelProps = {
  apiUrl: string;
  compact?: boolean;
  authToken?: string;
};

export function ChatPanel({
  apiUrl,
  compact = false,
  authToken,
}: ChatPanelProps) {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const endpoint = useMemo(() => {
    return apiUrl.replace(/\/$/, "") + "/api/chat";
  }, [apiUrl]);

  async function send() {
    const message = draft.trim();
    if (!message || loading) {
      return;
    }

    const userItem: ChatItem = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
    };

    setItems((current) => [...current, userItem]);
    setDraft("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          message,
          conversationId: conversationId ?? undefined,
        }),
      });

      const payload = (await response.json()) as {
        answer?: string;
        conversationId?: string;
        error?: string;
      };

      if (!response.ok || !payload.answer) {
        throw new Error(payload.error || "Request failed");
      }

      if (payload.conversationId) {
        setConversationId(payload.conversationId);
      }

      setItems((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: payload.answer as string,
        },
      ]);
    } catch {
      setError("Could not send that message. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void send();
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: compact ? "100%" : "min(720px, calc(100vh - 48px))",
        maxWidth: compact ? "100%" : 720,
        margin: compact ? 0 : "24px auto",
        background: "#fff",
        border: "1px solid #e4e4e7",
        borderRadius: compact ? 16 : 12,
        overflow: "hidden",
      }}
    >
      <header
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid #e4e4e7",
          fontWeight: 600,
        }}
      >
        2Agize AI Assistant
      </header>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {items.length === 0 ? (
          <p style={{ color: "#71717a", margin: 0 }}>
            Ask in English, Swahili, or both. Typos are fine.
          </p>
        ) : null}

        {items.map((item) => (
          <div
            key={item.id}
            style={{
              alignSelf: item.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "85%",
              background: item.role === "user" ? "#18181b" : "#f4f4f5",
              color: item.role === "user" ? "#fff" : "#18181b",
              padding: "10px 12px",
              borderRadius: 12,
              whiteSpace: "pre-wrap",
            }}
          >
            <div
              style={{
                fontSize: 11,
                opacity: 0.7,
                marginBottom: 4,
                textTransform: "uppercase",
              }}
            >
              {item.role === "user" ? "You" : "AI"}
            </div>
            {item.content}
          </div>
        ))}

        {loading ? (
          <p style={{ color: "#71717a", margin: 0 }}>Thinking...</p>
        ) : null}
        {error ? (
          <p style={{ color: "#b91c1c", margin: 0 }}>{error}</p>
        ) : null}
      </div>

      <form
        onSubmit={onSubmit}
        style={{
          display: "flex",
          gap: 8,
          padding: 12,
          borderTop: "1px solid #e4e4e7",
        }}
      >
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type your message..."
          rows={compact ? 2 : 3}
          style={{
            flex: 1,
            resize: "none",
            border: "1px solid #d4d4d8",
            borderRadius: 8,
            padding: 10,
          }}
        />
        <button
          type="submit"
          disabled={loading || !draft.trim()}
          style={{
            border: 0,
            borderRadius: 8,
            background: "#18181b",
            color: "#fff",
            padding: "0 16px",
            cursor: loading ? "wait" : "pointer",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
