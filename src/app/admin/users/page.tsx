import Link from "next/link";
import { redirect } from "next/navigation";
import { listPlatformUsers, requireAdmin } from "@/lib/admin";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default async function AdminUsersPage() {
  let users: Awaited<ReturnType<typeof listPlatformUsers>> = [];
  let loadError = "";

  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      redirect("/");
    }
    loadError = error instanceof Error ? error.message : "Access denied";
  }

  if (!loadError) {
    try {
      users = await listPlatformUsers();
    } catch (error) {
      loadError = error instanceof Error ? error.message : "Failed to load users";
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header>
        <p className="text-sm text-[var(--muted)]">Admin</p>
        <h1 className="text-3xl font-semibold mt-1">Platform users</h1>
        <p className="text-[var(--muted)] mt-2">
          Everyone who joined Wendy Coach — stored in Supabase{" "}
          <code className="font-mono text-xs">platform_users</code>.
        </p>
      </header>

      {loadError ? (
        <div className="card text-sm text-[var(--danger)]">{loadError}</div>
      ) : null}

      <div className="card overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-[var(--muted)]">{users.length} user(s)</p>
          <Link href="/dashboard" className="text-sm text-[var(--accent)] hover:underline">
            Back to dashboard
          </Link>
        </div>

        {users.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            No users in the table yet. Run the SQL migration, then sign up or sign in once.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--muted)] border-b border-[var(--card-border)]">
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Provider</th>
                <th className="pb-3 pr-4">Joined</th>
                <th className="pb-3">Last sign in</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-[var(--card-border)]/50">
                  <td className="py-3 pr-4 font-medium">{user.email || "—"}</td>
                  <td className="py-3 pr-4 text-[var(--muted)]">{user.fullName || "—"}</td>
                  <td className="py-3 pr-4 capitalize">{user.provider}</td>
                  <td className="py-3 pr-4 font-mono text-xs">{formatDate(user.joinedAt)}</td>
                  <td className="py-3 font-mono text-xs">{formatDate(user.lastSignInAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
