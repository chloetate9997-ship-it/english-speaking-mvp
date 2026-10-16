import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createOpenAiClient } from "@/lib/openai/client";
import { transcribeRecording } from "@/lib/openai/transcribe";
import { generateRetellFeedback } from "@/lib/openai/generate-feedback";
import { lesson01 } from "@/lib/mock-data/lessons";
import { allowedRecordingMimes, maxRecordingBytes } from "@/lib/data/retell-results";

const PROCESSING = new Set(["transcribing", "analyzing"]);

function lessonContext(lessonId: string, selectedSegmentIds: string[]) {
  if (lessonId !== lesson01.id) {
    return { title: lessonId, referenceEnglish: "", scopeLabel: "整篇" };
  }
  const selected =
    selectedSegmentIds.length > 0
      ? lesson01.segments.filter((s) => selectedSegmentIds.includes(s.id))
      : lesson01.segments;
  const scopeLabel = selectedSegmentIds.length > 0 ? `分段(${selected.length}段)` : "整篇";
  return {
    title: lesson01.title,
    referenceEnglish: selected.map((s) => s.englishText).join("\n"),
    scopeLabel,
  };
}

export async function POST(req: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "云端功能未配置。" }, { status: 503 });
  }
  const client = createOpenAiClient();
  if (!client) {
    return NextResponse.json(
      { error: "AI 服务尚未配置，请设置 OPENAI_API_KEY 后重试。可先查看演示反馈。" },
      { status: 503 },
    );
  }
  let resultId = "";
  try {
    const body: unknown = await req.json();
    resultId = (body as { resultId?: string }).resultId?.trim() ?? "";
  } catch {
    return NextResponse.json({ error: "请求格式错误。" }, { status: 400 });
  }
  if (!resultId) return NextResponse.json({ error: "缺少 resultId。" }, { status: 400 });

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return NextResponse.json({ error: "请先登录。" }, { status: 401 });

  const { data: row, error } = await supabase
    .from("retell_results")
    .select("*")
    .eq("id", resultId)
    .eq("user_id", userId)
    .single();
  if (error || !row) {
    return NextResponse.json({ error: "记录不存在或无权访问。" }, { status: 404 });
  }
  // 数据库原子抢占：仅 uploaded/failed 可进入处理，单次带原状态条件的
  // update 决定唯一胜者；未抢到者按当前状态返回，不调用付费 API。
  const { data: claimed, error: claimError } = await supabase
    .from("retell_results")
    .update({ status: "transcribing" })
    .eq("id", resultId)
    .eq("user_id", userId)
    .in("status", ["uploaded", "failed"])
    .select("*")
    .single();
  if (claimError || !claimed) {
    const { data: current } = await supabase
      .from("retell_results")
      .select("status")
      .eq("id", resultId)
      .eq("user_id", userId)
      .single();
    const status = (current?.status as string | undefined) ?? (row.status as string);
    if (status === "completed") {
      return NextResponse.json({ resultId, status: "completed" }, { status: 200 });
    }
    if (PROCESSING.has(status)) {
      return NextResponse.json({ resultId, status }, { status: 409 });
    }
    return NextResponse.json(
      { error: "该记录当前不可分析，请刷新后重试。", resultId, status },
      { status: 422 },
    );
  }
  const claimedRow = claimed as typeof row;

  try {
    let transcript: string = ((claimedRow.transcript as string) ?? "").trim();
    if (!transcript) {
      if (!claimedRow.recording_path) {
        await supabase.from("retell_results").update({ status: "failed" }).eq("id", resultId);
        return NextResponse.json({ error: "缺少录音文件，无法分析。" }, { status: 422 });
      }
      const { data: blob, error: dlError } = await supabase.storage
        .from("retell-recordings")
        .download(claimedRow.recording_path as string);
      if (dlError || !blob) {
        await supabase.from("retell_results").update({ status: "failed" }).eq("id", resultId);
        return NextResponse.json({ error: "录音下载失败，已保留录音，可重试。" }, { status: 502 });
      }
      const mime = (blob.type || "").split(";")[0].trim().toLowerCase();
      const allowed = allowedRecordingMimes.some(
        (m) => m.split(";")[0].trim().toLowerCase() === mime,
      );
      if (!allowed) {
        await supabase.from("retell_results").update({ status: "failed" }).eq("id", resultId);
        return NextResponse.json({ error: "不支持的音频格式。" }, { status: 415 });
      }
      if (blob.size === 0) {
        await supabase.from("retell_results").update({ status: "failed" }).eq("id", resultId);
        return NextResponse.json({ error: "录音为空，请重新录制。" }, { status: 422 });
      }
      if (blob.size > maxRecordingBytes) {
        await supabase.from("retell_results").update({ status: "failed" }).eq("id", resultId);
        return NextResponse.json({ error: "录音过大（超过 25 MB），请缩短后重试。" }, { status: 413 });
      }
      const ext = (claimedRow.recording_path as string).split(".").pop() ?? "webm";
      const file = new File([blob], `recording.${ext}`, { type: blob.type || "audio/webm" });
      try {
        transcript = await transcribeRecording(client, file);
      } catch {
        await supabase.from("retell_results").update({ status: "failed" }).eq("id", resultId);
        return NextResponse.json({ error: "AI 暂时不可用，录音已保留，可重试。" }, { status: 502 });
      }
      if (!transcript) {
        await supabase
          .from("retell_results")
          .update({ transcript: "", status: "failed" })
          .eq("id", resultId);
        return NextResponse.json(
          { error: "未能识别到有效英文内容，请靠近麦克风重试。", resultId, status: "failed" },
          { status: 422 },
        );
      }
      const saved = await supabase
        .from("retell_results")
        .update({ transcript, status: "analyzing" })
        .eq("id", resultId);
      if (saved.error) return NextResponse.json({ error: "保存失败，请重试。" }, { status: 500 });
    } else {
      await supabase.from("retell_results").update({ status: "analyzing" }).eq("id", resultId);
    }

    const ctx = lessonContext(
      claimedRow.lesson_id as string,
      (claimedRow.selected_segment_ids as string[]) ?? [],
    );
    let feedback;
    try {
      feedback = await generateRetellFeedback(client, {
        lessonTitle: ctx.title,
        scope: `${claimedRow.scope as string} · ${ctx.scopeLabel}`,
        referenceEnglish: ctx.referenceEnglish,
        transcript,
      });
    } catch (e) {
      await supabase.from("retell_results").update({ status: "failed" }).eq("id", resultId);
      const msg =
        e instanceof Error && e.message === "feedback_validation_failed"
          ? "AI 返回格式异常，已保留录音，可重试。"
          : "AI 暂时不可用，录音已保留，可重试。";
      const status = msg.includes("暂时不可用") ? 502 : 500;
      return NextResponse.json({ error: msg, resultId, status: "failed" }, { status });
    }

    const done = await supabase
      .from("retell_results")
      .update({
        transcript,
        content_score: feedback.contentScore,
        covered_points: feedback.coveredPoints,
        missed_points: feedback.missedPoints,
        language_suggestions: feedback.languageSuggestions,
        natural_version: feedback.naturalVersion,
        next_exercise: feedback.nextExercise,
        status: "completed",
      })
      .eq("id", resultId);
    if (done.error) return NextResponse.json({ error: "保存失败，请重试。" }, { status: 500 });
    return NextResponse.json(
      {
        resultId,
        status: "completed",
        contentScore: feedback.contentScore,
      },
      { status: 200 },
    );
  } catch {
    await supabase.from("retell_results").update({ status: "failed" }).eq("id", resultId);
    return NextResponse.json({ error: "AI 暂时不可用，录音已保留，可重试。" }, { status: 502 });
  }
}
