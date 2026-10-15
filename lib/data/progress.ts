"use client";

import { createClient } from "@/lib/supabase/client";
import { friendlyError, type DataResult, type ProgressRow } from "./types";

export interface ProgressEntry {
  lessonId: string;
  status: string;
  progressSeconds: number;
  lastStudiedAt: string | null;
}

export async function listProgress(): Promise<DataResult<ProgressEntry[]>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("learning_progress").select("*");
    if (error || !data) return { ok: false, error: friendlyError };
    return {
      ok: true,
      data: (data as ProgressRow[]).map((row) => ({
        lessonId: row.lesson_id,
        status: row.status,
        progressSeconds: row.progress_seconds,
        lastStudiedAt: row.last_studied_at,
      })),
    };
  } catch {
    return { ok: false, error: friendlyError };
  }
}

export async function saveProgress(input: {
  lessonId: string;
  status?: string;
  progressSeconds?: number;
}): Promise<DataResult<null>> {
  try {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return { ok: false, error: "请先登录后再同步进度。" };
    const { error } = await supabase.from("learning_progress").upsert(
      {
        user_id: userId,
        lesson_id: input.lessonId,
        status: input.status ?? "in-progress",
        progress_seconds: Math.floor(input.progressSeconds ?? 0),
        last_studied_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" },
    );
    if (error) return { ok: false, error: friendlyError };
    return { ok: true, data: null };
  } catch {
    return { ok: false, error: friendlyError };
  }
}
