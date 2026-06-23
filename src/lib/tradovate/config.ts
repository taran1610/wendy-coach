export type TradovateEnvironment = "demo" | "live";

export function getTradovateAppConfig() {
  const appId = process.env.TRADOVATE_APP_ID?.trim();
  const appVersion = process.env.TRADOVATE_APP_VERSION?.trim() || "1.0.0";
  const cid = process.env.TRADOVATE_CID?.trim();
  const sec = process.env.TRADOVATE_SEC?.trim();

  if (!appId || !cid || !sec) {
    throw new Error(
      "Tradovate app not configured. Add TRADOVATE_APP_ID, TRADOVATE_CID, and TRADOVATE_SEC to .env.local."
    );
  }

  return {
    appId,
    appVersion,
    cid: Number(cid),
    sec,
  };
}

export function isTradovateAppConfigured(): boolean {
  try {
    getTradovateAppConfig();
    return true;
  } catch {
    return false;
  }
}

export function getTradovateBaseUrl(environment: TradovateEnvironment): string {
  return environment === "live"
    ? "https://live.tradovateapi.com/v1"
    : "https://demo.tradovateapi.com/v1";
}
