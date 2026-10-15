import type { ReactNode } from "react";
import { SegmentedControlPreview } from "@/components/design-system/segmented-control-preview";
import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { LessonCard } from "@/components/lessons/lesson-card";
import { StepTabs } from "@/components/navigation/step-tabs";
import { NoteRow } from "@/components/notes/note-row";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/app-states";
import { PrimaryAction } from "@/components/ui/primary-action";
import { SectionHeader } from "@/components/ui/section-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { lesson01 } from "@/lib/mock-data/lessons";
import { cn } from "@/lib/utils";

const colorSwatches = [
  { name: "主文字 / 主按钮", token: "#0E0F12", className: "bg-ink" },
  { name: "次要文字", token: "#6E7075", className: "bg-subtle" },
  { name: "品牌珊瑚红", token: "#FF614F", className: "bg-brand" },
  { name: "强调红", token: "#FB4930", className: "bg-accent-red" },
  { name: "播放 / 录音黄", token: "#FFC04A", className: "bg-play" },
  { name: "暖色卡片", token: "#FFEBE2", className: "bg-warm" },
  { name: "浅色画布", token: "#FDFDFC", className: "bg-canvas border border-line" },
  { name: "边框", token: "#E8E4DD", className: "bg-line" },
  { name: "分割线", token: "#E7EAF1", className: "bg-divider" },
  { name: "分段底色", token: "#ECECE8", className: "bg-segment" },
] as const;

function PreviewSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold tracking-[0.16em] text-subtle">{title}</h2>
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <MobileAppShell>
      <PageHeader backHref="/" title="设计系统" />
      <main className="space-y-8 px-page pb-10 pt-2">
        <p className="text-sm leading-6 text-subtle">
          组件预览页，用于验收第 3 步设计系统。不是正式产品页面。
        </p>

        <PreviewSection title="颜色">
          <div className="grid grid-cols-2 gap-3">
            {colorSwatches.map((swatch) => (
              <div className="space-y-2" key={swatch.token}>
                <div className={cn("h-12 rounded-xl", swatch.className)} />
                <p className="text-xs font-medium text-ink">{swatch.name}</p>
                <p className="text-[11px] text-subtle">{swatch.token}</p>
              </div>
            ))}
          </div>
        </PreviewSection>

        <PreviewSection title="排版">
          <div className="space-y-3">
            <p className="text-3xl font-semibold tracking-tight text-ink">学完 20 篇，开口说英语。</p>
            <p className="text-lg font-semibold text-ink">How to Express Your Opinion</p>
            <p className="text-base text-ink">用于课程正文与主说明的默认字号。</p>
            <p className="text-sm text-subtle">次要说明、时长、中文释义使用灰色辅助文字。</p>
            <p className="text-xs font-semibold tracking-[0.16em] text-subtle">VOA · SPEAK</p>
          </div>
        </PreviewSection>

        <PreviewSection title="PrimaryAction">
          <div className="space-y-3">
            <PrimaryAction href={`/lessons/${lesson01.id}`}>开始精听</PrimaryAction>
            <PrimaryAction>提交复述</PrimaryAction>
          </div>
        </PreviewSection>

        <PreviewSection title="LessonCard">
          <LessonCard href={`/lessons/${lesson01.id}`} lesson={lesson01} />
          <LessonCard lesson={lesson01} variant="compact" />
        </PreviewSection>

        <PreviewSection title="SurfaceCard">
          <SurfaceCard>
            <SectionHeader action={<span>查看全部</span>} title="普通卡片" />
            <p className="mt-2 text-sm leading-6 text-subtle">
              圆角 18px，阴影用于课程列表、笔记入口等内容块。
            </p>
          </SurfaceCard>
          <SurfaceCard className="rounded-hero bg-warm p-5 shadow-hero">
            <p className="text-xs font-semibold tracking-[0.16em] text-subtle">HERO</p>
            <p className="mt-2 text-lg font-semibold text-ink">暖色主卡片</p>
            <p className="mt-1 text-sm text-subtle">圆角 22px，用于首页主视觉。</p>
          </SurfaceCard>
        </PreviewSection>

        <PreviewSection title="StepTabs">
          <StepTabs
            current="listen"
            listenHref={`/lessons/${lesson01.id}`}
            retellHref={`/lessons/${lesson01.id}/retell`}
          />
        </PreviewSection>

        <PreviewSection title="SegmentedControl">
          <SegmentedControlPreview />
        </PreviewSection>

        <PreviewSection title="NoteRow">
          <div className="space-y-3">
            <NoteRow
              href={`/lessons/${lesson01.id}/notes`}
              meta="回应不同意见时，先表示理解。"
              title="本篇笔记"
            />
            <NoteRow href="/history" meta="今天 · 内容完成度 82%" title="最近一次复述" />
          </div>
        </PreviewSection>

        <PreviewSection title="状态">
          <div className="space-y-3">
            <SurfaceCard className="p-0">
              <LoadingState className="min-h-32" label="正在生成反馈" />
            </SurfaceCard>
            <SurfaceCard className="p-0">
              <EmptyState className="min-h-32" description="完成复述后会出现在这里。" title="还没有学习记录" />
            </SurfaceCard>
            <SurfaceCard className="p-0">
              <ErrorState className="min-h-32" message="录音权限被拒绝，请在系统设置中开启。" />
            </SurfaceCard>
          </div>
        </PreviewSection>
      </main>
    </MobileAppShell>
  );
}
