"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

interface TradovateStatus {
  appConfigured: boolean;
  connected: boolean;
  username?: string;
  environment?: "demo" | "live";
  lastSyncAt?: string | null;
}

export function TradovateConnect() {
  const router = useRouter();
  const [status, setStatus] = useState<TradovateStatus>({
    appConfigured: false,
    connected: false,
  });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [environment, setEnvironment] = useState<"demo" | "live">("demo");
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function syncTrades() {
    setSyncing(true);
    setError("");

    const res = await fetch("/api/tradovate/sync", { method: "POST" });
    setSyncing(false);
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Sync failed");
      return false;
    }

    setMessage(`Synced ${data.imported} new trade(s) from ${data.totalPairs} fill pair(s).`);
    router.refresh();
    return true;
  }

  async function refreshStatus() {
    const res = await fetch("/api/tradovate/status");
    const data = await res.json();
    if (data.error) {
      setError(data.error);
      return;
    }

    setStatus(data);
    if (data.username) setUsername(data.username);
    if (data.environment) setEnvironment(data.environment);
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const res = await fetch("/api/tradovate/status");
      const data = await res.json();
      if (cancelled) return;

      if (data.error) setError(data.error);
      else {
        setStatus(data);
        if (data.username) setUsername(data.username);
        if (data.environment) setEnvironment(data.environment);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function onConnect(e: FormEvent) {
    e.preventDefault();
    setConnecting(true);
    setError("");
    setMessage("");

    const res = await fetch("/api/tradovate/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, environment }),
    });

    setConnecting(false);
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Connection failed");
      return;
    }

    setPassword("");
    setStatus((s) => ({ ...s, appConfigured: true, ...data }));
    setMessage("Connected. Importing your trades...");

    await syncTrades();
    await refreshStatus();
  }

  async function onSync() {
    setMessage("");
    await syncTrades();
    await refreshStatus();
  }

  async function onDisconnect() {
    if (!confirm("Disconnect Tradovate?")) return;

    await fetch("/api/tradovate/disconnect", { method: "DELETE" });
    setMessage("");
    setError("");
    setPassword("");
    await refreshStatus();
  }

  if (loading) {
    return <div className="card text-sm text-[var(--muted)]">Loading Tradovate...</div>;
  }

  if (!status.appConfigured) {
    return (
      <div className="card space-y-3">
        <div>
          <h2 className="font-semibold text-lg">Tradovate</h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            Auto-import trades from your Tradovate account into Wendy.
          </p>
        </div>
        <p className="text-sm text-[var(--muted)]">
          Tradovate sync is not enabled on this site yet. The site owner needs to connect a
          Tradovate API app once — then every user can connect with just their Tradovate username
          and password.
        </p>
      </div>
    );
  }

  return (
    <div className="card space-y-4">
      <div>
        <h2 className="font-semibold text-lg">Tradovate</h2>
        <p className="text-sm text-[var(--muted)] mt-1">
          Connect in 3 steps: pick your account type, enter your Tradovate login, then we import
          your trades automatically.
        </p>
      </div>

      {status.connected ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-[color-mix(in_srgb,var(--accent)_25%,var(--card-border))] bg-[color-mix(in_srgb,var(--accent)_8%,var(--card))] px-4 py-3">
            <p className="text-sm font-medium text-[var(--accent)]">Connected</p>
            <p className="text-sm mt-1">
              Signed in as <span className="font-semibold">{status.username}</span> ·{" "}
              {status.environment === "demo" ? "Demo / eval account" : "Live account"}
            </p>
            {status.lastSyncAt ? (
              <p className="text-xs text-[var(--muted)] mt-1">
                Last sync: {new Date(status.lastSyncAt).toLocaleString()}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" onClick={onSync} disabled={syncing}>
              {syncing ? "Syncing..." : "Sync trades now"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onDisconnect}>
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={onConnect} className="space-y-4">
          <div>
            <label htmlFor="tv-env">Account type</label>
            <select
              id="tv-env"
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as "demo" | "live")}
            >
              <option value="demo">Demo / evaluation (TopStep, prop firms)</option>
              <option value="live">Live funded account</option>
            </select>
          </div>
          <div>
            <label htmlFor="tv-user">Tradovate username</label>
            <input
              id="tv-user"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              placeholder="Your Tradovate username"
            />
          </div>
          <div>
            <label htmlFor="tv-pass">Tradovate password</label>
            <input
              id="tv-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Your Tradovate password"
            />
            <p className="text-xs text-[var(--muted)] mt-2">
              Same login you use on Tradovate. We only use it to pull your fills — never shared
              with other users.
            </p>
          </div>
          <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={connecting || syncing}>
            {connecting || syncing ? "Connecting..." : "Connect & import trades"}
          </button>
        </form>
      )}

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      {message ? <p className="text-sm text-[var(--accent)]">{message}</p> : null}
    </div>
  );
}
