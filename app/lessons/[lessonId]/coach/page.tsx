import { notFound } from "next/navigation";
import { CoachExperience } from "@/components/coach/coach-experience";
import { getLessonSummary, lesson01 } from "@/lib/mock-data/lessons";

interface CoachPageProps {
  params: Promise<{ lessonId: string }>;
}

export function generateStaticParams() {
  return [{ lessonId: "lesson-01" }];
}

export default async function CoachPage({ params }: CoachPageProps) {
  const { lessonId } = await params;
  const summary = getLessonSummary(lessonId);
  if (!summary) notFound();

  return (
    <CoachExperience
      lessonId={lessonId}
      lessonTitle={lessonId === lesson01.id ? lesson01.title : summary.title}
    />
  );
}
