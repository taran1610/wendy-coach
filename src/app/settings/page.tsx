"use client";

import { FormEvent, useEffect, useState } from "react";
import { TradovateConnect } from "@/components/TradovateConnect";

interface SettingsState {
  openaiModel: string;
  embeddingModel: string;
  serverOpenAIConfigured: boolean;
  activeOpenAIModel: string;
  activeEmbeddingModel: string;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<SettingsState>({
    openaiModel: "gpt-4o-mini",
    embeddingModel: "text-embedding-3-small",
    serverOpenAIConfigured: false,
    activeOpenAIModel: "gpt-4o-mini",
    activeEmbeddingModel: "text-embedding-3-small",
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setForm((f) => ({ ...f, ...data }));
        }
        setLoading(false);
      });
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        openaiModel: form.openaiModel,
        embeddingModel: form.embeddingModel,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to save settings");
      return;
    }

    const data = await res.json();
    setForm((f) => ({ ...f, ...data }));
    setSaved(true);
  }

  if (loading) {
    return <p className="text-[var(--muted)]">Loading settings...</p>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="text-[var(--muted)] mt-2">
          Your OpenAI key lives on the server in <code className="font-mono">.env.local</code>.
          Wendy uses it for coaching — never exposed in the browser.
        </p>
      </header>

      <TradovateConnect />

      <div className="card space-y-2">
        <p className="font-semibold">OpenAI (server)</p>
        <p className="text-sm text-[var(--muted)]">
          Status:{" "}
          <span className={form.serverOpenAIConfigured ? "text-[var(--accent)]" : "text-[var(--danger)]"}>
            {form.serverOpenAIConfigured ? "Configured ✓" : "Missing OPENAI_API_KEY in .env.local"}
          </span>
        </p>
        <p className="text-xs text-[var(--muted)]">
          Active models from server env: {form.activeOpenAIModel} / {form.activeEmbeddingModel}
        </p>
      </div>

      <form onSubmit={onSubmit} className="card space-y-4">
        <p className="text-sm text-[var(--muted)]">
          Optional per-account model preferences (stored in Supabase). Server env vars take priority
          when set.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="model">Chat Model preference</label>
            <select
              id="model"
              value={form.openaiModel}
              onChange={(e) => setForm((f) => ({ ...f, openaiModel: e.target.value }))}
            >
              <option value="gpt-4o-mini">gpt-4o-mini (recommended)</option>
              <option value="gpt-4o">gpt-4o</option>
              <option value="gpt-4.1-mini">gpt-4.1-mini</option>
              <option value="gpt-4.1">gpt-4.1</option>
            </select>
          </div>
          <div>
            <label htmlFor="embedding">Embedding Model preference</label>
            <select
              id="embedding"
              value={form.embeddingModel}
              onChange={(e) => setForm((f) => ({ ...f, embeddingModel: e.target.value }))}
            >
              <option value="text-embedding-3-small">text-embedding-3-small</option>
              <option value="text-embedding-3-large">text-embedding-3-large</option>
            </select>
          </div>
        </div>

        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        {saved ? <p className="text-sm text-[var(--accent)]">Settings saved ✓</p> : null}

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving..." : "Save Preferences"}
        </button>
      </form>

      <div className="card text-sm text-[var(--muted)] space-y-3">
        <p className="font-semibold text-[var(--foreground)]">Google sign-in setup</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Supabase → Authentication → Providers → enable Google</li>
          <li>Add Google OAuth Client ID + Secret from Google Cloud Console</li>
          <li>
            Supabase → Authentication → URL Configuration → add redirect:{" "}
            <code className="font-mono">http://localhost:3000/auth/callback</code>
          </li>
        </ol>
      </div>
    </div>
  );
}
