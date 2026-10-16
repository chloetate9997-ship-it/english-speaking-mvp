import Link from "next/link";
import { notFound } from "next/navigation";
import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { FeedbackSection } from "@/components/feedback/feedback-section";
import { PrimaryAction } from "@/components/ui/primary-action";
import { SurfaceCard } from "@/components/ui/surface-card";
import { demoRetellResult, getLessonSummary, lesson01 } from "@/lib/mock-data/lessons";
import { CloudResultView } from "@/components/retell/cloud-result-view";
import { cn } from "@/lib/utils";

interface ResultPageProps {
  params: Promise<{ lessonId: string; resultId: string }>;
}

export function generateStaticParams() {
  return [{ lessonId: "lesson-01", resultId: "demo-result" }];
}

export default async function ResultPage({ params }: ResultPageProps) {
  const { lessonId, resultId } = await params;
  const summary = getLessonSummary(lessonId);

  if (!summary) {
    notFound();
  }

  if (resultId !== demoRetellResult.id || lessonId !== lesson01.id) {
    return (
      <MobileAppShell>
        <PageHeader
          backHref={`/lessons/${lessonId}/retell`}
          title="复述对比结果"
        />
        <main className="space-y-4 px-page pb-10 pt-2">
          <CloudResultView
            lessonId={lessonId}
            lessonTitle={summary.title}
            resultId={resultId}
          />
        </main>
      </MobileAppShell>
    );
  }

  return (
    <MobileAppShell>
      <PageHeader
        action={
          <Link
            className="text-sm font-medium text-brand"
            href={`/lessons/${lessonId}/notes`}
          >
            我的笔记
          </Link>
        }
        backHref={`/lessons/${lessonId}/retell`}
        title="复述对比结果"
      />
      <main className="space-y-4 px-page pb-10 pt-2">
        <p className="text-center text-xs text-subtle">{summary.title}</p>
        <SurfaceCard>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">内容得分</h2>
            <p className="text-2xl font-bold tabular-nums text-accent-red">
              {demoRetellResult.contentScore}
            </p>
          </div>
          <div aria-hidden className="mt-3 h-2 overflow-hidden rounded-full bg-segment">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${demoRetellResult.contentScore}%` }}
            />
          </div>
        </SurfaceCard>
        <FeedbackSection title="你说的">
          <p>{demoRetellResult.transcript}</p>
        </FeedbackSection>
        <FeedbackSection title="纠错提示" tone="warm">
          <ul className="list-disc space-y-1 pl-5">
            {demoRetellResult.missedPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </FeedbackSection>
        <FeedbackSection title="自然表达 / 标准答案">
          <p>{demoRetellResult.naturalVersion}</p>
        </FeedbackSection>
        <FeedbackSection title="语言建议">
          <ul className="space-y-1">
            {demoRetellResult.coveredPoints.map((point) => (
              <li key={point}>✓ {point}</li>
            ))}
            {demoRetellResult.languageSuggestions.map((tip) => (
              <li key={tip}>→ {tip}</li>
            ))}
          </ul>
          <p className="mt-2 text-subtle">下一步：{demoRetellResult.nextExercise}</p>
        </FeedbackSection>
        <div className="space-y-3 pt-2">
          <PrimaryAction href="/history">保存这次记录</PrimaryAction>
          <Link
            className={cn(
              "inline-flex h-[52px] w-full items-center justify-center rounded-button border border-line bg-card px-5 text-[15px] font-semibold text-ink",
            )}
            href={`/lessons/${lessonId}/coach`}
          >
            开始 AI 情景练习
          </Link>
          <Link
            className={cn(
              "inline-flex h-[52px] w-full items-center justify-center rounded-button border border-line bg-card px-5 text-[15px] font-semibold text-ink",
            )}
            href={`/lessons/${lessonId}/retell`}
          >
            重新录制
          </Link>
        </div>
      </main>
    </MobileAppShell>
  );
}
