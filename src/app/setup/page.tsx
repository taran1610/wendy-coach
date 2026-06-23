export default function SetupPage() {
  const onVercel = process.env.VERCEL === "1";

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card w-full max-w-lg space-y-4">
        <h1 className="text-2xl font-semibold">Supabase not configured</h1>
        <p className="text-[var(--muted)] text-sm">
          Wendy Coach needs your Supabase project URL and anon key before it can run.
        </p>

        {onVercel ? (
          <>
            <p className="text-sm text-[var(--muted)]">
              This deployment is missing environment variables. Add them in the Vercel dashboard,
              then redeploy.
            </p>
            <ol className="list-decimal list-inside text-sm space-y-2 text-[var(--muted)]">
              <li>
                Open{" "}
                <a
                  href="https://vercel.com/dashboard"
                  className="text-[var(--accent)] hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Vercel → your project → Settings → Environment Variables
                </a>
              </li>
              <li>Add the variables below for Production (and Preview if you use preview URLs)</li>
              <li>Redeploy the project (Deployments → ⋯ → Redeploy)</li>
              <li>
                In{" "}
                <a
                  href="https://supabase.com/dashboard/project/_/auth/url-configuration"
                  className="text-[var(--accent)] hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Supabase → Authentication → URL Configuration
                </a>
                , set Site URL to <code className="font-mono">https://wendy-coach.vercel.app</code>{" "}
                and add redirect{" "}
                <code className="font-mono">https://wendy-coach.vercel.app/auth/callback</code>
              </li>
            </ol>
          </>
        ) : (
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
            <li>
              Restart the dev server: <code className="font-mono">npm run dev</code>
            </li>
          </ol>
        )}

        <pre className="text-xs bg-[var(--surface-muted)] border border-[var(--card-border)] rounded-lg p-3 overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_EMAILS=you@example.com
OPENAI_API_KEY=sk-...`}
        </pre>
      </div>
    </div>
  );
}
