# 项目状态与上线交接

更新日期：2026-10-17

## 可访问地址

- GitHub：<https://github.com/chloetate9997-ship-it/english-speaking-mvp>
- Vercel Production：<https://english-speaking-mvp.vercel.app>

## 已完成

- Next.js 移动端 Web MVP、统一设计系统与桌面演示外壳。
- 首页、课程精听、复述、结果、学习记录、个人页与邮箱登录。
- AI 情景口语 Coach：目标表达、动态动作、纠错、四维评分、练习报告与异常降级。
- 课程 RAG 的数据库结构、向量同步入口、语义检索与服务端权限迁移。
- Supabase 线上项目、登录 Site URL 与回调地址、Vercel 环境变量。
- GitHub 与 Vercel 首次发布；生产环境完成过一次邮箱登录。
- 自动检查：ESLint 通过，5 个测试文件共 35 个用例通过，Webpack 生产构建通过。

## 上线前仍需完成

1. 提供拥有合法使用权的 `public/audio/lesson-01.mp3`，并按实际音频调整 5 段时间轴。
2. 在 Vercel 生产环境调用一次受保护的 RAG 同步接口，预期首次 `updated: 8`、再次 `updated: 0`。
3. 在线完成 3–5 轮 Coach 对话并生成报告，核对 Supabase 的 session、turn 与 progress 数据。
4. 用真实 iPhone Safari 或 Android Chrome 验收录音授权、录制、回放、提交和失败重试。
5. 将本地最新提交安全同步到 GitHub，并确认 Vercel 自动部署完成。
6. 上线前轮换曾在调试过程中展示过的 OpenAI 与 Supabase 服务端密钥，并同步更新 Vercel。

## 面试演示建议路径

1. 桌面打开首页，用 30 秒说明“课程输入 → 复述输出 → AI 情景迁移 → 个性化反馈 → 薄弱表达复习”。
2. 打开 lesson-01，展示精听、分段文本和复述入口。
3. 登录后进入 Coach，完成两轮文字或语音练习并展示反馈与报告。
4. 说明 Agent 会根据学习状态选择 `continue`、`hint`、`retry`、`simplify` 或 `complete`。
5. 说明 RAG 只检索本课内容，减少脱离课程的泛化回答。
6. 主动说明 MVP 边界：当前只有一篇完整课程，真实语音与线上 Agent 仍需最终验收。

更完整的问题优先级与改进方案见 `docs/PRODUCT-AUDIT.md`。
