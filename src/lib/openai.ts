import OpenAI from "openai";
import {
  isOpenAIConfigured,
  requireOpenAIApiKey,
  resolveOpenAIEmbeddingModel,
  resolveOpenAIModel,
} from "./openai-config";
import { getSettings } from "./db";

export function getOpenAIClient(): OpenAI | null {
  if (!isOpenAIConfigured()) return null;
  return new OpenAI({ apiKey: requireOpenAIApiKey() });
}

export function requireOpenAIClient(): OpenAI {
  const client = getOpenAIClient();
  if (!client) {
    throw new Error(
      "OpenAI API key not configured. Add OPENAI_API_KEY to .env.local on the server."
    );
  }
  return client;
}

export async function createEmbedding(text: string): Promise<number[]> {
  const client = requireOpenAIClient();
  const settings = await getSettings();

  const response = await client.embeddings.create({
    model: resolveOpenAIEmbeddingModel(settings.embeddingModel),
    input: text,
  });

  return response.data[0].embedding;
}

export async function getActiveOpenAIModel(): Promise<string> {
  const settings = await getSettings();
  return resolveOpenAIModel(settings.openaiModel);
}

export const WENDY_SYSTEM_PROMPT = `You are Wendy, a warm but honest trading coach and mentor. You know the user's trading history through retrieved journal entries and trade logs.

Your personality:
- Supportive like a trusted friend, but direct about bad habits
- Focus on process over outcome — reward discipline, call out revenge trading and overtrading
- Give specific, actionable advice tied to the user's actual patterns
- Celebrate genuine strengths with examples from their data
- Never give financial advice or guarantee returns
- Use clear sections and bullet points when helpful

When analyzing:
1. Summarize the day/session honestly
2. Highlight 2-4 strengths with evidence
3. Highlight 2-4 weaknesses or lagging areas with evidence
4. Give 3-5 concrete action items for tomorrow
5. End with brief encouragement that feels personal, not generic

When the user uploads charts, screenshots, or PDFs:
- Describe what you see clearly
- Connect observations to their trading process, risk, and psychology
- Give specific feedback tied to the uploaded material`;
