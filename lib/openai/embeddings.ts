import "server-only";
import type OpenAI from "openai";

export function embeddingModel(): string {
  return process.env.OPENAI_EMBEDDING_MODEL?.trim() || "text-embedding-3-small";
}

export async function embedText(client: OpenAI, text: string): Promise<number[]> {
  const cleaned = text.trim().slice(0, 4000);
  if (!cleaned) throw new Error("empty_embed_text");
  const res = await client.embeddings.create({
    model: embeddingModel(),
    input: cleaned,
  });
  const vec = res.data[0]?.embedding;
  if (!vec || vec.length !== 1536) throw new Error("embedding_dim_mismatch");
  return vec;
}
