"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SurfaceCard } from "@/components/ui/surface-card";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import { listProgress, type ProgressEntry } from "@/lib/data/progress";
import { getLessonSummary, lessonNoteSummaries } from "@/lib/mock-data/lessons";

export function HistoryExperience() {
  const [demo, setDemo] = useState(true);
  const [entries, setEntries] = useState<ProgressEntry[] | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!data.user) {
          setLoading(false);
          return;
        }
        setLoggedIn(true);
        const result = await listProgress();
        if (cancelled) return;
        if (result.ok) {
          setDemo(false);
          setEntries(result.data);
        }
      } catch {
        /* 保持演示数据 */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <SurfaceCard>
        <p className="py-6 text-center text-sm text-subtle">正在加载学习记录…</p>
      </SurfaceCard>
    );
  }

  if (demo) {
    return (
      <div className="space-y-3">
        <p role="status" className="rounded-lg bg-warm p-3 text-center text-xs text-ink">
          {isSupabaseConfigured && !loggedIn
            ? "演示数据展示，登录后查看你的真实记录。"
            : "演示模式：展示示例数据，登录并配置云端后显示真实记录。"}
        </p>
        {lessonNoteSummaries.map((item) => (
          <SurfaceCard className="flex items-center gap-3" key={item.lessonId}>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">
                <span className="mr-1.5 font-bold tabular-nums text-subtle">
                  {String(item.order).padStart(2, "0")}
                </span>
                {item.title}
              </p>
              <p className="mt-1 text-xs text-subtle">
                {item.noteCount > 0
                  ? `${item.noteCount} 条笔记 · ${item.lastRecordedAt}`
                  : "暂无记录"}
              </p>
            </div>
            {item.lessonId === "lesson-01" ? (
              <Link
                aria-label={`查看${item.title}的笔记`}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-subtle"
                href={`/lessons/${item.lessonId}/notes`}
              >
                <ChevronRight aria-hidden className="size-5" />
              </Link>
            ) : (
              <ChevronRight aria-hidden className="size-5 shrink-0 text-subtle" />
            )}
          </SurfaceCard>
        ))}
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <SurfaceCard>
        <div className="space-y-2 py-8 text-center">
          <p className="text-sm font-semibold text-ink">还没有学习记录</p>
          <p className="text-xs text-subtle">学完第一课后，这里会显示你的进度。</p>
          <Link
            className="inline-block pt-1 text-sm font-semibold text-accent-red"
            href="/lessons/lesson-01"
          >
            去学习第一课
          </Link>
        </div>
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const summary = getLessonSummary(entry.lessonId);
        return (
          <SurfaceCard className="flex items-center gap-3" key={entry.lessonId}>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">
                {summary?.title ?? entry.lessonId}
              </p>
              <p className="mt-1 text-xs text-subtle">
                {entry.status === "completed" ? "已完成" : "学习中"}
                {entry.lastStudiedAt
                  ? ` · ${new Date(entry.lastStudiedAt).toLocaleDateString("zh-CN")}`
                  : ""}
              </p>
            </div>
            <ChevronRight aria-hidden className="size-5 shrink-0 text-subtle" />
          </SurfaceCard>
        );
      })}
    </div>
  );
}
