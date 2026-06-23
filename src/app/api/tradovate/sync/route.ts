import { NextResponse } from "next/server";
import { syncTradovateTrades } from "@/lib/tradovate/sync";

export async function POST() {
  try {
    const result = await syncTradovateTrades();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Tradovate sync failed" },
      { status: 400 }
    );
  }
}
