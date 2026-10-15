import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { LessonStatus, LessonSummary } from "@/lib/types";
import { lessonSummaries } from "@/lib/mock-data/lessons";
import { friendlyError, type DataResult, type LessonRow } from "./types";

function toSummary(row: LessonRow): LessonSummary {
  const status: LessonStatus =
    row.status === "completed" || row.status === "in-progress"
      ? row.status
      : "not-started";
  return {
    id: row.id,
    order: row.order_no,
    title: row.title,
    subtitle: row.subtitle,
    durationSeconds: row.duration_seconds,
    status,
  };
}

export async function fetchLessonSummaries(): Promise<
  DataResult<{ lessons: LessonSummary[]; demo: boolean }>
> {
  if (!isSupabaseConfigured) {
    return { ok: true, data: { lessons: lessonSummaries, demo: true } };
  }
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("lessons")
      .select("id,order_no,title,subtitle,duration_seconds,audio_url,status,published")
      .eq("published", true)
      .order("order_no");
    if (error || !data) return { ok: false, error: friendlyError };
    return { ok: true, data: { lessons: (data as LessonRow[]).map(toSummary), demo: false } };
  } catch {
    return { ok: false, error: friendlyError };
  }
}
