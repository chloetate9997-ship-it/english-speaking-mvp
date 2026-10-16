"use client";

import { createClient } from "@/lib/supabase/client";
import { friendlyError, type DataResult, type NoteRow } from "./types";

export interface CloudNote {
  id: string;
  lessonId: string;
  segmentId: string | null;
  content: string;
  updatedAt: string;
}

function toNote(row: NoteRow): CloudNote {
  return {
    id: row.id,
    lessonId: row.lesson_id,
    segmentId: row.segment_id,
    content: row.content,
    updatedAt: row.updated_at,
  };
}

export async function listNotes(lessonId: string): Promise<DataResult<CloudNote[]>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("lesson_id", lessonId)
      .order("updated_at", { ascending: false });
    if (error || !data) return { ok: false, error: friendlyError };
    return { ok: true, data: (data as NoteRow[]).map(toNote) };
  } catch {
    return { ok: false, error: friendlyError };
  }
}

export async function createNote(input: {
  lessonId: string;
  segmentId?: string | null;
  content: string;
}): Promise<DataResult<CloudNote>> {
  try {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return { ok: false, error: "请先登录后再保存到云端。" };
    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: userId,
        lesson_id: input.lessonId,
        segment_id: input.segmentId ?? null,
        content: input.content,
      })
      .select("*")
      .single();
    if (error || !data) return { ok: false, error: friendlyError };
    return { ok: true, data: toNote(data as NoteRow) };
  } catch {
    return { ok: false, error: friendlyError };
  }
}

export async function updateNote(
  id: string,
  content: string,
): Promise<DataResult<CloudNote>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("notes")
      .update({ content })
      .eq("id", id)
      .select("*")
      .single();
    if (error || !data) return { ok: false, error: friendlyError };
    return { ok: true, data: toNote(data as NoteRow) };
  } catch {
    return { ok: false, error: friendlyError };
  }
}

export async function deleteNote(id: string): Promise<DataResult<null>> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) return { ok: false, error: friendlyError };
    return { ok: true, data: null };
  } catch {
    return { ok: false, error: friendlyError };
  }
}
