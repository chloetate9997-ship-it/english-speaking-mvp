"use client";

import { useState } from "react";
import Link from "next/link";
import type { LessonSegment } from "@/lib/types";
import { CustomSegmentSelector } from "@/components/audio/custom-segment-selector";
import { BrowserRecorder } from "@/components/retell/browser-recorder";
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
      <section className="rounded-[18px] border border-line bg-card p-4 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div className="flex rounded-pill bg-segment p-0.5" role="group" aria-label="复述范围">
            <button
              aria-pressed={scope === "full"}
              className={cn(
                "min-w-[68px] rounded-pill px-3 py-1.5 text-xs",
                scope === "full" ? "bg-white font-semibold text-ink shadow-card" : "text-subtle",
              )}
              onClick={() => setScope("full")}
              type="button"
            >
              全篇
            </button>
            <button
              aria-pressed={scope === "segment"}
              className={cn(
                "min-w-[58px] rounded-pill px-3 py-1.5 text-xs",
                scope === "segment" ? "bg-white font-semibold text-ink shadow-card" : "text-subtle",
              )}
              onClick={() => setSelecting(true)}
              type="button"
            >
              分段
            </button>
          </div>
          <Link className="text-[11px] text-ink" href={`/lessons/${lessonId}/notes`}>
            我的笔记 ›
          </Link>
        </div>
        <p className="mt-8 text-sm leading-[1.8] text-subtle">{combinedPrompt}</p>
      </section>

      <BrowserRecorder lessonId={lessonId} />

      <Link
        className="mx-auto flex h-[52px] w-[235px] items-center justify-center rounded-button bg-ink text-sm font-semibold text-white shadow-card"
        href={`/lessons/${lessonId}/result/demo-result`}
      >
        复述对比结果 →
      </Link>
    </div>
  );
}
