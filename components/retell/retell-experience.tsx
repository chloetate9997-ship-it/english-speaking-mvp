"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { LessonSegment } from "@/lib/types";
import { CustomSegmentSelector } from "@/components/audio/custom-segment-selector";
import { RetellPromptCard } from "@/components/retell/retell-prompt-card";
import { BrowserRecorder } from "@/components/retell/browser-recorder";
import { NoteRow } from "@/components/notes/note-row";
import { cn } from "@/lib/utils";

type RetellScope = "full" | "segment";

interface RetellExperienceProps {
  lessonId: string;
  segments: LessonSegment[];
  prompt: string;
}

export function RetellExperience({ lessonId, segments, prompt }: RetellExperienceProps) {
  const [scope, setScope] = useState<RetellScope>("full");
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    segments.map((segment) => segment.id),
  );
  const [selecting, setSelecting] = useState(false);

  const selectedSegments = segments.filter((segment) =>
    selectedIds.includes(segment.id),
  );
  const scopeLabel =
    scope === "full"
      ? "整篇复述 · 中文提示"
      : `分段复述 · 已选择 ${selectedSegments.length} 段`;
  const combinedPrompt =
    scope === "full"
      ? prompt
      : selectedSegments.map((segment) => segment.chineseText).join("");

  function confirmSelection(ids: string[]) {
    setSelectedIds(ids);
    setScope("segment");
    setSelecting(false);
  }

  if (selecting) {
    return (
      <CustomSegmentSelector
        confirmLabel="完成"
        description="点击选择，Shift+点击可快速选择连续范围"
        initialSelectedIds={scope === "segment" ? selectedIds : []}
        onCancel={() => setSelecting(false)}
        onConfirm={confirmSelection}
        segments={segments}
        title="选择复述片段"
        tone="retell"
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2" role="group" aria-label="复述范围">
        <button
          aria-pressed={scope === "full"}
          className={cn(
            "flex h-9 flex-1 items-center justify-center rounded-pill text-sm font-medium",
            scope === "full" ? "bg-ink text-white" : "bg-segment text-subtle",
          )}
          onClick={() => setScope("full")}
          type="button"
        >
          整篇
        </button>
        <button
          aria-pressed={scope === "segment"}
          className={cn(
            "flex h-9 flex-1 items-center justify-center rounded-pill text-sm font-medium",
            scope === "segment" ? "bg-ink text-white" : "bg-segment text-subtle",
          )}
          onClick={() => setSelecting(true)}
          type="button"
        >
          分段
        </button>
      </div>

      <RetellPromptCard prompt={combinedPrompt} scopeLabel={scopeLabel} />
      {scope === "segment" ? (
        <button
          className="inline-flex items-center gap-0.5 text-xs font-semibold text-accent-red"
          onClick={() => setSelecting(true)}
          type="button"
        >
          重新选择片段
          <ChevronRight aria-hidden className="size-3.5" />
        </button>
      ) : null}

      <BrowserRecorder lessonId={lessonId} />

      <Link
        className="block text-center text-sm font-semibold text-accent-red"
        href={`/lessons/${lessonId}/result/demo-result`}
      >
        查看演示结果
      </Link>
      <div className="space-y-3">
        <NoteRow
          href={`/lessons/${lessonId}/notes`}
          meta="4 条表达 · 随时复习"
          title="本篇笔记"
        />
        <NoteRow
          href="/history"
          icon={<ChevronRight aria-hidden className="size-5" />}
          meta="按文章查看我的笔记"
          title="历史记录"
        />
      </div>
    </div>
  );
}
