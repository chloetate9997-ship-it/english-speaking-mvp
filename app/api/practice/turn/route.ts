import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createOpenAiClient } from "@/lib/openai/client";
import { transcribeRecording } from "@/lib/openai/transcribe";
import { createServiceClient } from "@/lib/supabase/service";
import { getWeakExpressions, retrieveKnowledge } from "@/lib/agent/rag";
import { generateCoachTurn } from "@/lib/agent/coach";

const MAX_TURNS = 5;
const MAX_RETRIES = 2;

export async function POST(req: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "云端功能未配置。" }, { status: 503 });
  }
  const openai = createOpenAiClient();
  if (!openai) {
    return NextResponse.json(
      { error: "AI 服务尚未配置，请设置 OPENAI_API_KEY 后重试。" },
      { status: 503 },
    );
  }
  let body: {
    lessonId?: string;
    scenario?: string;
    sessionId?: string;
    transcript?: string;
    audioBase64?: string;
    audioMime?: string;
    history?: Array<{ role: string; text: string }>;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "请求格式错误。" }, { status: 400 });
  }
  const lessonId = body.lessonId?.trim() ?? "";
  if (!lessonId) return NextResponse.json({ error: "缺少 lessonId。" }, { status: 400 });
  if (lessonId !== "lesson-01") {
    return NextResponse.json({ error: "MVP 仅支持 lesson-01。" }, { status: 400 });
  }
  // 允许面试官免登录体验 AI 教练。访客进度仅保留在浏览器，
  // 登录用户则继续同步会话、轮次和掌握度到 Supabase。
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    userId = userData.user?.id ?? null;
  } catch {
    userId = null;
  }

  let transcript = body.transcript?.trim() ?? "";
  if (!transcript && body.audioBase64) {
    try {
      const buf = Buffer.from(body.audioBase64, "base64");
      if (buf.length === 0 || buf.length > 25 * 1024 * 1024) {
        return NextResponse.json({ error: "音频大小不合法。" }, { status: 413 });
      }
      const file = new File([buf], "speech.webm", {
        type: body.audioMime || "audio/webm",
      });
      transcript = await transcribeRecording(openai, file);
    } catch {
      return NextResponse.json({ error: "转写失败，请重试。" }, { status: 502 });
    }
  }
  if (!transcript) return NextResponse.json({ error: "缺少用户转写或音频。" }, { status: 400 });

  let admin;
  try {
    admin = createServiceClient();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "服务端存储未配置。" },
      { status: 503 },
    );
  }

  const scenario = body.scenario?.trim() || "朋友聚会讨论最伟大的发明";
  let sessionId = body.sessionId?.trim() ?? "";
  let turnNo = 1;
  if (!userId) {
    turnNo = (body.history ?? []).filter((item) => item.role === "user").length + 1;
    if (turnNo > MAX_TURNS) {
      return NextResponse.json({ error: "本轮练习已达 5 轮上限。" }, { status: 422 });
    }
    sessionId = sessionId || `guest-${crypto.randomUUID()}`;
  } else if (sessionId) {
    const { data: sess } = await admin
      .from("practice_sessions")
      .select("id, turn_count, status")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single();
    if (!sess || sess.status !== "active") {
      return NextResponse.json({ error: "会话不存在或已结束。" }, { status: 404 });
    }
    turnNo = (sess.turn_count as number) + 1;
    if (turnNo > MAX_TURNS) {
      return NextResponse.json({ error: "本轮练习已达 5 轮上限。" }, { status: 422 });
    }
  } else {
    const { data: sess, error } = await admin
      .from("practice_sessions")
      .insert({ user_id: userId, lesson_id: lessonId, scenario, status: "active" })
      .select("id")
      .single();
    if (error || !sess) return NextResponse.json({ error: "创建会话失败。" }, { status: 500 });
    sessionId = sess.id as string;
  }

  // 同一目标表达重试计数（查最近 turns）
  const { data: recentTurns } = userId
    ? await admin
        .from("practice_turns")
        .select("agent_action")
        .eq("session_id", sessionId)
        .order("turn_no", { ascending: false })
        .limit(3)
    : { data: [] };
  const retries = (recentTurns ?? []).filter(
    (t) => (t.agent_action as string) === "hint" || (t.agent_action as string) === "retry",
  ).length;
  if (retries >= MAX_RETRIES + 1 && turnNo > 1) {
    // 仍允许完成，但不再无限重试：强制进入下一题由模型决定
  }

  let weak: Array<{ expression_id: string; mastery: number }> = [];
  try {
    if (!userId) throw new Error("guest_mode");
    weak = await getWeakExpressions(admin, userId);
  } catch {
    weak = [];
  }
  const targetExpression =
    weak[0]?.expression_id ?? "lesson-01-exp-01";

  let knowledge;
  try {
    knowledge = await retrieveKnowledge(admin, openai, {
      lessonId,
      scenario,
      targetExpression,
      userText: transcript,
      topK: 5,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "检索失败。" },
      { status: 502 },
    );
  }

  let turn;
  try {
    turn = await generateCoachTurn(openai, {
      lessonId,
      scenario,
      targetExpression,
      history: body.history ?? [],
      transcript,
      knowledge,
      weak,
    });
  } catch {
    return NextResponse.json({ error: "AI 返回格式异常，请重试。" }, { status: 500 });
  }

  const completed = turn.sessionCompleted || turnNo >= MAX_TURNS;
  if (userId) {
    await admin.from("practice_turns").insert({
      session_id: sessionId,
      user_id: userId,
      turn_no: turnNo,
      agent_question: (body.history ?? []).slice(-1)[0]?.text ?? scenario,
      user_transcript: transcript,
      feedback: turn.reply,
      agent_action: completed ? "complete" : turn.action,
      target_expression_id: targetExpression,
      scores: turn.scores,
    });
    await admin
      .from("practice_sessions")
      .update({
        turn_count: turnNo,
        status: completed ? "completed" : "active",
        ended_at: completed ? new Date().toISOString() : null,
      })
      .eq("id", sessionId);

    const passed = turn.action === "continue" || turn.action === "complete";
    await admin.from("expression_progress").upsert(
      {
        user_id: userId,
        expression_id: targetExpression,
        mastery: passed ? 0.7 : 0.3,
        error_count: passed ? 0 : 1,
        last_practiced_at: new Date().toISOString(),
        next_review_at: new Date(Date.now() + (passed ? 3 : 1) * 864e5).toISOString(),
      },
      { onConflict: "user_id,expression_id" },
    );
  }

  return NextResponse.json({ sessionId, turnNo, ...turn, sessionCompleted: completed });
}
