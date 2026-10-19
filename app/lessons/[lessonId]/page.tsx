import Link from "next/link";
import { notFound } from "next/navigation";
import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { StepTabs } from "@/components/navigation/step-tabs";
import { ListenExperience } from "@/components/audio/listen-experience";
import { SectionHeader } from "@/components/ui/section-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { EmptyState } from "@/components/ui/app-states";
import {
  getLessonSummary,
  lesson01,
  lesson01Notes,
  lesson01Transcript,
  lesson01TranscriptChinese,
} from "@/lib/mock-data/lessons";

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
      <PageHeader
        backHref="/"
        className="pt-[calc(var(--safe-area-top)+12px)]"
        title={summary.title}
      />
      <main className="space-y-5 px-page pb-10 pt-3">
        <StepTabs
          current="listen"
          listenHref={`/lessons/${lessonId}`}
          retellHref={`/lessons/${lessonId}/retell`}
        />
        <ListenExperience
          audioUrl={lesson01.audioUrl}
          lessonId={lessonId}
          durationSeconds={lesson01.durationSeconds}
          phraseNotes={lesson01Notes}
          segments={lesson01.segments}
          transcript={lesson01Transcript}
          transcriptChinese={lesson01TranscriptChinese}
        />
        <SurfaceCard>
          <SectionHeader title="AI 情景口语教练" />
          <p className="mt-2 text-sm text-subtle">
            选择情景，与 AI 教练多轮对话，练习本篇目标表达并获得纠错与报告。
          </p>
          <Link
            className="mt-3 inline-flex text-sm font-semibold text-accent-red"
            href={`/lessons/${lessonId}/coach`}
          >
            开始 AI 情景练习
          </Link>
        </SurfaceCard>
      </main>
    </MobileAppShell>
  );
}
