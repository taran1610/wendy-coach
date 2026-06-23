"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { todayISO } from "@/lib/stats";

type ChatMessage = { role: "user" | "assistant"; content: string };

export function CoachPanel() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function resizeTextarea() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }

  async function sendMessage(e?: FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = { role: "user", content: text };
    const nextMessages = [...messages, userMessage];

    setInput("");
    setError("");
    setMessages(nextMessages);
    setLoading(true);
    resizeTextarea();

    const res = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        date: todayISO(),
        history: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong. Try again.");
      setMessages(messages);
      setInput(text);
      return;
    }

    const data = await res.json();
    setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-2.5rem)] lg:h-[calc(100dvh-4rem)] -m-5 lg:-m-8">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
          {messages.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--gold)] flex items-center justify-center text-[var(--accent-on-gradient)] font-bold text-2xl mb-4">
                W
              </div>
              <h1 className="text-2xl font-semibold mb-2">Wendy Coach</h1>
              <p className="text-[var(--muted)] max-w-md text-sm">
                Ask anything about your trading — mindset, setups, mistakes, or what to focus on
                tomorrow.
              </p>
            </div>
          ) : null}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" ? (
                <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--gold)] flex items-center justify-center text-[var(--accent-on-gradient)] font-bold text-sm">
                  W
                </div>
              ) : null}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-[var(--hover-bg)] text-[var(--foreground)]"
                    : "bg-transparent text-[var(--foreground)]"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading ? (
            <div className="flex gap-4">
              <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--gold)] flex items-center justify-center text-[var(--accent-on-gradient)] font-bold text-sm">
                W
              </div>
              <p className="text-sm text-[var(--muted)] py-2">Wendy is thinking...</p>
            </div>
          ) : null}

          {error ? <p className="text-sm text-[var(--danger)] text-center">{error}</p> : null}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-[var(--card-border)] bg-[color-mix(in_srgb,var(--background)_95%,transparent)] backdrop-blur-sm p-4">
        <form
          onSubmit={sendMessage}
          className="mx-auto max-w-3xl flex items-end gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 shadow-sm"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              resizeTextarea();
            }}
            onKeyDown={onKeyDown}
            placeholder="Message Wendy..."
            rows={1}
            disabled={loading}
            className="min-h-[24px] max-h-[200px] resize-none border-0 bg-transparent p-0 focus:outline-none focus:ring-0"
          />
          <button
            type="submit"
            className="btn btn-primary shrink-0 rounded-xl px-4 py-2 text-sm disabled:opacity-40"
            disabled={loading || !input.trim()}
          >
            Send
          </button>
        </form>
        <p className="mx-auto max-w-3xl mt-2 text-center text-xs text-[var(--muted)]">
          Wendy uses your trades and journal history to give personalized coaching.
        </p>
      </div>
    </div>
  );
}
