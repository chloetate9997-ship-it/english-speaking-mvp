import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MobileAppShellProps {
  children: ReactNode;
  withBottomNav?: boolean;
  className?: string;
}

/**
 * 响应式应用外壳（仅展示层，不改变业务逻辑）：
 * - <640px：应用占满屏幕，无额外边框（手机行为不变）。
 * - sm(640px)+：浅色背景 + 居中手机容器（约 430px，圆角/边框/阴影）。
 * - lg(1024px)+：左侧显示项目介绍；640~900px 仅居中容器。
 */
export function MobileAppShell({
  children,
  withBottomNav = false,
  className,
}: MobileAppShellProps) {
  return (
    <div className="min-h-dvh w-full bg-canvas text-ink sm:bg-[#f1efe9] sm:py-6 lg:py-10">
      <div className="mx-auto flex w-full max-w-[1160px] items-start justify-center gap-10 px-0 sm:px-6 lg:px-8">
        <aside
          aria-label="项目介绍"
          className="sticky top-10 hidden w-[400px] shrink-0 pt-6 lg:block"
        >
          <p className="inline-flex items-center rounded-pill bg-white px-3 py-1 text-xs font-semibold text-brand shadow-card">
            英语口语训练 MVP
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-tight text-ink">
            AI 情景口语学习
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-subtle">
            课程精听、复述练习、AI 情景对话：跟着课程学表达，用 Agent 动态提示练开口，课程
            RAG 为每一轮反馈提供依据。
          </p>
          <ul className="mt-5 space-y-3">
            {[
              ["课程精听", "分段听力与重点表达标注，打好输入基础。"],
              ["复述练习", "录音复述并获得 AI 反馈，纠正语法与自然度。"],
              ["AI 情景对话", "Agent 动态提示与课程 RAG，多轮练到能脱口而出。"],
            ].map(([title, desc]) => (
              <li className="rounded-lg bg-white p-4 shadow-card" key={title}>
                <p className="text-sm font-semibold text-ink">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-subtle">{desc}</p>
              </li>
            ))}
          </ul>
          <p className="mt-5 rounded-lg border border-line bg-warm p-3 text-xs leading-relaxed text-ink">
            建议使用手机浏览器体验录音功能，桌面端主要用于浏览与演示。
          </p>
        </aside>
        <div className="w-full max-w-[430px] shrink-0 overflow-hidden bg-canvas sm:rounded-[28px] sm:border sm:border-line sm:shadow-[0_24px_64px_rgba(23,20,18,0.12)]">
          <div
            className={cn(
              "relative min-h-dvh sm:min-h-[860px]",
              withBottomNav && "pb-[calc(var(--nav-height)+var(--safe-area-bottom))]",
              className,
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
