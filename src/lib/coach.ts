import {
  getJournal,
  getJournalForDate,
  getReviewForDate,
  getTrade,
  journalToText,
  listEmbeddings,
  listTrades,
  saveReview,
  tradeToText,
  upsertEmbedding,
} from "./db";
import { createEmbedding, getOpenAIClient, getActiveOpenAIModel, WENDY_SYSTEM_PROMPT } from "./openai";
import { formatRetrievedContext, retrieveRelevantChunks } from "./rag";
import { computeDayStats, computeTradeStats, statsSummary, todayISO } from "./stats";
import type { CoachReview } from "./types";

function parseReviewResponse(content: string): Omit<CoachReview, "id" | "createdAt" | "date"> {
  const sections = {
    summary: "",
    strengths: [] as string[],
    weaknesses: [] as string[],
    actionItems: [] as string[],
    encouragement: "",
  };

  const lines = content.split("\n");
  let current: keyof typeof sections | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();

    if (lower.includes("summary") && lower.endsWith(":")) {
      current = "summary";
      continue;
    }
    if (lower.includes("strength") && lower.endsWith(":")) {
      current = "strengths";
      continue;
    }
    if (lower.includes("weakness") || lower.includes("lagging") || lower.includes("improve")) {
      if (lower.endsWith(":")) {
        current = "weaknesses";
        continue;
      }
    }
    if (lower.includes("action") && lower.endsWith(":")) {
      current = "actionItems";
      continue;
    }
    if (lower.includes("encouragement") && lower.endsWith(":")) {
      current = "encouragement";
      continue;
    }

    if (!trimmed || trimmed.startsWith("#")) continue;

    const bullet = trimmed.replace(/^[-*•]\s*/, "").replace(/^\d+\.\s*/, "");

    if (current === "summary") {
      sections.summary += (sections.summary ? " " : "") + bullet;
    } else if (current === "strengths" && bullet) {
      sections.strengths.push(bullet);
    } else if (current === "weaknesses" && bullet) {
      sections.weaknesses.push(bullet);
    } else if (current === "actionItems" && bullet) {
      sections.actionItems.push(bullet);
    } else if (current === "encouragement") {
      sections.encouragement += (sections.encouragement ? " " : "") + bullet;
    }
  }

  if (!sections.summary) {
    sections.summary = content.slice(0, 500);
  }

  return sections;
}

export async function indexTradeEmbedding(tradeId: string): Promise<void> {
  const trade = await getTrade(tradeId);
  if (!trade) return;

  const text = tradeToText(trade);
  const embedding = await createEmbedding(text);

  await upsertEmbedding({
    type: "trade",
    refId: trade.id,
    date: trade.date,
    text,
    embedding,
  });
}

export async function indexJournalEmbedding(journalId: string): Promise<void> {
  const journal = await getJournal(journalId);
  if (!journal) return;

  const text = journalToText(journal);
  const embedding = await createEmbedding(text);

  await upsertEmbedding({
    type: "journal",
    refId: journal.id,
    date: journal.date,
    text,
    embedding,
  });
}

export async function generateDailyReview(date: string = todayISO()): Promise<CoachReview> {
  const client = await getOpenAIClient();
  if (!client) {
    throw new Error("OpenAI API key not configured. Add OPENAI_API_KEY to .env.local.");
  }

  const trades = await listTrades(date);
  const journal = await getJournalForDate(date);
  const allTrades = await listTrades();
  const dayStats = computeDayStats(date, trades);
  const allStats = computeTradeStats(allTrades);

  const queryText = [
    `Daily review for ${date}`,
    statsSummary(dayStats),
    journal ? journalToText(journal) : "No journal entry for today.",
    ...trades.map(tradeToText),
  ].join("\n\n");

  const queryEmbedding = await createEmbedding(queryText);
  const relevant = retrieveRelevantChunks(queryEmbedding, await listEmbeddings(), 10);

  const userPrompt = `Generate my end-of-day coaching review for ${date}.

## Today's stats
${statsSummary(dayStats)}

## All-time stats (for context)
${statsSummary(allStats)}

## Today's journal
${journal ? journalToText(journal) : "No journal written today."}

## Today's trades (${trades.length})
${
  trades.length
    ? trades.map(tradeToText).join("\n\n---\n\n")
    : "No trades logged today."
}

## Retrieved memories from my history (RAG)
${formatRetrievedContext(relevant)}

Respond in this exact structure:

Summary:
<2-4 sentence honest overview>

Strengths:
- <strength 1>
- <strength 2>

Weaknesses:
- <weakness 1>
- <weakness 2>

Action Items:
- <action 1>
- <action 2>
- <action 3>

Encouragement:
<1-2 warm sentences>`;

  const completion = await client.chat.completions.create({
    model: await getActiveOpenAIModel(),
    messages: [
      { role: "system", content: WENDY_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
  });

  const content = completion.choices[0]?.message?.content ?? "";
  const parsed = parseReviewResponse(content);

  return saveReview({ date, ...parsed });
}

export async function chatWithWendy(
  message: string,
  date: string = todayISO(),
  history: { role: "user" | "assistant"; content: string }[] = []
): Promise<string> {
  const client = await getOpenAIClient();
  if (!client) {
    throw new Error("OpenAI API key not configured. Add OPENAI_API_KEY to .env.local.");
  }

  const trades = await listTrades(date);
  const journal = await getJournalForDate(date);
  const dayStats = computeDayStats(date, trades);
  const queryEmbedding = await createEmbedding(message);
  const relevant = retrieveRelevantChunks(queryEmbedding, await listEmbeddings(), 8);

  const contextBlock = `Today's context (${date}):
${statsSummary(dayStats)}
${journal ? journalToText(journal) : "No journal entry today."}

Retrieved memories from trading history:
${formatRetrievedContext(relevant)}`;

  const completion = await client.chat.completions.create({
    model: await getActiveOpenAIModel(),
    messages: [
      {
        role: "system",
        content: `${WENDY_SYSTEM_PROMPT}\n\nUse the trader's data below when relevant:\n\n${contextBlock}`,
      },
      ...history.map((entry) => ({
        role: entry.role as "user" | "assistant",
        content: entry.content,
      })),
      { role: "user", content: message },
    ],
    temperature: 0.8,
  });

  return completion.choices[0]?.message?.content ?? "I couldn't generate a response. Try again.";
}

export { getReviewForDate };
