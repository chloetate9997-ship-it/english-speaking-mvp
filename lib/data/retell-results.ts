"use client";

import { createClient } from "@/lib/supabase/client";
import { friendlyError, type DataResult, type RetellResultRow } from "./types";

export const maxRecordingBytes = 25 * 1024 * 1024;
export const allowedRecordingMimes = [
  "audio/webm",
  "audio/webm;codecs=opus",
  "audio/mp4",
  "audio/mpeg",
  "audio/ogg",
  "audio/ogg;codecs=opus",
  "audio/wav",
  "audio/x-m4a",
];

function extensionFor(mime: string): string {
  if (mime.includes("mp4") || mime.includes("m4a")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("mpeg")) return "mp3";
  return "webm";
}

export interface StoredRetellResult {
  id: string;
  lessonId: string;
  scope: string;
  recordingPath: string | null;
  signedAudioUrl: string | null;
  createdAt: string;
  status: string;
  transcript: string;
  contentScore: number | null;
  coveredPoints: string[];
  missedPoints: string[];
  languageSuggestions: string[];
  naturalVersion: string;
  nextExercise: string;
}

export async function uploadRecording(input: {
  blob: Blob;
  lessonId: string;
}): Promise<DataResult<{ path: string }>> {
  const normalizedMime = input.blob.type.split(";")[0].trim().toLowerCase();
  const supported = allowedRecordingMimes.some(
    (mime) => mime.split(";")[0].trim().toLowerCase() === normalizedMime,
  );
  if (!supported) return { ok: false, error: "当前录音格式不受支持，请重试。" };
  if (input.blob.size === 0) return { ok: false, error: "没有录到有效声音，请重试。" };
  if (input.blob.size > maxRecordingBytes) {
    return { ok: false, error: "录音超过 25 MB，请缩短后重试。" };
  }

  try {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return { ok: false, error: "请先登录后再上传录音。" };
    const randomId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}`;
    const path = `${userId}/${input.lessonId}/${randomId}.${extensionFor(normalizedMime)}`;
    const { error } = await supabase.storage
      .from("retell-recordings")
      .upload(path, input.blob, { contentType: input.blob.type || normalizedMime });
    if (error) return { ok: false, error: friendlyError };
    return { ok: true, data: { path } };
  } catch {
    return { ok: false, error: friendlyError };
  }
}

export async function createRetellResult(input: {
  lessonId: string;
  scope: string;
  selectedSegmentIds: string[];
  recordingPath: string | null;
  transcript?: string;
}): Promise<DataResult<{ id: string }>> {
  try {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return { ok: false, error: "请先登录后再保存复述记录。" };
    const { data, error } = await supabase
      .from("retell_results")
      .insert({
        user_id: userId,
        lesson_id: input.lessonId,
        scope: input.scope,
        selected_segment_ids: input.selectedSegmentIds,
        recording_path: input.recordingPath,
        transcript: input.transcript ?? "",
        status: "uploaded",
      })
      .select("id")
      .single();
    if (error || !data) return { ok: false, error: friendlyError };
    return { ok: true, data: { id: (data as { id: string }).id } };
  } catch {
    return { ok: false, error: friendlyError };
  }
}

export async function getRetellResult(
  id: string,
): Promise<DataResult<StoredRetellResult>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("retell_results")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return { ok: false, error: "记录不存在或无权访问。" };
    const row = data as RetellResultRow;
    let signedAudioUrl: string | null = null;
    if (row.recording_path) {
      const { data: signed, error: signError } = await supabase.storage
        .from("retell-recordings")
        .createSignedUrl(row.recording_path, 600);
      if (!signError && signed) signedAudioUrl = signed.signedUrl;
    }
    return {
      ok: true,
      data: {
        id: row.id,
        lessonId: row.lesson_id,
        scope: row.scope,
        recordingPath: row.recording_path,
        signedAudioUrl,
        createdAt: row.created_at,
        status: row.status,
        transcript: row.transcript ?? "",
        contentScore: row.content_score,
        coveredPoints: row.covered_points ?? [],
        missedPoints: row.missed_points ?? [],
        languageSuggestions: row.language_suggestions ?? [],
        naturalVersion: row.natural_version ?? "",
        nextExercise: (row as { next_exercise?: string }).next_exercise ?? "",
      },
    };
  } catch {
    return { ok: false, error: friendlyError };
  }
}
