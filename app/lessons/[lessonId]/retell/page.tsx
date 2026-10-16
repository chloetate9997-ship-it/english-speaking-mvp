import { notFound } from "next/navigation";
import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { StepTabs } from "@/components/navigation/step-tabs";
import { RetellExperience } from "@/components/retell/retell-experience";
import { getLessonSummary, lesson01 } from "@/lib/mock-data/lessons";

interface RetellPageProps {
  params: Promise<{ lessonId: string }>;
}

export function generateStaticParams() {
  return [{ lessonId: "lesson-01" }];
}

export default async function RetellPage({ params }: RetellPageProps) {
  const { lessonId } = await params;
  const summary = getLessonSummary(lessonId);

  if (!summary) {
    notFound();
  }

  if (lessonId !== lesson01.id) {
    return (
      <MobileAppShell>
        <PageHeader backHref={`/lessons/${lessonId}`} title={summary.title} />
        <main className="space-y-5 px-page pb-10 pt-2">
          <StepTabs
            current="retell"
            listenHref={`/lessons/${lessonId}`}
            retellHref={`/lessons/${lessonId}/retell`}
          />
          <RetellExperience
            lessonId={lessonId}
            prompt="本篇的复述提示正在准备中，可先用第 1 篇练习完整录音与 AI 反馈流程。"
            segments={[]}
          />
        </main>
      </MobileAppShell>
    );
  }

  return (
    <MobileAppShell>
      <PageHeader backHref={`/lessons/${lessonId}`} title={summary.title} />
      <main className="space-y-5 px-page pb-10 pt-2">
        <StepTabs
          current="retell"
          listenHref={`/lessons/${lessonId}`}
          retellHref={`/lessons/${lessonId}/retell`}
        />
        <RetellExperience
          lessonId={lessonId}
          prompt="你和朋友正在讨论20世纪最伟大的发明，有人说电脑最伟大，也有人说飞机改变了世界。用英语表达你的观点，先回应对方，再说出你的理由。"
          segments={lesson01.segments}
        />
      </main>
    </MobileAppShell>
  );
}
