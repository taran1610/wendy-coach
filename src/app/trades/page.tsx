import { TradeForm } from "@/components/TradeForm";
import { TradeList } from "@/components/TradeList";
import { listTrades } from "@/lib/db";

export default async function TradesPage() {
  const trades = await listTrades();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">Trades</h1>
        <p className="text-[var(--muted)] mt-2">
          Log every trade with setup, emotions, and lessons — Wendy uses this for RAG coaching.
        </p>
      </header>

      <TradeForm />
      <TradeList trades={trades} />
    </div>
  );
}
