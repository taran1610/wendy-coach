"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { JournalEntry } from "@/lib/types";
import { todayISO } from "@/lib/stats";

export function JournalForm({ initial }: { initial?: JournalEntry }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    date: initial?.date ?? todayISO(),
    marketNotes: initial?.marketNotes ?? "",
    pnlNotes: initial?.pnlNotes ?? "",
    mood: initial?.mood ?? "",
    goals: initial?.goals ?? "",
    reflections: initial?.reflections ?? "",
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSaved(false);

    const res = await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to save journal");
      return;
    }

    setSaved(true);
    router.refresh();
  }

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-lg">Daily Journal</h2>
        {saved ? <span className="text-xs text-[var(--accent)]">Saved ✓</span> : null}
      </div>

      <div>
        <label htmlFor="journal-date">Date</label>
        <input
          id="journal-date"
          type="date"
          value={form.date}
          onChange={(e) => update("date", e.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="marketNotes">Market Notes</label>
        <textarea
          id="marketNotes"
          placeholder="How was the market today? Trend, volatility, key levels..."
          value={form.marketNotes}
          onChange={(e) => update("marketNotes", e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="pnlNotes">P&L & Performance Notes</label>
        <textarea
          id="pnlNotes"
          placeholder="How did you perform? Did you follow your plan? Size correctly?"
          value={form.pnlNotes}
          onChange={(e) => update("pnlNotes", e.target.value)}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="mood">Mood / Mindset</label>
          <input
            id="mood"
            placeholder="Calm, anxious, overconfident..."
            value={form.mood}
            onChange={(e) => update("mood", e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="goals">Tomorrow&apos;s Goals</label>
          <input
            id="goals"
            placeholder="Max 2 trades, wait for A+ setup..."
            value={form.goals}
            onChange={(e) => update("goals", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label htmlFor="reflections">Free Reflection</label>
        <textarea
          id="reflections"
          placeholder="Anything else on your mind — Wendy reads this too."
          value={form.reflections}
          onChange={(e) => update("reflections", e.target.value)}
          className="min-h-[10rem]"
        />
      </div>

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Saving..." : "Save Journal"}
      </button>
    </form>
  );
}
