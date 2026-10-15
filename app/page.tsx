import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { BottomNavigation } from "@/components/navigation/bottom-navigation";
import { LessonCard } from "@/components/lessons/lesson-card";
import { SectionHeader } from "@/components/ui/section-header";
import { lessonSummaries } from "@/lib/mock-data/lessons";

const visibleLessons = lessonSummaries.slice(0, 5);

export default function HomePage() {
  return (
    <MobileAppShell withBottomNav>
      <main className="space-y-6 px-page py-6">
        <header className="flex items-center justify-between">
          <p className="text-sm font-bold tracking-[0.18em] text-ink">VOA · SPEAK</p>
          <Link className="text-sm font-medium text-subtle" href="/manage/lessons">
            课程管理
          </Link>
        </header>

        <section className="flex h-[140px] w-full flex-col justify-center rounded-hero bg-brand p-5 text-white shadow-hero">
          <h1 className="text-[25px] font-bold leading-snug">学完20篇，开口说英语。</h1>
          <p className="mt-2 text-sm font-semibold tabular-nums">2 / 20</p>
          <p className="mt-1 text-xs opacity-90">已完成 1 篇 · 正在学习 1 篇</p>
        </section>

        <section className="space-y-4">
          <SectionHeader
            action={<span className="text-xs text-subtle">20篇</span>}
            title="全部课程"
          />
          <div className="space-y-3">
            {visibleLessons.map((lesson) => (
              <LessonCard
                href={lesson.order === 1 ? `/lessons/${lesson.id}` : undefined}
                key={lesson.id}
                lesson={lesson}
                variant="compact"
              />
            ))}
          </div>
          <div className="flex items-center justify-center gap-1 rounded-button border border-line bg-card py-3.5 text-sm font-semibold text-ink shadow-card">
            查看完整20篇课程
            <ChevronRight aria-hidden className="size-4" />
          </div>
        </section>
      </main>
      <BottomNavigation />
    </MobileAppShell>
  );
}
