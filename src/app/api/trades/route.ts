import { NextResponse } from "next/server";
import { createTrade, deleteTrade, listTrades } from "@/lib/db";
import { indexTradeEmbedding } from "@/lib/coach";
import type { TradeDirection } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? undefined;
  return NextResponse.json(await listTrades(date));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const entryPrice = Number(body.entryPrice);
    const exitPrice = Number(body.exitPrice);
    const quantity = Number(body.quantity);
    let pnl = Number(body.pnl);

    if (Number.isNaN(pnl) && !Number.isNaN(entryPrice) && !Number.isNaN(exitPrice)) {
      const direction = body.direction as TradeDirection;
      const diff = direction === "long" ? exitPrice - entryPrice : entryPrice - exitPrice;
      pnl = diff * quantity;
    }

    const trade = await createTrade({
      date: body.date,
      symbol: String(body.symbol ?? "").toUpperCase(),
      direction: body.direction,
      entryPrice,
      exitPrice,
      quantity,
      pnl,
      setup: body.setup ?? "",
      notes: body.notes ?? "",
      emotions: body.emotions ?? "",
      mistakes: body.mistakes ?? "",
      lessons: body.lessons ?? "",
    });

    try {
      await indexTradeEmbedding(trade.id);
    } catch {
      // Embedding is optional until API key is set
    }

    return NextResponse.json(trade, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create trade" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing trade id" }, { status: 400 });
  }

  const deleted = await deleteTrade(id);
  if (!deleted) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
