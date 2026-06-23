"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function signInWithGoogle() {
    setGoogleLoading(true);
    setError("");

    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    setGoogleLoading(false);

    if (oauthError) {
      setError(oauthError.message);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const supabase = createClient();

    if (mode === "signup") {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      setLoading(false);
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      setMessage("Check your email to confirm your account, then sign in.");
      setMode("signin");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--gold)] flex items-center justify-center text-[#042f2e] font-bold text-2xl mb-4">
            W
          </div>
          <h1 className="text-2xl font-semibold">Wendy Coach</h1>
          <p className="text-sm text-[var(--muted)] mt-2">
            Sign in to your trading journal and AI mentor
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary w-full"
          onClick={signInWithGoogle}
          disabled={googleLoading || loading}
        >
          {googleLoading ? "Redirecting..." : "Continue with Google"}
        </button>

        <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
          <div className="h-px flex-1 bg-[var(--card-border)]" />
          or email
          <div className="h-px flex-1 bg-[var(--card-border)]" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </div>

          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
          {message ? <p className="text-sm text-[var(--accent)]">{message}</p> : null}

          <button type="submit" className="btn btn-primary w-full" disabled={loading || googleLoading}>
            {loading ? "Please wait..." : mode === "signup" ? "Create Account" : "Sign In"}
          </button>
        </form>

        <p className="text-sm text-center text-[var(--muted)]">
          {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="text-[var(--accent)] hover:underline"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
