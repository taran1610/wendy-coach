"use client";

import { FormEvent, useState } from "react";
import type { CoachReview } from "@/lib/types";
import { todayISO } from "@/lib/stats";

export function CoachPanel({ initialReview }: { initialReview?: CoachReview | null }) {
  const [date, setDate] = useState(todayISO());
  const [review, setReview] = useState<CoachReview | null>(initialReview ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "wendy"; text: string }[]>([]);

  async function generateReview() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to generate review");
      return;
    }

    setReview(await res.json());
  }

  async function sendChat(e: FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    setMessages((m) => [...m, { role: "user", text: userMsg }]);
    setChatLoading(true);
    setError("");

    const res = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "chat", message: userMsg, date }),
    });

    setChatLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Chat failed");
      return;
    }

    const data = await res.json();
    setMessages((m) => [...m, { role: "wendy", text: data.reply }]);
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="review-date">Review date</label>
            <input
              id="review-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <button type="button" className="btn btn-primary" onClick={generateReview} disabled={loading}>
            {loading ? "Wendy is analyzing..." : "Generate End-of-Day Review"}
          </button>
        </div>
        <p className="text-xs text-[var(--muted)] mt-3">
          Wendy uses RAG — she retrieves relevant past trades & journals, then coaches you on
          strengths, weaknesses, and action items.
        </p>
        {error ? <p className="text-sm text-[var(--danger)] mt-3">{error}</p> : null}
      </div>

      {review ? (
        <div className="space-y-4">
          <article className="card border-[color-mix(in_srgb,var(--accent)_25%,var(--card-border))]">
            <p className="text-xs uppercase tracking-wider text-[var(--gold)] mb-2">
              Wendy&apos;s Daily Review — {review.date}
            </p>
            <p className="leading-relaxed">{review.summary}</p>
          </article>

          <div className="grid md:grid-cols-2 gap-4">
            <article className="card">
              <h3 className="font-semibold text-[var(--accent)] mb-3">Strengths</h3>
              <ul className="space-y-2 text-sm">
                {review.strengths.map((s) => (
                  <li key={s} className="flex gap-2">
                    <span className="text-[var(--accent)]">+</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="card">
              <h3 className="font-semibold text-[var(--danger)] mb-3">Where You&apos;re Lagging</h3>
              <ul className="space-y-2 text-sm">
                {review.weaknesses.map((s) => (
                  <li key={s} className="flex gap-2">
                    <span className="text-[var(--danger)]">−</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <article className="card">
            <h3 className="font-semibold text-[var(--gold)] mb-3">Action Items for Tomorrow</h3>
            <ul className="space-y-2 text-sm">
              {review.actionItems.map((s, i) => (
                <li key={s} className="flex gap-2">
                  <span className="text-[var(--muted)] font-mono">{i + 1}.</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="card bg-[color-mix(in_srgb,var(--accent)_8%,var(--card))]">
            <p className="text-sm italic leading-relaxed">{review.encouragement}</p>
          </article>
        </div>
      ) : null}

      <div className="card space-y-4">
        <h2 className="font-semibold">Chat with Wendy</h2>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              Ask Wendy anything — &quot;Why do I keep losing on reversals?&quot; or &quot;What
              should I focus on tomorrow?&quot;
            </p>
          ) : null}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`rounded-xl p-3 text-sm ${
                msg.role === "wendy"
                  ? "bg-[color-mix(in_srgb,var(--accent)_10%,#152033)] border border-[color-mix(in_srgb,var(--accent)_20%,transparent)]"
                  : "bg-[#152033]"
              }`}
            >
              <p className="text-xs text-[var(--muted)] mb-1">
                {msg.role === "wendy" ? "Wendy" : "You"}
              </p>
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          ))}
          {chatLoading ? (
            <p className="text-sm text-[var(--muted)]">Wendy is thinking...</p>
          ) : null}
        </div>

        <form onSubmit={sendChat} className="flex gap-2">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask Wendy for coaching advice..."
            disabled={chatLoading}
          />
          <button type="submit" className="btn btn-secondary shrink-0" disabled={chatLoading}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
