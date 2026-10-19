import Link from "next/link";
import { notFound } from "next/navigation";
import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { demoRetellResult, getLessonSummary, lesson01 } from "@/lib/mock-data/lessons";
import { CloudResultView } from "@/components/retell/cloud-result-view";

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
      <main className="px-page pb-10 pt-1">
        <p className="mb-5 text-xs text-subtle">{summary.title}</p>

        <section className="min-h-[540px] rounded-[20px] border-2 border-[#168cff] bg-card px-4 py-5 text-ink">
          <div>
            <h2 className="text-sm font-bold">你说的</h2>
            <p className="mt-3 text-sm leading-7">{demoRetellResult.transcript}</p>
          </div>

          <div className="mt-7">
            <h2 className="text-sm font-bold">标准答案</h2>
            <p className="mt-3 text-sm leading-7">{demoRetellResult.naturalVersion}</p>
          </div>

          <div className="mt-7">
            <h2 className="text-sm font-bold">错误分析</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6">
              {demoRetellResult.missedPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
              {demoRetellResult.languageSuggestions.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ol>
          </div>
        </section>

        <div className="mt-4 grid grid-cols-[1.65fr_1fr] gap-3">
          <Link
            className="inline-flex h-12 items-center justify-center rounded-[14px] bg-ink px-4 text-sm font-semibold text-white shadow-card"
            href="/history"
          >
            保存这次记录
          </Link>
          <Link
            className="inline-flex h-12 items-center justify-center rounded-[14px] border border-line bg-card px-4 text-sm font-semibold text-ink"
            href={`/lessons/${lessonId}/retell`}
          >
            重新录制
          </Link>
        </div>
      </main>
    </MobileAppShell>
  );
}
