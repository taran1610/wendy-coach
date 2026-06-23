import { indexTradeEmbedding } from "@/lib/coach";
import { requireUser } from "@/lib/supabase/server";
import type { TradeDirection } from "@/lib/types";
import {
  fetchTradovateContracts,
  fetchTradovateFillPairs,
  fetchTradovateFills,
  type TradovateContract,
  type TradovateFill,
  type TradovateFillPair,
} from "./client";
import { getValidTradovateAccessToken, markTradovateSynced } from "./connection";

function tradeDateToISO(
  tradeDate: TradovateFill["tradeDate"],
  fallbackTimestamp?: string
): string {
  if (typeof tradeDate === "object" && tradeDate !== null && "year" in tradeDate) {
    const month = String(tradeDate.month).padStart(2, "0");
    const day = String(tradeDate.day).padStart(2, "0");
    return `${tradeDate.year}-${month}-${day}`;
  }

  if (typeof tradeDate === "string" && tradeDate.length >= 10) {
    return tradeDate.slice(0, 10);
  }

  if (fallbackTimestamp) {
    return new Date(fallbackTimestamp).toISOString().slice(0, 10);
  }

  return new Date().toISOString().slice(0, 10);
}

function computePnl(
  entryPrice: number,
  exitPrice: number,
  qty: number,
  direction: TradeDirection,
  contract?: TradovateContract
): number {
  const priceDiff = direction === "long" ? exitPrice - entryPrice : entryPrice - exitPrice;

  if (contract?.tickSize && contract.tickValue && contract.tickSize > 0) {
    return (priceDiff / contract.tickSize) * contract.tickValue * qty;
  }

  if (contract?.contractSize) {
    return priceDiff * contract.contractSize * qty;
  }

  return priceDiff * qty;
}

function pairToTrade(
  pair: TradovateFillPair,
  fillMap: Map<number, TradovateFill>,
  contractMap: Map<number, TradovateContract>
) {
  const buyFill = fillMap.get(pair.buyFillId);
  const sellFill = fillMap.get(pair.sellFillId);
  const fill = buyFill ?? sellFill;

  if (!fill) return null;

  const contract = contractMap.get(fill.contractId);
  const symbol = contract?.name ?? `CONTRACT-${fill.contractId}`;

  const buyTime = buyFill?.timestamp ? new Date(buyFill.timestamp).getTime() : 0;
  const sellTime = sellFill?.timestamp ? new Date(sellFill.timestamp).getTime() : 0;
  const isLong = buyTime <= sellTime || !sellFill?.timestamp;

  const entryPrice = isLong ? pair.buyPrice : pair.sellPrice;
  const exitPrice = isLong ? pair.sellPrice : pair.buyPrice;
  const direction: TradeDirection = isLong ? "long" : "short";
  const pnl = computePnl(entryPrice, exitPrice, pair.qty, direction, contract);
  const date = tradeDateToISO(
    buyFill?.tradeDate ?? sellFill?.tradeDate,
    buyFill?.timestamp ?? sellFill?.timestamp
  );

  return {
    externalId: `tradovate:fillpair:${pair.id}`,
    date,
    symbol,
    direction,
    entryPrice,
    exitPrice,
    quantity: pair.qty,
    pnl,
    setup: "Tradovate sync",
    notes: `Imported from Tradovate fill pair #${pair.id}`,
    emotions: "",
    mistakes: "",
    lessons: "",
    outcome: pnl > 0 ? ("win" as const) : pnl < 0 ? ("loss" as const) : ("breakeven" as const),
  };
}

export async function upsertTradovateTrade(input: {
  externalId: string;
  date: string;
  symbol: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  setup: string;
  notes: string;
  emotions: string;
  mistakes: string;
  lessons: string;
  outcome: "win" | "loss" | "breakeven";
}): Promise<{ created: boolean; id: string }> {
  const { supabase, user } = await requireUser();

  const { data: existing } = await supabase
    .from("trades")
    .select("id")
    .eq("user_id", user.id)
    .eq("external_id", input.externalId)
    .maybeSingle();

  if (existing?.id) {
    return { created: false, id: existing.id };
  }

  const { data, error } = await supabase
    .from("trades")
    .insert({
      user_id: user.id,
      date: input.date,
      symbol: input.symbol,
      direction: input.direction,
      entry_price: input.entryPrice,
      exit_price: input.exitPrice,
      quantity: input.quantity,
      pnl: input.pnl,
      setup: input.setup,
      notes: input.notes,
      emotions: input.emotions,
      mistakes: input.mistakes,
      lessons: input.lessons,
      outcome: input.outcome,
      source: "tradovate",
      external_id: input.externalId,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  try {
    await indexTradeEmbedding(data.id);
  } catch {
    // Embeddings optional without OpenAI key
  }

  return { created: true, id: data.id };
}

export async function syncTradovateTrades(): Promise<{
  imported: number;
  skipped: number;
  totalPairs: number;
}> {
  const { accessToken, environment } = await getValidTradovateAccessToken();

  const [fills, fillPairs, contracts] = await Promise.all([
    fetchTradovateFills(environment, accessToken),
    fetchTradovateFillPairs(environment, accessToken),
    fetchTradovateContracts(environment, accessToken),
  ]);

  const fillMap = new Map(fills.map((fill) => [fill.id, fill]));
  const contractMap = new Map(contracts.map((contract) => [contract.id, contract]));

  let imported = 0;
  let skipped = 0;

  for (const pair of fillPairs) {
    const mapped = pairToTrade(pair, fillMap, contractMap);
    if (!mapped) {
      skipped += 1;
      continue;
    }

    const result = await upsertTradovateTrade(mapped);
    if (result.created) imported += 1;
    else skipped += 1;
  }

  await markTradovateSynced();

  return { imported, skipped, totalPairs: fillPairs.length };
}
