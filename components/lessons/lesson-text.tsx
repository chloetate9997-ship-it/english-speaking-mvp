import type { LessonSegment } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LessonTextProps {
  segments: LessonSegment[];
  className?: string;
}

export function LessonText({ segments, className }: LessonTextProps) {
  return (
    <ol className={cn("space-y-4", className)}>
      {segments.map((segment) => (
        <li className="flex gap-3" key={segment.id}>
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-segment text-[11px] font-semibold text-subtle">
            {segment.order}
          </span>
          <div className="min-w-0">
            <p className="text-[15px] leading-relaxed text-ink">{segment.englishText}</p>
            <p className="mt-1 text-sm leading-relaxed text-subtle">{segment.chineseText}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
