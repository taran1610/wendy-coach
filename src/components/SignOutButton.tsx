"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] mt-6 px-3 py-2 rounded-lg hover:bg-[var(--hover-bg)] w-full text-left"
    >
      Sign out
    </button>
  );
}
