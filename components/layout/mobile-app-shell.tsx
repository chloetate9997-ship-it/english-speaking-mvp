"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface MobileAppShellProps {
  children: ReactNode;
  withBottomNav?: boolean;
  className?: string;
}

function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left hover:opacity-80"
      >
        <h2 className="font-semibold text-ink">{title}</h2>
        <span className="ml-2 shrink-0 text-lg transition-transform" style={{ transform: isOpen ? "rotate(0deg)" : "rotate(0deg)" }}>
          {isOpen ? "−" : "+"}
        </span>
      </button>
      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  );
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
          className="sticky top-10 hidden w-[400px] shrink-0 overflow-y-auto pt-6 lg:block"
          style={{ maxHeight: "calc(100vh - 80px)" }}
        >
          <p className="inline-flex items-center rounded-pill bg-white px-3 py-1 text-xs font-semibold text-brand shadow-card">
            英语口语训练 MVP
          </p>
          <h1 className="mt-4 text-2xl font-bold leading-tight text-ink">
            AI 情景口语学习
          </h1>

          <div className="mt-6 space-y-6 text-sm leading-relaxed text-subtle">
            {/* 第一部分：为什么做这个产品 - 默认全部展开 */}
            <div>
              <h2 className="font-semibold text-ink mb-3">为什么做这个产品</h2>
              <div className="space-y-3 text-xs">
                <p>使用尚雯婕&quot;背诵20篇文章掌握英语&quot;的英语学习法时，我发现了四个问题：</p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>第一个问题：材料收集需要切换工具，很繁琐</li>
                  <li>第二个问题：精听、笔记、复述分散各处，流程断裂</li>
                  <li>第三个问题：复述后无法获得即时反馈，效果无法衡量</li>
                  <li>第四个问题：长文章一次性学习，初学者难以坚持</li>
                </ul>
              </div>
            </div>

            {/* 第二部分：这个产品怎么解决 - 默认全部展开 */}
            <div>
              <h2 className="font-semibold text-ink mb-3">这个产品怎么解决</h2>
              <div className="space-y-3 text-xs">
                <div>
                  <p className="font-semibold text-ink mb-1">解决问题一：一键收藏</p>
                  <p className="text-stone-600">主页 → 选择课程 → 精听学习 → 一键收藏</p>
                </div>
                <div>
                  <p className="font-semibold text-ink mb-1">解决问题二：内置笔记</p>
                  <p className="text-stone-600">主页 → 选择课程 → 精听学习 → 标注笔记 → 继续学习</p>
                </div>
                <div>
                  <p className="font-semibold text-ink mb-1">解决问题三：即时反馈</p>
                  <p className="text-stone-600">主页 → 选择课程 → 精听学习 → 复述练习 → 获得反馈</p>
                </div>
                <div>
                  <p className="font-semibold text-ink mb-1">解决问题四：分段学习</p>
                  <p className="text-stone-600">主页 → 选择课程 → 分段学习 → 逐步完成</p>
                </div>
                <div>
                  <p className="font-semibold text-ink mb-1">额外价值：AI对话实战</p>
                  <p className="text-stone-600">主页 → 选择课程 → 精听学习 → 复述练习 → AI情景对话 → 掌握技能</p>
                </div>
              </div>
            </div>

            {/* 第三部分及以后：可展开 */}
            <CollapsibleSection title="一、产品背景：为什么要做这个软件">
              <div className="space-y-2 text-xs text-stone-700">
                <p>
                  尚雯婕学习法在网上引发广泛讨论，说明&quot;如何更高效地练口语&quot;是许多学习者关注的痛点。这表明市场上确实有这样的需求。我亲自尝试这套学习方法后，觉得分段背诵和反复复述对口语提升是有效的，这激发了我把它产品化的想法。
                </p>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="二、用户痛点：我在使用过程中发现的问题">
              <div className="space-y-2 text-xs text-stone-700">
                <div>
                  <strong>材料收集繁琐：</strong>需要在小红书、官网等多个平台寻找合适的文章和音频，下载和整理成本高。
                </div>
                <div>
                  <strong>学习流程被打断：</strong>遇到不会的单词或短语，需要离开文章去查，再手动记到错题本，频繁的页面跳转打断学习连贯性。
                </div>
                <div>
                  <strong>无法确认复述效果：</strong>虽然能流畅地背诵文章，但不知道自己的发音和表达是否正确，只能凭感觉判断。
                </div>
                <div>
                  <strong>长文章对初学者有门槛：</strong>整篇 10-20 分钟的文章对口语基础较弱的学习者来说起点较高。
                </div>
                <div>
                  <strong>背诵不等于能交流：</strong>学完文章后缺少在真实场景中使用所学表达的机会。
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="三、解决方案：我在小程序中的使用流程">
              <div className="space-y-2 text-xs text-stone-700">
                <p>用户打开应用后，按照以下流程顺畅地完成学习，无需在多个工具间切换：</p>
                <ul className="space-y-1 list-disc pl-4">
                  <li><strong>第一步：选择课程</strong> 首页展示&quot;学完 20 篇，开口说英语&quot;的核心目标，用户直接从课程列表选择要学习的文章。</li>
                  <li><strong>第二步：精听学习</strong> 进入课程后，用户可以听音频、查看文章，按段落分步骤学习，降低长文章的学习难度。</li>
                  <li><strong>第三步：记录生词和短语</strong> 学习过程中遇到不熟悉的词句，用户可以直接查看解释并加入&quot;我的笔记&quot;，不用切换到外部工具，后续可随时复习。</li>
                  <li><strong>第四步：复述检验</strong> 完成精听和理解后，用户进入复述环节，用自己的语言重新表达学过的内容，并对照参考答案，检验自己是否真正掌握。</li>
                  <li><strong>第五步：AI 情景对话</strong> 学完文章后，用户进入与课程主题相关的 AI 对话场景，把刚学到的表达放到具体生活场景中练习，实现从学习到应用的转化。</li>
                </ul>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="四、市场机会：为什么这个软件有市场">
              <div className="space-y-2 text-xs text-stone-700">
                <div>
                  <strong>需求真实存在：</strong>尚雯婕学习法的广泛讨论证明用户关注口语提升，也说明现有学习方式还不够高效和便利。
                </div>
                <div>
                  <strong>痛点是普遍的：</strong>材料收集困难、学习被打断、缺少反馈，不只是个人问题，是这套学习方法的使用者都会遇到的共性问题。
                </div>
                <div>
                  <strong>解决方案有价值：</strong>把分散的学习动作整合到一个应用内，减少页面跳转，让学习路径更连贯，这直接改善了用户体验。
                </div>
                <div>
                  <strong>学习效果可验证：</strong>通过复述、反馈和 AI 交互，用户能看到自己的学习成果，增强学习动力。
                </div>
                <div>
                  <strong>市场还在成长：</strong>对标尚雯婕等英语学习方法的热度，这个赛道的用户需求仍在增长。
                </div>
              </div>
            </CollapsibleSection>
          </div>

          <ul className="mt-6 space-y-3">
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
