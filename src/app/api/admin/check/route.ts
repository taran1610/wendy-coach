import { NextResponse } from "next/server";
import { getAdminEmails, isAdminEmail } from "@/lib/admin";
import { requireUser } from "@/lib/supabase/server";

export async function GET() {
  try {
    const { user } = await requireUser();
    return NextResponse.json({
      isAdmin: isAdminEmail(user.email),
      configured: getAdminEmails().length > 0,
    });
  } catch {
    return NextResponse.json({ isAdmin: false, configured: getAdminEmails().length > 0 });
  }
}
