import { requireUser } from "@/lib/supabase/server";
import type { TradovateEnvironment } from "./config";
import {
  renewTradovateAccessToken,
  requestTradovateAccessToken,
} from "./client";

export interface TradovateConnection {
  userId: string;
  username: string;
  password: string;
  environment: TradovateEnvironment;
  accessToken: string | null;
  tokenExpiresAt: string | null;
  tradovateUserId: number | null;
  lastSyncAt: string | null;
}

type ConnectionRow = {
  user_id: string;
  username: string;
  password: string;
  environment: TradovateEnvironment;
  access_token: string | null;
  token_expires_at: string | null;
  tradovate_user_id: number | null;
  last_sync_at: string | null;
};

function mapConnection(row: ConnectionRow): TradovateConnection {
  return {
    userId: row.user_id,
    username: row.username,
    password: row.password,
    environment: row.environment,
    accessToken: row.access_token,
    tokenExpiresAt: row.token_expires_at,
    tradovateUserId: row.tradovate_user_id,
    lastSyncAt: row.last_sync_at,
  };
}

export async function getTradovateConnection(): Promise<TradovateConnection | null> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("tradovate_connections")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    if (error.message.includes("tradovate_connections")) {
      throw new Error("Run supabase/migrations/003_tradovate.sql in Supabase SQL Editor first.");
    }
    throw new Error(error.message);
  }

  return data ? mapConnection(data as ConnectionRow) : null;
}

export async function saveTradovateConnection(input: {
  username: string;
  password: string;
  environment: TradovateEnvironment;
  accessToken: string;
  tokenExpiresAt: string | null;
  tradovateUserId?: number | null;
}): Promise<TradovateConnection> {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("tradovate_connections")
    .upsert(
      {
        user_id: user.id,
        username: input.username,
        password: input.password,
        environment: input.environment,
        access_token: input.accessToken,
        token_expires_at: input.tokenExpiresAt,
        tradovate_user_id: input.tradovateUserId ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapConnection(data as ConnectionRow);
}

export async function updateTradovateTokens(
  accessToken: string,
  tokenExpiresAt: string | null
): Promise<void> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("tradovate_connections")
    .update({
      access_token: accessToken,
      token_expires_at: tokenExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
}

export async function markTradovateSynced(): Promise<void> {
  const { supabase, user } = await requireUser();
  await supabase
    .from("tradovate_connections")
    .update({
      last_sync_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);
}

export async function deleteTradovateConnection(): Promise<void> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("tradovate_connections")
    .delete()
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
}

function isTokenExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() <= Date.now() + 60_000;
}

function parseExpiration(expirationTime?: string): string | null {
  if (!expirationTime) return null;
  const date = new Date(expirationTime);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function getValidTradovateAccessToken(): Promise<{
  accessToken: string;
  environment: TradovateEnvironment;
}> {
  const connection = await getTradovateConnection();
  if (!connection) {
    throw new Error("Tradovate is not connected. Connect in Settings first.");
  }

  if (connection.accessToken && !isTokenExpired(connection.tokenExpiresAt)) {
    return { accessToken: connection.accessToken, environment: connection.environment };
  }

  try {
    if (connection.accessToken) {
      const renewed = await renewTradovateAccessToken(
        connection.environment,
        connection.accessToken
      );
      if (renewed.accessToken) {
        const tokenExpiresAt = parseExpiration(renewed.expirationTime);
        await updateTradovateTokens(renewed.accessToken, tokenExpiresAt);
        return { accessToken: renewed.accessToken, environment: connection.environment };
      }
    }
  } catch {
    // Fall through to full login
  }

  const auth = await requestTradovateAccessToken(
    connection.environment,
    connection.username,
    connection.password
  );

  const tokenExpiresAt = parseExpiration(auth.expirationTime);
  await updateTradovateTokens(auth.accessToken, tokenExpiresAt);

  return { accessToken: auth.accessToken, environment: connection.environment };
}

export function getPublicTradovateStatus(connection: TradovateConnection | null) {
  if (!connection) {
    return { connected: false as const };
  }

  return {
    connected: true as const,
    username: connection.username,
    environment: connection.environment,
    lastSyncAt: connection.lastSyncAt,
  };
}
