import {
  getTradovateAppConfig,
  getTradovateBaseUrl,
  type TradovateEnvironment,
} from "./config";

export interface TradovateAccessTokenResponse {
  accessToken: string;
  expirationTime?: string;
  userId?: number;
  errorText?: string;
}

export interface TradovateFill {
  id: number;
  contractId: number;
  timestamp?: string;
  tradeDate?: { year: number; month: number; day: number } | string;
  action?: string;
  qty: number;
  price: number;
}

export interface TradovateFillPair {
  id: number;
  buyFillId: number;
  sellFillId: number;
  buyPrice: number;
  sellPrice: number;
  qty: number;
  active?: boolean;
}

export interface TradovateContract {
  id: number;
  name: string;
  contractSize?: number;
  tickSize?: number;
  tickValue?: number;
}

async function tradovateFetch<T>(
  baseUrl: string,
  path: string,
  accessToken: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "errorText" in data &&
      typeof (data as { errorText: unknown }).errorText === "string"
        ? (data as { errorText: string }).errorText
        : `Tradovate API error (${response.status})`;
    throw new Error(message);
  }

  return data as T;
}

export async function requestTradovateAccessToken(
  environment: TradovateEnvironment,
  username: string,
  password: string
): Promise<TradovateAccessTokenResponse> {
  const app = getTradovateAppConfig();
  const baseUrl = getTradovateBaseUrl(environment);

  const response = await fetch(`${baseUrl}/auth/accessTokenRequest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: username,
      password,
      appId: app.appId,
      appVersion: app.appVersion,
      cid: app.cid,
      sec: app.sec,
    }),
  });

  const data = (await response.json()) as TradovateAccessTokenResponse;

  if (!response.ok || !data.accessToken) {
    throw new Error(data.errorText ?? "Tradovate login failed. Check username and password.");
  }

  return data;
}

export async function renewTradovateAccessToken(
  environment: TradovateEnvironment,
  accessToken: string
): Promise<TradovateAccessTokenResponse> {
  const baseUrl = getTradovateBaseUrl(environment);
  return tradovateFetch<TradovateAccessTokenResponse>(
    baseUrl,
    "/auth/renewAccessToken",
    accessToken,
    { method: "POST", body: "{}" }
  );
}

export async function fetchTradovateFills(
  environment: TradovateEnvironment,
  accessToken: string
): Promise<TradovateFill[]> {
  const baseUrl = getTradovateBaseUrl(environment);
  return tradovateFetch<TradovateFill[]>(baseUrl, "/fill/list", accessToken);
}

export async function fetchTradovateFillPairs(
  environment: TradovateEnvironment,
  accessToken: string
): Promise<TradovateFillPair[]> {
  const baseUrl = getTradovateBaseUrl(environment);
  return tradovateFetch<TradovateFillPair[]>(baseUrl, "/fillPair/list", accessToken);
}

export async function fetchTradovateContracts(
  environment: TradovateEnvironment,
  accessToken: string
): Promise<TradovateContract[]> {
  const baseUrl = getTradovateBaseUrl(environment);
  return tradovateFetch<TradovateContract[]>(baseUrl, "/contract/list", accessToken);
}

export async function verifyTradovateConnection(
  environment: TradovateEnvironment,
  accessToken: string
): Promise<{ name?: string; email?: string }> {
  const baseUrl = getTradovateBaseUrl(environment);
  return tradovateFetch(baseUrl, "/auth/me", accessToken);
}
