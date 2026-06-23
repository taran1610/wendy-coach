import { createClient } from "@supabase/supabase-js";
import { requireUser } from "@/lib/supabase/server";

export interface PlatformUserRow {
  id: string;
  email: string;
  fullName: string;
  provider: string;
  joinedAt: string;
  lastSignInAt: string | null;
}

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAdmin() {
  const { user } = await requireUser();
  const admins = getAdminEmails();

  if (!admins.length) {
    throw new Error("Admin access is not configured. Set ADMIN_EMAILS in .env.local.");
  }

  if (!user.email || !admins.includes(user.email.toLowerCase())) {
    throw new Error("Forbidden");
  }

  return user;
}

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const admins = getAdminEmails();
  return admins.includes(email.toLowerCase());
}

function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY in .env.local (Supabase → Settings → API → service_role)."
    );
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

type PlatformUserDbRow = {
  id: string;
  email: string;
  full_name: string;
  provider: string;
  joined_at: string;
  last_sign_in_at: string | null;
};

function mapPlatformUser(row: PlatformUserDbRow): PlatformUserRow {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    provider: row.provider,
    joinedAt: row.joined_at,
    lastSignInAt: row.last_sign_in_at,
  };
}

export async function listPlatformUsers(): Promise<PlatformUserRow[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("platform_users")
    .select("id, email, full_name, provider, joined_at, last_sign_in_at")
    .order("joined_at", { ascending: false });

  if (error) {
    throw new Error(
      error.message.includes("platform_users")
        ? "Run supabase/migrations/002_platform_users.sql in the Supabase SQL Editor first."
        : error.message
    );
  }

  return (data as PlatformUserDbRow[]).map(mapPlatformUser);
}

/** @deprecated use listPlatformUsers */
export async function listAllUsers(): Promise<
  {
    id: string;
    email: string;
    name: string;
    provider: string;
    createdAt: string;
    lastSignInAt: string | null;
  }[]
> {
  const users = await listPlatformUsers();
  return users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.fullName,
    provider: u.provider,
    createdAt: u.joinedAt,
    lastSignInAt: u.lastSignInAt,
  }));
}
