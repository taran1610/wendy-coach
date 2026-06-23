import { NextResponse } from "next/server";
import { listPlatformUsers, requireAdmin } from "@/lib/admin";

export async function GET() {
  try {
    await requireAdmin();
    const users = await listPlatformUsers();
    return NextResponse.json({ users, total: users.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load users";
    const status = message === "Forbidden" || message === "Unauthorized" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
