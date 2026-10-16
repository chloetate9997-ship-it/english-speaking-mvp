import Link from "next/link";
import type { Lesson, LessonStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type LessonCardLesson = Pick<
  Lesson,
  "id" | "order" | "title" | "subtitle" | "durationSeconds" | "status"
>;

interface LessonCardProps {
  lesson: LessonCardLesson;
  href?: string;
  className?: string;
  variant?: "default" | "compact";
}

const statusLabel: Record<LessonStatus, string> = {
  "not-started": "未开始",
  "in-progress": "进行中",
  completed: "已完成",
};

const compactStatusLabel: Record<LessonStatus, string> = {
  "not-started": "未开始",
  "in-progress": "学习中",
  completed: "已完成",
};

function formatDuration(durationSeconds: number) {
  const minutes = Math.max(1, Math.round(durationSeconds / 60));
  return `${minutes} 分钟`;
}

export function LessonCard({ lesson, href, className, variant = "default" }: LessonCardProps) {
  if (variant === "compact") {
    const compactContent = (
      <>
        <span className="w-[42px] shrink-0 text-sm font-bold tabular-nums text-subtle">
          {String(lesson.order).padStart(2, "0")}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold leading-snug text-ink">
            {lesson.title}
          </span>
          <span className="mt-0.5 block truncate text-xs text-subtle">
            {lesson.subtitle} · {formatDuration(lesson.durationSeconds)}
          </span>
        </span>
        <span
          className={cn(
            "shrink-0 text-xs font-semibold",
            lesson.status === "completed" && "text-accent-red",
            lesson.status === "in-progress" && "text-ink",
            lesson.status === "not-started" && "text-subtle",
          )}
        >
          {compactStatusLabel[lesson.status]}
        </span>
      </>
    );

    const compactClassName = cn(
      "flex h-[76px] w-full items-center gap-3 rounded-lg bg-card px-4 text-left shadow-card",
      className,
    );

    if (href) {
      return (
        <Link className={compactClassName} href={href}>
          {compactContent}
        </Link>
      );
    }

    return <article className={compactClassName}>{compactContent}</article>;
  }

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold tracking-[0.16em] text-subtle">
          第 {String(lesson.order).padStart(2, "0")} 篇
        </p>
        <span
          className={cn(
            "rounded-pill px-2.5 py-1 text-[11px] font-medium",
            lesson.status === "completed" && "bg-warm text-accent-red",
            lesson.status === "in-progress" && "bg-play/30 text-ink",
            lesson.status === "not-started" && "bg-segment text-subtle",
          )}
        >
          {statusLabel[lesson.status]}
        </span>
      </div>
      <h3 className="mt-2 text-lg font-semibold leading-snug text-ink">{lesson.title}</h3>
      <p className="mt-1 text-sm text-subtle">{lesson.subtitle}</p>
      <p className="mt-3 text-xs text-subtle">{formatDuration(lesson.durationSeconds)}</p>
    </>
  );

  const sharedClassName = cn(
    "block rounded-lg bg-card p-4 text-left shadow-card",
    href && "transition-transform hover:-translate-y-0.5",
    className,
  );

  if (href) {
    return (
      <Link className={sharedClassName} href={href}>
        {content}
      </Link>
    );
  }

  return <article className={sharedClassName}>{content}</article>;
}
