"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { SurfaceCard } from "@/components/ui/surface-card";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import { createNote, deleteNote, listNotes, updateNote } from "@/lib/data/notes";

interface SeedNote {
  id: string;
  content: string;
}

interface NotesExperienceProps {
  lessonId: string;
  seedNotes: SeedNote[];
}

interface EditableNote {
  id: string;
  content: string;
}

function storageKey(lessonId: string) {
  return `demo-notes:${lessonId}`;
}

function loadLocal(lessonId: string, seeds: SeedNote[]): EditableNote[] {
  try {
    const raw = window.localStorage.getItem(storageKey(lessonId));
    if (!raw) return seeds;
    const parsed = JSON.parse(raw) as EditableNote[];
    if (!Array.isArray(parsed)) return seeds;
    return parsed.filter(
      (item): item is EditableNote =>
        typeof item?.id === "string" && typeof item?.content === "string",
    );
  } catch {
    return seeds;
  }
}

export function NotesExperience({ lessonId, seedNotes }: NotesExperienceProps) {
  const [mode, setMode] = useState<"demo" | "cloud">("demo");
  const [notes, setNotes] = useState<EditableNote[]>(() => {
    if (typeof window === "undefined" || isSupabaseConfigured) return seedNotes;
    return loadLocal(lessonId, seedNotes);
  });
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!data.user) {
          setNotes(loadLocal(lessonId, seedNotes));
          return;
        }
        const result = await listNotes(lessonId);
        if (cancelled) return;
        if (result.ok) {
          setMode("cloud");
          setNotes(result.data.map((note) => ({ id: note.id, content: note.content })));
        } else {
          setNotes(loadLocal(lessonId, seedNotes));
          setNotice(result.error);
        }
      } catch {
        if (!cancelled) setNotes(loadLocal(lessonId, seedNotes));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lessonId, seedNotes]);

  function persistLocal(next: EditableNote[]) {
    setNotes(next);
    try {
      window.localStorage.setItem(storageKey(lessonId), JSON.stringify(next));
    } catch {
      setNotice("浏览器存储失败，修改仅保留在当前页面。");
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content) {
      setFormError("请输入笔记内容。");
      return;
    }
    setFormError(null);
    if (mode === "cloud") {
      setSaving(true);
      const result = await createNote({ lessonId, content });
      setSaving(false);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      setNotes((previous) => [{ id: result.data.id, content }, ...previous]);
      setDraft("");
      return;
    }
    persistLocal([{ id: `local-${Date.now()}`, content }, ...notes]);
    setDraft("");
  }

  async function handleUpdate(id: string) {
    const content = editingContent.trim();
    if (!content) {
      setFormError("笔记内容不能为空。");
      return;
    }
    setFormError(null);
    if (mode === "cloud") {
      setSaving(true);
      const result = await updateNote(id, content);
      setSaving(false);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      setNotes((previous) =>
        previous.map((note) => (note.id === id ? { ...note, content } : note)),
      );
      setEditingId(null);
      return;
    }
    persistLocal(
      notes.map((note) => (note.id === id ? { ...note, content } : note)),
    );
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    if (mode === "cloud") {
      const result = await deleteNote(id);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      setNotes((previous) => previous.filter((note) => note.id !== id));
      setConfirmDeleteId(null);
      return;
    }
    persistLocal(notes.filter((note) => note.id !== id));
    setConfirmDeleteId(null);
  }

  return (
    <div className="space-y-4">
      {mode === "demo" ? (
        <p role="status" className="rounded-lg bg-warm p-3 text-center text-xs text-ink">
          {isSupabaseConfigured ? (
            <>
              未登录：笔记仅保存在此浏览器，
              <Link className="font-semibold text-accent-red" href="/login">
                去登录
              </Link>
            </>
          ) : (
            "演示模式：笔记仅保存在此浏览器"
          )}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="rounded-lg bg-warm p-3 text-center text-xs text-ink">
          {notice}
        </p>
      ) : null}

      <form className="space-y-3 rounded-lg bg-card p-4 shadow-card" onSubmit={handleCreate}>
        <label className="block text-sm font-semibold text-ink" htmlFor="note-draft">
          写一条新笔记
        </label>
        <textarea
          className="min-h-20 w-full rounded-button border border-line bg-canvas p-3 text-sm text-ink"
          disabled={saving}
          id="note-draft"
          onChange={(event) => setDraft(event.target.value)}
          placeholder="例如：回应不同意见时，先表示理解，再给出理由。"
          value={draft}
        />
        {formError ? (
          <p role="alert" className="text-xs text-accent-red">
            {formError}
          </p>
        ) : null}
        <button
          className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-button bg-ink text-sm font-semibold text-white disabled:opacity-40"
          disabled={saving || !draft.trim()}
          type="submit"
        >
          <Plus aria-hidden className="size-4" />
          {saving ? "保存中…" : mode === "cloud" ? "保存到云端" : "保存在此浏览器"}
        </button>
      </form>

      <div className="space-y-3">
        {notes.length === 0 ? (
          <SurfaceCard>
            <p className="py-6 text-center text-sm text-subtle">还没有笔记，写下第一条吧。</p>
          </SurfaceCard>
        ) : (
          notes.map((note, index) => (
            <SurfaceCard className="min-h-[72px]" key={note.id}>
              <div className="flex items-start gap-3">
                <span className="text-sm font-bold tabular-nums text-accent-red">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  {editingId === note.id ? (
                    <div className="space-y-2">
                      <textarea
                        aria-label="编辑笔记"
                        className="min-h-16 w-full rounded-button border border-line bg-canvas p-2.5 text-sm text-ink"
                        onChange={(event) => setEditingContent(event.target.value)}
                        value={editingContent}
                      />
                      <div className="flex gap-2">
                        <button
                          className="inline-flex h-9 flex-1 items-center justify-center rounded-button bg-ink text-xs font-semibold text-white"
                          onClick={() => void handleUpdate(note.id)}
                          type="button"
                        >
                          保存
                        </button>
                        <button
                          className="inline-flex h-9 flex-1 items-center justify-center rounded-button border border-line text-xs font-semibold text-ink"
                          onClick={() => setEditingId(null)}
                          type="button"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed text-ink">{note.content}</p>
                  )}
                </div>
                {editingId === note.id ? null : (
                  <div className="flex shrink-0 gap-1">
                    <button
                      aria-label="编辑笔记"
                      className="inline-flex size-9 items-center justify-center rounded-full text-subtle hover:bg-muted"
                      onClick={() => {
                        setEditingId(note.id);
                        setEditingContent(note.content);
                        setConfirmDeleteId(null);
                      }}
                      type="button"
                    >
                      <Pencil aria-hidden className="size-4" />
                    </button>
                    {confirmDeleteId === note.id ? (
                      <span className="flex gap-1">
                        <button
                          aria-label="确认删除笔记"
                          className="inline-flex h-9 items-center justify-center rounded-full bg-accent-red px-3 text-xs font-semibold text-white"
                          onClick={() => void handleDelete(note.id)}
                          type="button"
                        >
                          确认
                        </button>
                        <button
                          aria-label="取消删除"
                          className="inline-flex size-9 items-center justify-center rounded-full border border-line text-xs text-ink"
                          onClick={() => setConfirmDeleteId(null)}
                          type="button"
                        >
                          ✕
                        </button>
                      </span>
                    ) : (
                      <button
                        aria-label="删除笔记"
                        className="inline-flex size-9 items-center justify-center rounded-full text-subtle hover:bg-muted"
                        onClick={() => setConfirmDeleteId(note.id)}
                        type="button"
                      >
                        <Trash2 aria-hidden className="size-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </SurfaceCard>
          ))
        )}
      </div>
    </div>
  );
}
