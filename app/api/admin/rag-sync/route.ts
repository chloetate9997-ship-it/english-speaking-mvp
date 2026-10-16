import { NextResponse } from "next/server";
import { createOpenAiClient } from "@/lib/openai/client";
import { createServiceClient } from "@/lib/supabase/service";
import { backfillSeededEmbeddings } from "@/lib/agent/rag-backfill";
import {
  isAuthorizedSyncRequest,
  parseSyncBearerToken,
  readRagSyncSecret,
} from "@/lib/agent/rag-sync-auth";

/**
 * POST /api/admin/rag-sync
 *
 * Vercel 初始化专用：为 lesson-01 的种子 knowledge chunks 回填真实 embedding。
 * - 鉴权：Authorization: Bearer <RAG_SYNC_SECRET>，缺失/错误 → 401；不透露原因。
 * - 密钥只在服务端读取；成功只返回 updated 数量；错误只返回状态码 + 简短原因。
 * - 幂等：仅更新 embedding 为空的行，重复执行返回 0 且不产生重复数据。
 */
export async function POST(req: Request) {
  const expected = readRagSyncSecret();
  if (!expected) {
    return NextResponse.json({ error: "同步未配置。" }, { status: 503 });
  }
  const provided = parseSyncBearerToken(req.headers.get("authorization"));
  if (!isAuthorizedSyncRequest(provided, expected)) {
    return NextResponse.json({ error: "未授权。" }, { status: 401 });
  }

  const openai = createOpenAiClient();
  if (!openai) {
    return NextResponse.json({ error: "AI 服务未配置。" }, { status: 503 });
  }
  let admin;
  try {
    admin = createServiceClient();
  } catch {
    return NextResponse.json({ error: "服务端存储未配置。" }, { status: 503 });
  }

  try {
    const updated = await backfillSeededEmbeddings(admin, openai, "lesson-01");
    return NextResponse.json({ lessonId: "lesson-01", updated }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "同步失败。";
    const status = message.startsWith("backfill_read_failed") ? 502 : 500;
    return NextResponse.json({ error: "同步失败，请重试。" }, { status });
  }
}
