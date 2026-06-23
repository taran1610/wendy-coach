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

  async function loadStatus(showLoading = true) {
    if (showLoading) setLoading(true);
    const res = await fetch("/api/tradovate/status");
    const data = await res.json();
    if (data.error) setError(data.error);
    else {
      setStatus(data);
      if (data.username) setUsername(data.username);
      if (data.environment) setEnvironment(data.environment);
    }
    setLoading(false);
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
    setMessage("Tradovate connected ✓");
  }

  async function onSync() {
    setSyncing(true);
    setError("");
    setMessage("");

    const res = await fetch("/api/tradovate/sync", { method: "POST" });
    setSyncing(false);
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Sync failed");
      return;
    }

    setMessage(`Synced ${data.imported} new trade(s) from ${data.totalPairs} fill pair(s).`);
    await loadStatus();
    router.refresh();
  }

  async function onDisconnect() {
    if (!confirm("Disconnect Tradovate?")) return;

    await fetch("/api/tradovate/disconnect", { method: "DELETE" });
    setMessage("");
    setError("");
    await loadStatus();
  }

  if (loading) {
    return <div className="card text-sm text-[var(--muted)]">Loading Tradovate...</div>;
  }

  return (
    <div className="card space-y-4">
      <div>
        <h2 className="font-semibold text-lg">Tradovate</h2>
        <p className="text-sm text-[var(--muted)] mt-1">
          Connect your Tradovate account to auto-import completed trades into Wendy.
        </p>
      </div>

      {!status.appConfigured ? (
        <p className="text-sm text-[var(--danger)]">
          App credentials missing. Add TRADOVATE_APP_ID, TRADOVATE_CID, and TRADOVATE_SEC to{" "}
          <code className="font-mono">.env.local</code> (from Tradovate API registration).
        </p>
      ) : null}

      {status.connected ? (
        <div className="space-y-3">
          <p className="text-sm">
            Connected as <span className="text-[var(--accent)]">{status.username}</span> (
            {status.environment})
          </p>
          {status.lastSyncAt ? (
            <p className="text-xs text-[var(--muted)]">
              Last sync: {new Date(status.lastSyncAt).toLocaleString()}
            </p>
          ) : null}
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
            <label htmlFor="tv-env">Environment</label>
            <select
              id="tv-env"
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as "demo" | "live")}
            >
              <option value="demo">Demo / Evaluation (TopStep, prop evals)</option>
              <option value="live">Live</option>
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
            />
            <p className="text-xs text-[var(--muted)] mt-2">
              Use your Tradovate login or dedicated API password. Stored encrypted in Supabase
              (RLS-protected) for sync only.
            </p>
          </div>
          <button type="submit" className="btn btn-primary" disabled={connecting || !status.appConfigured}>
            {connecting ? "Connecting..." : "Connect Tradovate"}
          </button>
        </form>
      )}

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      {message ? <p className="text-sm text-[var(--accent)]">{message}</p> : null}

      <div className="text-xs text-[var(--muted)] space-y-1 border-t border-[var(--card-border)] pt-3">
        <p className="font-semibold text-[var(--foreground)]">Setup steps</p>
        <p>1. Register an API app at Tradovate → Application Settings → API Access</p>
        <p>2. Add app ID, CID, and secret to your server .env.local</p>
        <p>3. Run supabase/migrations/003_tradovate.sql if you have not already</p>
        <p>4. Connect above, then click Sync trades</p>
      </div>
    </div>
  );
}
