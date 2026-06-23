import { NextResponse } from "next/server";
import { isTradovateAppConfigured } from "@/lib/tradovate/config";
import { requestTradovateAccessToken, verifyTradovateConnection } from "@/lib/tradovate/client";
import {
  getPublicTradovateStatus,
  saveTradovateConnection,
} from "@/lib/tradovate/connection";
import type { TradovateEnvironment } from "@/lib/tradovate/config";

function parseExpiration(expirationTime?: string): string | null {
  if (!expirationTime) return null;
  const date = new Date(expirationTime);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "");
    const environment = (body.environment ?? "demo") as TradovateEnvironment;

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
    }

    if (environment !== "demo" && environment !== "live") {
      return NextResponse.json({ error: "Environment must be demo or live." }, { status: 400 });
    }

    const auth = await requestTradovateAccessToken(environment, username, password);
    await verifyTradovateConnection(environment, auth.accessToken);

    const connection = await saveTradovateConnection({
      username,
      password,
      environment,
      accessToken: auth.accessToken,
      tokenExpiresAt: parseExpiration(auth.expirationTime),
      tradovateUserId: auth.userId ?? null,
    });

    return NextResponse.json({
      appConfigured: isTradovateAppConfigured(),
      ...getPublicTradovateStatus(connection),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to connect Tradovate" },
      { status: 400 }
    );
  }
}
