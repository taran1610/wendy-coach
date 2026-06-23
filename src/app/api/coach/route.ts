import { NextResponse } from "next/server";
import { chatWithWendy, generateDailyReview, getReviewForDate } from "@/lib/coach";
import { todayISO } from "@/lib/stats";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? todayISO();
  const review = getReviewForDate(date);
  return NextResponse.json(review ?? null);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const date = body.date ?? todayISO();

    if (body.action === "chat") {
      const reply = await chatWithWendy(body.message, date);
      return NextResponse.json({ reply });
    }

    const review = await generateDailyReview(date);
    return NextResponse.json(review);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Coach request failed" },
      { status: 400 }
    );
  }
}
