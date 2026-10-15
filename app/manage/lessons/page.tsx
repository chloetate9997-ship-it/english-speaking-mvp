import { Plus } from "lucide-react";
import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ManageLessonRow } from "@/components/lessons/manage-lesson-row";
import { PrimaryAction } from "@/components/ui/primary-action";
import { lessonSummaries } from "@/lib/mock-data/lessons";

const managedLessons = lessonSummaries.slice(0, 7);

export default function ManageLessonsPage() {
  return (
    <MobileAppShell>
      <PageHeader backHref="/profile" title="首页课程管理" />
      <main className="space-y-4 px-page pb-10 pt-2">
        <p className="text-center text-xs text-subtle">当前20篇 · 课程数量不限</p>
        <button
          className="inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-[24px] bg-brand px-5 text-[15px] font-semibold text-white"
          type="button"
        >
          <Plus aria-hidden className="size-5" />
          添加文章
        </button>
        <p className="text-center text-xs text-subtle">长按拖动排序 · 点击替换 · 删除后首页同步更新</p>
        <ul className="space-y-3">
          {managedLessons.map((lesson) => (
            <ManageLessonRow key={lesson.id} lesson={lesson} />
          ))}
        </ul>
        <PrimaryAction href="/">保存并更新首页</PrimaryAction>
      </main>
    </MobileAppShell>
  );
}
