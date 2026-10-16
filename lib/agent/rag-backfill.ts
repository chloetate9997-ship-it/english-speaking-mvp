import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type OpenAI from "openai";
import { embedText } from "@/lib/openai/embeddings";
import { lesson01 } from "@/lib/mock-data/lessons";

/**
 * 回填种子 knowledge chunks（supabase/migrations/004_agent_rag.sql 的 8 条）
 * 的真实 embedding：按 id 原地 update，不新增行；重复执行结果一致（幂等）。
 */
export async function backfillSeededEmbeddings(
  admin: SupabaseClient,
  openai: OpenAI,
  lessonId: string,
): Promise<number> {
  if (lessonId !== lesson01.id) throw new Error("only_lesson_01_supported");
  const { data, error } = await admin
    .from("knowledge_chunks")
    .select("id, content")
    .eq("lesson_id", lessonId)
    .is("embedding", null);
  if (error) throw new Error(`backfill_read_failed: ${error.message}`);
  let updated = 0;
  for (const row of (data ?? []) as Array<{ id: string; content: string }>) {
    const embedding = await embedText(openai, row.content);
    const { error: updateError } = await admin
      .from("knowledge_chunks")
      .update({ embedding })
      .eq("id", row.id);
    if (updateError) throw new Error(`backfill_update_failed: ${updateError.message}`);
    updated++;
  }
  return updated;
}
