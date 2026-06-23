const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small";

export function getOpenAIApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY?.trim() || undefined;
}

export function isOpenAIConfigured(): boolean {
  return Boolean(getOpenAIApiKey());
}

export function resolveOpenAIModel(userModel?: string): string {
  return process.env.OPENAI_MODEL?.trim() || userModel || DEFAULT_MODEL;
}

export function resolveOpenAIEmbeddingModel(userModel?: string): string {
  return process.env.OPENAI_EMBEDDING_MODEL?.trim() || userModel || DEFAULT_EMBEDDING_MODEL;
}

export function requireOpenAIApiKey(): string {
  const key = getOpenAIApiKey();
  if (!key) {
    throw new Error(
      "OpenAI API key not configured. Add OPENAI_API_KEY to .env.local on the server."
    );
  }
  return key;
}
