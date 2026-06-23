import { NextResponse } from "next/server";
import { chatWithWendy } from "@/lib/coach";
import { todayISO } from "@/lib/stats";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const date = body.date ?? todayISO();
    const history = Array.isArray(body.history) ? body.history : [];

    const reply = await chatWithWendy(message, date, history);
    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Coach request failed" },
      { status: 400 }
    );
  }
}
