# 开口说英语 · 精听复述练习

一句话：面向“听得懂、开不了口”的成人学习者，用课程精听、复述反馈和课程 RAG 驱动的 AI 情景对话，练到敢开口。

## 主要功能

- 课程精听：双语段落、起止秒跳转、关键词。
- 分段/整篇复述：浏览器录音、本地预览、明确提交才上传。
- AI 反馈：英文转写 + 内容得分/已覆盖/遗漏/语言建议/自然表达/下一步练习。
- AI 情景口语：三个场景、多轮 Agent 动态提示、纠错、自然表达与四维评分。
- 课程 RAG：仅检索当前课程知识和目标表达，为 Agent 提问与反馈提供依据。
- 笔记：按课程/段落新增、编辑、删除，云端或本浏览器持久化。
- 学习进度与历史：节流保存进度，历史展示真实记录。
- 登录：邮箱 magic link/OTP，PKCE confirm 回跳。

## 技术栈与架构

Next.js 16 App Router、TypeScript strict、Tailwind、Supabase（Auth/Database/Storage）、OpenAI（Audio Transcriptions + Responses API）、Vitest。

```mermaid
flowchart LR
    UI[页面/组件] --> DATA[lib/data]
    UI --> API[复述 / 情景练习 API]
    DATA --> SB[Supabase]
    API --> SB
    API --> AI[OpenAI]
```

详见 `docs/ARCHITECTURE.md`。

## 本地运行

```bash
npm install
npm run dev
```

访问 `http://localhost:3000`。

## 演示模式

未设置 Supabase 变量时自动演示：Mock 课程、localStorage 笔记（标注“仅此浏览器”）、`demo-result` 演示反馈均可用。演示入口：首页 → 第 1 篇 → 复述 → 提交（未配置时跳演示结果）。

## Supabase/OpenAI 配置

```env
# .env.local（不提交）
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
OPENAI_API_KEY=
OPENAI_FEEDBACK_MODEL=gpt-4o-mini
```

步骤：Supabase 建项目 → 按编号执行 `supabase/migrations/` 中的迁移 → 配置环境变量 → Auth URL Configuration 加本地及生产回调地址。详见 `supabase/README.md` 和 `docs/DEPLOYMENT.md`。真实流程入口：登录后可进行复述分析或进入 `/lessons/lesson-01/coach` 开始 AI 情景练习。

## 数据与隐私

- `profiles/notes/learning_progress/retell_results` 全表 RLS，仅本人读写；lessons/segments 仅 published 只读。
- `retell-recordings` 私有 bucket，仅 `{userId}/...` 前缀，signed URL 10 分钟回放。
- 未提交录音不上传；提交前 UI 说明发送第三方 AI 处理。
- 日志只记 request/result ID 与阶段，不记 key、录音、signed URL、完整 transcript。

## 测试命令

```bash
npm run lint
npm run test      # Vitest 单元测试（纯函数/schema/安全分支）
npm run build -- --webpack
```

外部服务在测试中一律 mock，不消耗 OpenAI 额度。浏览器 e2e 未引入（见已知限制）。

## 部署方式

见 `docs/DEPLOYMENT.md`：GitHub 导入 Vercel 或 Vercel CLI，Preview 先行 QA 再升 Production。本轮未执行真实部署。

## 已知限制与路线图

- 仅第 1 篇有完整音频、段落和情景 Agent；其他课程为占位（可渲染，不 404）。
- 情景对话为提交式多轮交互，不是实时语音通话；暂无音素级发音评分。
- e2e 冒烟靠 `docs/QA-CHECKLIST.md` 人工执行。
- 下一步：先完成线上 RAG/Agent 与真机录音验收，再扩展课程与复习计划。产品问题与优先级见 `docs/PRODUCT-AUDIT.md`，面试脚本见 `docs/INTERVIEW-DEMO.md`。
