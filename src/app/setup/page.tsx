export default function SetupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card w-full max-w-lg space-y-4">
        <h1 className="text-2xl font-semibold">Supabase not configured</h1>
        <p className="text-[var(--muted)] text-sm">
          Wendy Coach needs your Supabase project URL and anon key before it can run.
        </p>
        <ol className="list-decimal list-inside text-sm space-y-2 text-[var(--muted)]">
          <li>
            Copy <code className="font-mono">.env.local.example</code> to{" "}
            <code className="font-mono">.env.local</code>
          </li>
          <li>
            Add values from{" "}
            <a
              href="https://supabase.com/dashboard/project/_/settings/api"
              className="text-[var(--accent)] hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Supabase → Settings → API
            </a>
          </li>
          <li>Restart the dev server: <code className="font-mono">npm run dev</code></li>
        </ol>
        <pre className="text-xs bg-[#0a101a] border border-[var(--card-border)] rounded-lg p-3 overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...`}
        </pre>
      </div>
    </div>
  );
}
