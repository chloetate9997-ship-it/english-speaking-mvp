import Link from "next/link";
import { notFound } from "next/navigation";
import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { StepTabs } from "@/components/navigation/step-tabs";
import { ListenExperience } from "@/components/audio/listen-experience";
import { SectionHeader } from "@/components/ui/section-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { EmptyState } from "@/components/ui/app-states";
import { getLessonSummary, lesson01, lesson01Notes } from "@/lib/mock-data/lessons";

interface ListenPageProps {
  params: Promise<{ lessonId: string }>;
}

export function generateStaticParams() {
  return [{ lessonId: "lesson-01" }];
}

export default async function ListenPage({ params }: ListenPageProps) {
  const { lessonId } = await params;
  const summary = getLessonSummary(lessonId);

  if (!summary) {
    notFound();
  }

  // lesson-01 有完整音频与段落；其他课程展示课程信息，完整音频上线后补齐。
  if (lessonId !== lesson01.id) {
    return (
      <MobileAppShell>
        <PageHeader backHref="/" title={summary.title} />
        <main className="space-y-5 px-page pb-10 pt-2">
          <StepTabs
            current="listen"
            listenHref={`/lessons/${lessonId}`}
            retellHref={`/lessons/${lessonId}/retell`}
          />
          <EmptyState
            description={`《${summary.title}》的精听音频正在准备中，可先从第 1 篇开始练习。`}
            title="敬请期待"
          />
        </main>
      </MobileAppShell>
    );
  }

  return (
    <MobileAppShell>
      <PageHeader backHref="/" title={summary.title} />
      <main className="space-y-5 px-page pb-10 pt-2">
        <StepTabs
          current="listen"
          listenHref={`/lessons/${lessonId}`}
          retellHref={`/lessons/${lessonId}/retell`}
        />
        <ListenExperience
          audioUrl={lesson01.audioUrl}
          lessonId={lessonId}
          durationSeconds={lesson01.durationSeconds}
          segments={lesson01.segments}
        />
        <SurfaceCard className="bg-warm">
          <SectionHeader title="我的笔记" />
          <p className="mt-2 text-sm text-subtle">
            已记录 {lesson01Notes.length} 条表达：suppose、In my opinion、I couldn&apos;t agree
            more……
          </p>
          <Link
            className="mt-3 inline-flex text-sm font-semibold text-accent-red"
            href={`/lessons/${lessonId}/notes`}
          >
            查看本篇笔记
          </Link>
        </SurfaceCard>
      </main>
    </MobileAppShell>
  );
}
