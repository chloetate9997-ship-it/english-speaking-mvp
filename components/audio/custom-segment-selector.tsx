"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { MouseEvent } from "react";
import type { LessonSegment } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CustomSegmentSelectorProps {
  segments: LessonSegment[];
  initialSelectedIds: string[];
  tone: "listen" | "retell";
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: (selectedIds: string[]) => void;
  onCancel: () => void;
}

export function CustomSegmentSelector({
  segments,
  initialSelectedIds,
  tone,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: CustomSegmentSelectorProps) {
  const [draftIds, setDraftIds] = useState<string[]>(initialSelectedIds);
  const [anchorOrder, setAnchorOrder] = useState<number | null>(null);

  function toggleWithRange(event: MouseEvent<HTMLButtonElement>, order: number) {
    const id = segments.find((segment) => segment.order === order)?.id;
    if (!id) return;

    if (event.shiftKey && anchorOrder !== null) {
      const [from, to] =
        anchorOrder < order ? [anchorOrder, order] : [order, anchorOrder];
      const rangeIds = segments
        .filter((segment) => segment.order >= from && segment.order <= to)
        .map((segment) => segment.id);
      setDraftIds((previous) => Array.from(new Set([...previous, ...rangeIds])));
      setAnchorOrder(order);
      return;
    }

    setAnchorOrder(order);
    setDraftIds((previous) =>
      previous.includes(id)
        ? previous.filter((selected) => selected !== id)
        : [...previous, id],
    );
  }

  const orderedDraft = segments
    .filter((segment) => draftIds.includes(segment.id))
    .map((segment) => segment.id);

  return (
    <div className="fixed inset-y-0 left-1/2 z-30 w-full max-w-[402px] -translate-x-1/2 overflow-y-auto bg-canvas">
      <section
        aria-label={title}
        className="space-y-4 px-page pb-[var(--safe-area-bottom)] pt-[var(--safe-area-top)]"
      >
      <div className="flex items-center gap-3">
        <button
          aria-label="返回"
          className="inline-flex size-10 items-center justify-center rounded-full text-ink hover:bg-muted"
          onClick={onCancel}
          type="button"
        >
          ←
        </button>
        <div>
          <h2 className="text-[20px] font-bold leading-[27px] text-ink">{title}</h2>
          <p className="mt-0.5 text-xs text-subtle">{description}</p>
        </div>
      </div>
      <div className="space-y-3">
        {segments.map((segment) => {
          const selected = draftIds.includes(segment.id);
          return (
            <button
              aria-pressed={selected}
              className={cn(
                "block w-full rounded-lg bg-card p-4 text-left shadow-card transition-colors duration-200",
                selected && "border-2 border-brand bg-warm shadow-card",
                !selected && "border-2 border-transparent",
              )}
              key={segment.id}
              onClick={(event) => toggleWithRange(event, segment.order)}
              type="button"
            >
              <span className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold tracking-[0.16em] text-subtle">
                  第 {segment.order} 段
                </span>
                {selected ? (
                  <span
                    aria-hidden
                    className="flex size-5 items-center justify-center rounded-full bg-brand text-white"
                  >
                    <Check className="size-3.5" />
                  </span>
                ) : null}
              </span>
              <span className="mt-2 block text-sm leading-relaxed text-ink">
                {tone === "listen" ? segment.englishText : segment.chineseText}
              </span>
            </button>
          );
        })}
      </div>
      <div className="sticky bottom-0 border-t border-line bg-canvas px-page pb-[var(--safe-area-bottom)] pt-3">
        <div className="flex items-center justify-between gap-3 rounded-lg bg-card p-4 shadow-card">
          <p className="text-sm text-subtle">
            {draftIds.length > 0
              ? `已选择 ${draftIds.length} 个自然段`
              : "点击选择，Shift+点击可快速选择连续范围"}
          </p>
          <button
            className="inline-flex h-11 items-center justify-center rounded-button bg-ink px-6 text-sm font-semibold text-white disabled:opacity-40"
            disabled={draftIds.length === 0}
            onClick={() => onConfirm(orderedDraft)}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
      </section>
    </div>
  );
}
