"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { todayISO } from "@/lib/stats";

export function TradeForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    date: todayISO(),
    symbol: "",
    direction: "long",
    entryPrice: "",
    exitPrice: "",
    quantity: "",
    pnl: "",
    setup: "",
    notes: "",
    emotions: "",
    mistakes: "",
    lessons: "",
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/trades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to save trade");
      return;
    }

    router.refresh();
    setForm((f) => ({
      ...f,
      symbol: "",
      entryPrice: "",
      exitPrice: "",
      quantity: "",
      pnl: "",
      setup: "",
      notes: "",
      emotions: "",
      mistakes: "",
      lessons: "",
    }));
  }

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <h2 className="font-semibold text-lg">Log a Trade</h2>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="date">Date</label>
          <input id="date" type="date" value={form.date} onChange={(e) => update("date", e.target.value)} required />
        </div>
        <div>
          <label htmlFor="symbol">Symbol</label>
          <input id="symbol" placeholder="AAPL, ES, BTC..." value={form.symbol} onChange={(e) => update("symbol", e.target.value)} required />
        </div>
        <div>
          <label htmlFor="direction">Direction</label>
          <select id="direction" value={form.direction} onChange={(e) => update("direction", e.target.value)}>
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
        </div>
        <div>
          <label htmlFor="pnl">P&L ($)</label>
          <input id="pnl" type="number" step="0.01" placeholder="Auto-calcs if blank" value={form.pnl} onChange={(e) => update("pnl", e.target.value)} />
        </div>
        <div>
          <label htmlFor="entryPrice">Entry Price</label>
          <input id="entryPrice" type="number" step="any" value={form.entryPrice} onChange={(e) => update("entryPrice", e.target.value)} />
        </div>
        <div>
          <label htmlFor="exitPrice">Exit Price</label>
          <input id="exitPrice" type="number" step="any" value={form.exitPrice} onChange={(e) => update("exitPrice", e.target.value)} />
        </div>
        <div>
          <label htmlFor="quantity">Quantity</label>
          <input id="quantity" type="number" step="any" value={form.quantity} onChange={(e) => update("quantity", e.target.value)} />
        </div>
        <div>
          <label htmlFor="setup">Setup / Strategy</label>
          <input id="setup" placeholder="Breakout, VWAP reclaim..." value={form.setup} onChange={(e) => update("setup", e.target.value)} />
        </div>
      </div>

      <div>
        <label htmlFor="notes">Trade Notes</label>
        <textarea id="notes" placeholder="What happened? Why did you take this trade?" value={form.notes} onChange={(e) => update("notes", e.target.value)} />
      </div>
      <div>
        <label htmlFor="emotions">Emotions</label>
        <textarea id="emotions" placeholder="Confident, FOMO, revenge trading..." value={form.emotions} onChange={(e) => update("emotions", e.target.value)} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="mistakes">Mistakes</label>
          <textarea id="mistakes" placeholder="What would you do differently?" value={form.mistakes} onChange={(e) => update("mistakes", e.target.value)} />
        </div>
        <div>
          <label htmlFor="lessons">Lessons</label>
          <textarea id="lessons" placeholder="What did you learn?" value={form.lessons} onChange={(e) => update("lessons", e.target.value)} />
        </div>
      </div>

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Saving..." : "Save Trade"}
      </button>
    </form>
  );
}
