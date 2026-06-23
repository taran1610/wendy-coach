"use client";

import { useRouter } from "next/navigation";
import type { Trade } from "@/lib/types";
import { formatCurrency } from "@/lib/stats";

export function TradeList({ trades }: { trades: Trade[] }) {
  const router = useRouter();

  async function remove(id: string) {
    if (!confirm("Delete this trade?")) return;
    await fetch(`/api/trades?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  if (trades.length === 0) {
    return (
      <div className="card text-sm text-[var(--muted)]">
        No trades logged yet. Use the form to add your first one.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {trades.map((trade) => (
        <article key={trade.id} className="card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{trade.symbol}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--hover-bg)] capitalize">
                  {trade.direction}
                </span>
                <span className="text-xs text-[var(--muted)] font-mono">{trade.date}</span>
              </div>
              <p className={`font-mono text-xl mt-1 ${trade.pnl >= 0 ? "pnl-positive" : "pnl-negative"}`}>
                {formatCurrency(trade.pnl)}
              </p>
            </div>
            <button type="button" className="btn btn-danger text-xs" onClick={() => remove(trade.id)}>
              Delete
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-3 mt-4 text-sm">
            {trade.setup ? <p><span className="text-[var(--muted)]">Setup:</span> {trade.setup}</p> : null}
            {trade.notes ? <p><span className="text-[var(--muted)]">Notes:</span> {trade.notes}</p> : null}
            {trade.emotions ? <p><span className="text-[var(--muted)]">Emotions:</span> {trade.emotions}</p> : null}
            {trade.mistakes ? <p><span className="text-[var(--muted)]">Mistakes:</span> {trade.mistakes}</p> : null}
            {trade.lessons ? <p><span className="text-[var(--muted)]">Lessons:</span> {trade.lessons}</p> : null}
          </div>
        </article>
      ))}
    </div>
  );
}
