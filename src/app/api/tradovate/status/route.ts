import { NextResponse } from "next/server";
import { isTradovateAppConfigured } from "@/lib/tradovate/config";
import {
  getPublicTradovateStatus,
  getTradovateConnection,
} from "@/lib/tradovate/connection";

export async function GET() {
  try {
    const connection = await getTradovateConnection();
    return NextResponse.json({
      appConfigured: isTradovateAppConfigured(),
      ...getPublicTradovateStatus(connection),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load Tradovate status" },
      { status: 400 }
    );
  }
}
