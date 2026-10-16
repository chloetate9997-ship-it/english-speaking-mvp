"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { formatClock } from "@/lib/mock-data/lessons";
import { cn } from "@/lib/utils";

const scopes = [
  { value: "full", label: "整篇" },
  { value: "segments", label: "分段" },
] as const;

type Scope = (typeof scopes)[number]["value"];

interface AudioPlayerCardProps {
  durationSeconds: number;
  className?: string;
}

export function AudioPlayerCard({ durationSeconds, className }: AudioPlayerCardProps) {
  const [scope, setScope] = useState<Scope>("full");

  return (
    <section
      aria-label="音频播放"
      className={cn("rounded-lg bg-card p-4 shadow-card", className)}
    >
      <div className="flex items-center gap-3">
        <button
          aria-label="播放课程音频"
          className="flex size-[42px] shrink-0 items-center justify-center rounded-full bg-play text-ink"
          type="button"
        >
          <Play aria-hidden className="size-5 fill-current" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs tabular-nums text-subtle">
            00:00 / {formatClock(durationSeconds)}
          </p>
          <div
            aria-hidden
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-segment"
          >
            <div className="h-full w-[8%] rounded-full bg-brand" />
          </div>
        </div>
      </div>
      <SegmentedControl
        ariaLabel="播放范围"
        className="mt-3"
        onChange={setScope}
        options={[...scopes]}
        value={scope}
      />
    </section>
  );
}
