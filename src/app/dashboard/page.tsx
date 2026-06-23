import Link from "next/link";
import { StatCard } from "@/components/StatCard";
import { listTrades } from "@/lib/db";
import {
  computeDayStats,
  computeTradeStats,
  formatCurrency,
  formatPercent,
  todayISO,
} from "@/lib/stats";

export default async function DashboardPage() {
  const today = todayISO();
  const allTrades = await listTrades();
  const todayTrades = allTrades.filter((t) => t.date === today);
  const dayStats = computeDayStats(today, todayTrades);
  const allStats = computeTradeStats(allTrades);
  const recentTrades = allTrades.slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--muted)]">Welcome back, trader</p>
          <h1 className="text-3xl font-semibold mt-1">Dashboard</h1>
          <p className="text-[var(--muted)] mt-2 max-w-xl">
            Track today&apos;s performance, log trades, and let Wendy analyze your patterns at
            end of day.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/trades" className="btn btn-primary">
            Log Trade
          </Link>
          <Link href="/coach" className="btn btn-secondary">
            Talk to Wendy
          </Link>
        </div>
      </header>

      <section>
        <h2 className="text-sm uppercase tracking-wider text-[var(--muted)] mb-3">
          Today — {today}
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Today's P&L"
            value={formatCurrency(dayStats.totalPnl)}
            tone={dayStats.totalPnl >= 0 ? "positive" : "negative"}
          />
          <StatCard label="Trades" value={String(dayStats.totalTrades)} />
          <StatCard
            label="Win Rate"
            value={formatPercent(dayStats.winRate)}
            tone="gold"
          />
          <StatCard
            label="W / L"
            value={`${dayStats.wins} / ${dayStats.losses}`}
            sub={`${dayStats.breakeven} breakeven`}
          />
        </div>
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-wider text-[var(--muted)] mb-3">
          All-time
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total P&L"
            value={formatCurrency(allStats.totalPnl)}
            tone={allStats.totalPnl >= 0 ? "positive" : "negative"}
          />
          <StatCard label="Total Trades" value={String(allStats.totalTrades)} />
          <StatCard label="Win Rate" value={formatPercent(allStats.winRate)} tone="gold" />
          <StatCard
            label="Avg Win / Loss"
            value={`${formatCurrency(allStats.avgWin)} / ${formatCurrency(allStats.avgLoss)}`}
          />
        </div>
      </section>

      <section className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Recent Trades</h2>
          <Link href="/trades" className="text-sm text-[var(--accent)] hover:underline">
            View all
          </Link>
        </div>

        {recentTrades.length === 0 ? (
          <p className="text-[var(--muted)] text-sm">
            No trades yet.{" "}
            <Link href="/trades" className="text-[var(--accent)] hover:underline">
              Log your first trade
            </Link>
            .
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--muted)] border-b border-[var(--card-border)]">
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2 pr-4">Symbol</th>
                  <th className="pb-2 pr-4">Dir</th>
                  <th className="pb-2 pr-4">P&L</th>
                  <th className="pb-2">Outcome</th>
                </tr>
              </thead>
              <tbody>
                {recentTrades.map((trade) => (
                  <tr key={trade.id} className="border-b border-[var(--card-border)]/50">
                    <td className="py-3 pr-4 font-mono text-xs">{trade.date}</td>
                    <td className="py-3 pr-4 font-semibold">{trade.symbol}</td>
                    <td className="py-3 pr-4 capitalize">{trade.direction}</td>
                    <td
                      className={`py-3 pr-4 font-mono ${
                        trade.pnl >= 0 ? "pnl-positive" : "pnl-negative"
                      }`}
                    >
                      {formatCurrency(trade.pnl)}
                    </td>
                    <td className="py-3 capitalize">{trade.outcome}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
