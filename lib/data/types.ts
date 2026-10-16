export type DataResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export const friendlyError = "云端同步失败，请稍后重试。";

export interface LessonRow {
  id: string;
  order_no: number;
  title: string;
  subtitle: string;
  duration_seconds: number;
  audio_url: string;
  status: string;
  published: boolean;
}

export interface NoteRow {
  id: string;
  user_id: string;
  lesson_id: string;
  segment_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ProgressRow {
  id: string;
  user_id: string;
  lesson_id: string;
  status: string;
  progress_seconds: number;
  last_studied_at: string | null;
}

export interface RetellResultRow {
  id: string;
  user_id: string;
  lesson_id: string;
  scope: string;
  selected_segment_ids: string[];
  recording_path: string | null;
  transcript: string;
  content_score: number | null;
  covered_points: string[];
  missed_points: string[];
  language_suggestions: string[];
  natural_version: string;
  next_exercise: string;
  status: string;
  created_at: string;
}
