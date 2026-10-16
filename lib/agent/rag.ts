import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type OpenAI from "openai";
import { embedText } from "@/lib/openai/embeddings";
import { lesson01, lesson01Notes, demoRetellResult } from "@/lib/mock-data/lessons";

export interface KnowledgeChunk {
  id: string;
  lesson_id: string;
  segment_id: string | null;
  content_type: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

function chunkText(english: string, chinese: string, extra = ""): string {
  return `${english}\n${chinese}${extra ? `\n${extra}` : ""}`.slice(0, 2000);
}

export function buildLesson01Chunks(): Array<{
  id: string;
  lesson_id: string;
  segment_id: string | null;
  content_type: string;
  content: string;
  metadata: Record<string, unknown>;
}> {
  const chunks: Array<{
  id: string;
  lesson_id: string;
  segment_id: string | null;
  content_type: string;
  content: string;
  metadata: Record<string, unknown>;
}> = lesson01.segments.map((s) => ({
    id: `lesson-01-${s.id}`,
    lesson_id: lesson01.id,
    segment_id: s.id,
    content_type: "segment",
    content: chunkText(s.englishText, s.chineseText, `keywords: ${s.keywords.join(", ")}`),
    metadata: { order: s.order },
  }));
  for (const n of lesson01Notes) {
    chunks.push({
      id: `lesson-01-note-${n.id}`,
      lesson_id: lesson01.id,
      segment_id: null,
      content_type: "expression",
      content: chunkText(n.english, n.chinese, "lesson-01 target expression"),
      metadata: { noteId: n.id },
    });
  }
  chunks.push({
    id: "lesson-01-example-natural",
    lesson_id: lesson01.id,
    segment_id: null,
    content_type: "example",
    content: chunkText(demoRetellResult.naturalVersion, "地道改写示例", demoRetellResult.nextExercise),
    metadata: { source: "demoRetellResult" },
  });
  return chunks;
}

export async function syncLessonKnowledge(
  admin: SupabaseClient,
  openai: OpenAI,
  lessonId: string,
): Promise<number> {
  if (lessonId !== lesson01.id) throw new Error("only_lesson_01_supported");
  const chunks = buildLesson01Chunks();
  for (const c of chunks) {
    const embedding = await embedText(openai, c.content);
    const { error } = await admin.from("knowledge_chunks").upsert(
      {
        id: c.id,
        lesson_id: c.lesson_id,
        segment_id: c.segment_id,
        content_type: c.content_type,
        content: c.content,
        metadata: c.metadata,
        embedding,
      },
      { onConflict: "id" },
    );
    if (error) throw new Error(`upsert_failed: ${error.message}`);
  }
  return chunks.length;
}

export async function retrieveKnowledge(
  admin: SupabaseClient,
  openai: OpenAI,
  input: { lessonId: string; scenario?: string; targetExpression?: string; userText: string; topK?: number },
): Promise<KnowledgeChunk[]> {
  if (!input.lessonId) throw new Error("missing_lesson_id");
  if (input.lessonId !== lesson01.id) throw new Error("only_lesson_01_supported");
  const query = [input.userText, input.targetExpression ?? "", input.scenario ?? ""]
    .join("\n")
    .slice(0, 2000);
  const embedding = await embedText(openai, query || input.lessonId);
  const topK = Math.min(10, Math.max(3, input.topK ?? 5));
  const { data, error } = await admin.rpc("match_knowledge_chunks", {
    p_lesson_id: input.lessonId,
    p_query_embedding: embedding,
    p_match_count: topK,
  });
  if (error) throw new Error(`retrieve_failed: ${error.message}`);
  return (data ?? []) as KnowledgeChunk[];
}

export async function getWeakExpressions(
  admin: SupabaseClient,
  userId: string,
  limit = 3,
): Promise<Array<{ expression_id: string; mastery: number; error_count: number }>> {
  const { data, error } = await admin
    .from("expression_progress")
    .select("expression_id, mastery, error_count")
    .eq("user_id", userId)
    .order("mastery", { ascending: true })
    .limit(limit);
  if (error) throw new Error(`weak_read_failed: ${error.message}`);
  return (data ?? []) as Array<{ expression_id: string; mastery: number; error_count: number }>;
}
