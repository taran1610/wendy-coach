import { requireUser } from "@/lib/supabase/server";
import type {
  CoachReview,
  EmbeddingChunk,
  JournalEntry,
  Settings,
  Trade,
  TradeOutcome,
} from "./types";

const DEFAULT_SETTINGS: Settings = {
  openaiModel: "gpt-5.5",
  embeddingModel: "text-embedding-3-small",
};

type TradeRow = {
  id: string;
  date: string;
  symbol: string;
  direction: string;
  entry_price: number;
  exit_price: number;
  quantity: number;
  pnl: number;
  setup: string;
  notes: string;
  emotions: string;
  mistakes: string;
  lessons: string;
  outcome: string;
  created_at: string;
};

type JournalRow = {
  id: string;
  date: string;
  market_notes: string;
  pnl_notes: string;
  mood: string;
  goals: string;
  reflections: string;
  created_at: string;
};

type ReviewRow = {
  id: string;
  date: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  action_items: string[];
  encouragement: string;
  created_at: string;
};

type EmbeddingRow = {
  id: string;
  type: string;
  ref_id: string;
  date: string;
  text: string;
  embedding: number[];
};

type SettingsRow = {
  openai_model: string;
  embedding_model: string;
};

function mapTrade(row: TradeRow): Trade {
  return {
    id: row.id,
    date: row.date,
    symbol: row.symbol,
    direction: row.direction as Trade["direction"],
    entryPrice: Number(row.entry_price),
    exitPrice: Number(row.exit_price),
    quantity: Number(row.quantity),
    pnl: Number(row.pnl),
    setup: row.setup,
    notes: row.notes,
    emotions: row.emotions,
    mistakes: row.mistakes,
    lessons: row.lessons,
    outcome: row.outcome as TradeOutcome,
    createdAt: row.created_at,
  };
}

function mapJournal(row: JournalRow): JournalEntry {
  return {
    id: row.id,
    date: row.date,
    marketNotes: row.market_notes,
    pnlNotes: row.pnl_notes,
    mood: row.mood,
    goals: row.goals,
    reflections: row.reflections,
    createdAt: row.created_at,
  };
}

function mapReview(row: ReviewRow): CoachReview {
  return {
    id: row.id,
    date: row.date,
    summary: row.summary,
    strengths: row.strengths ?? [],
    weaknesses: row.weaknesses ?? [],
    actionItems: row.action_items ?? [],
    encouragement: row.encouragement,
    createdAt: row.created_at,
  };
}

function mapEmbedding(row: EmbeddingRow): EmbeddingChunk {
  return {
    id: row.id,
    type: row.type as EmbeddingChunk["type"],
    refId: row.ref_id,
    date: row.date,
    text: row.text,
    embedding: row.embedding,
  };
}

function mapSettings(row: SettingsRow | null): Settings {
  if (!row) return DEFAULT_SETTINGS;
  return {
    openaiModel: row.openai_model ?? DEFAULT_SETTINGS.openaiModel,
    embeddingModel: row.embedding_model ?? DEFAULT_SETTINGS.embeddingModel,
  };
}

export async function getSettings(): Promise<Settings> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("user_settings")
    .select("openai_model, embedding_model")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) {
    await supabase.from("user_settings").insert({ user_id: user.id });
    return DEFAULT_SETTINGS;
  }
  return mapSettings(data as SettingsRow);
}

export async function updateSettings(partial: Partial<Settings>): Promise<Settings> {
  const { supabase, user } = await requireUser();
  const current = await getSettings();

  const payload = {
    user_id: user.id,
    openai_model: partial.openaiModel ?? current.openaiModel,
    embedding_model: partial.embeddingModel ?? current.embeddingModel,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("user_settings")
    .upsert(payload, { onConflict: "user_id" })
    .select("openai_model, embedding_model")
    .single();

  if (error) throw new Error(error.message);
  return mapSettings(data as SettingsRow);
}

export async function listTrades(date?: string): Promise<Trade[]> {
  const { supabase, user } = await requireUser();
  let query = supabase.from("trades").select("*").eq("user_id", user.id);

  if (date) query = query.eq("date", date);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as TradeRow[]).map(mapTrade);
}

export async function getTrade(id: string): Promise<Trade | undefined> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .eq("user_id", user.id)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapTrade(data as TradeRow) : undefined;
}

export async function createTrade(
  input: Omit<Trade, "id" | "createdAt" | "outcome"> & { outcome?: Trade["outcome"] }
): Promise<Trade> {
  const { supabase, user } = await requireUser();
  const pnl = input.pnl ?? 0;
  const outcome =
    input.outcome ?? (pnl > 0 ? "win" : pnl < 0 ? "loss" : "breakeven");

  const { data, error } = await supabase
    .from("trades")
    .insert({
      user_id: user.id,
      date: input.date,
      symbol: input.symbol,
      direction: input.direction,
      entry_price: input.entryPrice,
      exit_price: input.exitPrice,
      quantity: input.quantity,
      pnl,
      setup: input.setup,
      notes: input.notes,
      emotions: input.emotions,
      mistakes: input.mistakes,
      lessons: input.lessons,
      outcome,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapTrade(data as TradeRow);
}

export async function deleteTrade(id: string): Promise<boolean> {
  const { supabase, user } = await requireUser();

  await supabase
    .from("embeddings")
    .delete()
    .eq("user_id", user.id)
    .eq("type", "trade")
    .eq("ref_id", id);

  const { error, count } = await supabase
    .from("trades")
    .delete({ count: "exact" })
    .eq("user_id", user.id)
    .eq("id", id);

  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

export async function listJournals(date?: string): Promise<JournalEntry[]> {
  const { supabase, user } = await requireUser();
  let query = supabase.from("journals").select("*").eq("user_id", user.id);

  if (date) query = query.eq("date", date);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as JournalRow[]).map(mapJournal);
}

export async function getJournalForDate(date: string): Promise<JournalEntry | undefined> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("journals")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", date)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapJournal(data as JournalRow) : undefined;
}

export async function getJournal(id: string): Promise<JournalEntry | undefined> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("journals")
    .select("*")
    .eq("user_id", user.id)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapJournal(data as JournalRow) : undefined;
}

export async function upsertJournal(
  input: Omit<JournalEntry, "id" | "createdAt">
): Promise<JournalEntry> {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("journals")
    .upsert(
      {
        user_id: user.id,
        date: input.date,
        market_notes: input.marketNotes,
        pnl_notes: input.pnlNotes,
        mood: input.mood,
        goals: input.goals,
        reflections: input.reflections,
      },
      { onConflict: "user_id,date" }
    )
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapJournal(data as JournalRow);
}

export async function getReviewForDate(date: string): Promise<CoachReview | undefined> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("coach_reviews")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", date)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapReview(data as ReviewRow) : undefined;
}

export async function saveReview(
  input: Omit<CoachReview, "id" | "createdAt">
): Promise<CoachReview> {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("coach_reviews")
    .upsert(
      {
        user_id: user.id,
        date: input.date,
        summary: input.summary,
        strengths: input.strengths,
        weaknesses: input.weaknesses,
        action_items: input.actionItems,
        encouragement: input.encouragement,
      },
      { onConflict: "user_id,date" }
    )
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapReview(data as ReviewRow);
}

export async function listEmbeddings(): Promise<EmbeddingChunk[]> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("embeddings")
    .select("*")
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  return (data as EmbeddingRow[]).map(mapEmbedding);
}

export async function upsertEmbedding(
  chunk: Omit<EmbeddingChunk, "id"> & { id?: string }
): Promise<EmbeddingChunk> {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("embeddings")
    .upsert(
      {
        id: chunk.id,
        user_id: user.id,
        type: chunk.type,
        ref_id: chunk.refId,
        date: chunk.date,
        text: chunk.text,
        embedding: chunk.embedding,
      },
      { onConflict: "user_id,type,ref_id" }
    )
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapEmbedding(data as EmbeddingRow);
}

export function tradeToText(trade: Trade): string {
  return [
    `Trade on ${trade.date}: ${trade.symbol} ${trade.direction}`,
    `Entry ${trade.entryPrice}, Exit ${trade.exitPrice}, Qty ${trade.quantity}`,
    `P&L: $${trade.pnl.toFixed(2)} (${trade.outcome})`,
    trade.setup && `Setup: ${trade.setup}`,
    trade.notes && `Notes: ${trade.notes}`,
    trade.emotions && `Emotions: ${trade.emotions}`,
    trade.mistakes && `Mistakes: ${trade.mistakes}`,
    trade.lessons && `Lessons: ${trade.lessons}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function journalToText(journal: JournalEntry): string {
  return [
    `Journal for ${journal.date}`,
    journal.marketNotes && `Market: ${journal.marketNotes}`,
    journal.pnlNotes && `P&L notes: ${journal.pnlNotes}`,
    journal.mood && `Mood: ${journal.mood}`,
    journal.goals && `Goals: ${journal.goals}`,
    journal.reflections && `Reflections: ${journal.reflections}`,
  ]
    .filter(Boolean)
    .join("\n");
}
