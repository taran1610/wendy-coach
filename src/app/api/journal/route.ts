import { NextResponse } from "next/server";
import { listJournals, upsertJournal } from "@/lib/db";
import { indexJournalEmbedding } from "@/lib/coach";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? undefined;
  return NextResponse.json(await listJournals(date));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const entry = await upsertJournal({
      date: body.date,
      marketNotes: body.marketNotes ?? "",
      pnlNotes: body.pnlNotes ?? "",
      mood: body.mood ?? "",
      goals: body.goals ?? "",
      reflections: body.reflections ?? "",
    });

    try {
      await indexJournalEmbedding(entry.id);
    } catch {
      // Embedding optional without API key
    }

    return NextResponse.json(entry);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save journal" },
      { status: 400 }
    );
  }
}
