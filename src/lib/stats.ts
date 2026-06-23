import type { DayStats, Trade, TradeStats } from "./types";

export function computeTradeStats(trades: Trade[]): TradeStats {
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      wins: 0,
      losses: 0,
      breakeven: 0,
      winRate: 0,
      totalPnl: 0,
      avgWin: 0,
      avgLoss: 0,
      bestTrade: 0,
      worstTrade: 0,
    };
  }

  const wins = trades.filter((t) => t.outcome === "win");
  const losses = trades.filter((t) => t.outcome === "loss");
  const breakeven = trades.filter((t) => t.outcome === "breakeven");
  const pnls = trades.map((t) => t.pnl);
  const winPnls = wins.map((t) => t.pnl);
  const lossPnls = losses.map((t) => t.pnl);

  return {
    totalTrades: trades.length,
    wins: wins.length,
    losses: losses.length,
    breakeven: breakeven.length,
    winRate: wins.length / trades.length,
    totalPnl: pnls.reduce((a, b) => a + b, 0),
    avgWin: winPnls.length ? winPnls.reduce((a, b) => a + b, 0) / winPnls.length : 0,
    avgLoss: lossPnls.length ? lossPnls.reduce((a, b) => a + b, 0) / lossPnls.length : 0,
    bestTrade: Math.max(...pnls),
    worstTrade: Math.min(...pnls),
  };
}

export function computeDayStats(date: string, trades: Trade[]): DayStats {
  return { date, ...computeTradeStats(trades) };
}

export function formatCurrency(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}$${value.toFixed(2)}`;
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function statsSummary(stats: TradeStats): string {
  return [
    `Total trades: ${stats.totalTrades}`,
    `Win rate: ${formatPercent(stats.winRate)}`,
    `Total P&L: ${formatCurrency(stats.totalPnl)}`,
    `Avg win: ${formatCurrency(stats.avgWin)}`,
    `Avg loss: ${formatCurrency(stats.avgLoss)}`,
    `Best trade: ${formatCurrency(stats.bestTrade)}`,
    `Worst trade: ${formatCurrency(stats.worstTrade)}`,
  ].join("\n");
}
