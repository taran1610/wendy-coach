import { NextResponse } from "next/server";
import { deleteTradovateConnection } from "@/lib/tradovate/connection";

export async function DELETE() {
  try {
    await deleteTradovateConnection();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to disconnect" },
      { status: 400 }
    );
  }
}
