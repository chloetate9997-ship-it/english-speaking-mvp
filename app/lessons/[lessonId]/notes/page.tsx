import { notFound } from "next/navigation";
import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { NotesExperience } from "@/components/notes/notes-experience";
import { getLessonSummary, lesson01, lesson01Notes } from "@/lib/mock-data/lessons";

interface NotesPageProps {
  params: Promise<{ lessonId: string }>;
}

export function generateStaticParams() {
  return [{ lessonId: "lesson-01" }];
}

export default async function NotesPage({ params }: NotesPageProps) {
  const { lessonId } = await params;
  const summary = getLessonSummary(lessonId);

  if (!summary || lessonId !== lesson01.id) {
    notFound();
  }

  return (
    <MobileAppShell>
      <PageHeader backHref={`/lessons/${lessonId}`} title="我的笔记" />
      <main className="space-y-4 px-page pb-10 pt-2">
        <p className="text-center text-xs text-subtle">{summary.title}</p>
        <NotesExperience
          lessonId={lessonId}
          seedNotes={lesson01Notes.map((note) => ({
            id: note.id,
            content: `${note.english} · ${note.chinese}`,
          }))}
        />
      </main>
    </MobileAppShell>
  );
}
