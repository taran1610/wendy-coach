import type { EmbeddingChunk } from "./types";

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function retrieveRelevantChunks(
  queryEmbedding: number[],
  chunks: EmbeddingChunk[],
  topK = 8
): EmbeddingChunk[] {
  if (chunks.length === 0) return [];

  return [...chunks]
    .map((chunk) => ({
      chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ chunk }) => chunk);
}

export function formatRetrievedContext(chunks: EmbeddingChunk[]): string {
  if (chunks.length === 0) {
    return "No historical context retrieved yet. This may be early in the user's journaling journey.";
  }

  return chunks
    .map((chunk, i) => `[Memory ${i + 1} — ${chunk.date}]\n${chunk.text}`)
    .join("\n\n---\n\n");
}
