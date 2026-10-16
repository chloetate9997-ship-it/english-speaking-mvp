import { GripVertical } from "lucide-react";
import type { LessonSummary } from "@/lib/types";
import { formatDurationMinutes } from "@/lib/mock-data/lessons";

interface ManageLessonRowProps {
  lesson: LessonSummary;
}

export function ManageLessonRow({ lesson }: ManageLessonRowProps) {
  return (
    <li className="flex items-center gap-3 rounded-lg bg-card px-3 py-3 shadow-card">
      <GripVertical aria-hidden className="size-5 shrink-0 text-subtle" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">
          <span className="mr-1.5 font-bold text-accent-red">
            {String(lesson.order).padStart(2, "0")}
          </span>
          {lesson.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-subtle">
          {lesson.subtitle} · {formatDurationMinutes(lesson.durationSeconds)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3 text-xs font-medium">
        <button className="text-ink" type="button">
          替换
        </button>
        <button className="text-accent-red" type="button">
          删除
        </button>
      </div>
    </li>
  );
}
