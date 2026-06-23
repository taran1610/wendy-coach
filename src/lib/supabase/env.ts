export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return false;
  if (url.includes("your-project")) return false;
  if (key === "your-anon-key") return false;

  return true;
}

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Copy .env.local.example to .env.local and add your project URL and anon key."
    );
  }

  return { url: url!, key: key! };
}
