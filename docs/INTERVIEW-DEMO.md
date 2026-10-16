# 面试演示脚本（5–8 分钟，中文）

## 30 秒：用户问题与需求来源

“成人英语学习者能听懂、开不了口。我做的这个移动端 Web 应用，用 20 篇精听 + 分段复述 + AI 反馈，解决‘没语料、没反馈、不敢说’的问题。”

## 60 秒：从 Figma Prototype 到技术拆解

“从 Figma 原型拆出三步学习闭环：精听 → 复述 → 反馈。技术选 Next.js App Router + TypeScript strict + Supabase（Auth/Database/Storage）+ OpenAI，移动端容器 320–430px 优先。”

## 2–3 分钟：主流程演示

1. 首页选第 1 篇，进课程精听：双语段落、起止秒、关键词。
2. 切到复述 Tab：选整篇/分段，浏览器录音、本地预览。
3. 提交前有第三方 AI 处理说明；提交后上传私有 Storage，服务端转写 + 结构化反馈。
4. 真实结果页展示：得分、已覆盖/遗漏、语言建议、自然表达、下一步练习。
5. 无 key 时看 `demo-result` 演示反馈，流程不断。

## 1–2 分钟：架构、安全与降级

“展示用数据访问层隔离 Supabase；RLS 按 `auth.uid()=user_id` 收紧；录音路径按 userId 隔离、signed URL 短期回放；OpenAI 只在 `server-only` 模块调用；缺 Supabase/OpenAI 自动演示模式，lint/build 照过。”

## 60 秒：取舍、结果与下一步

“取舍：不做实时对话/音素评分，先保证提交→反馈闭环可靠。结果：9 步计划收口，测试 + 文档 + 部署就绪。下一步：发音维度、 spaced repetition、Preview 上线 QA。”

## 面试官可能追问 8 问

1. **为什么 Next.js？** —— 同构路由 + 同源 API + Vercel HTTPS，录音 secure context 与服务端密钥共存。
2. **为什么 Supabase？** —— Auth/RLS/Storage 一体，行级安全天然匹配“只能看自己的录音”。
3. **录音兼容性？** —— MediaRecorder 按 `webm/mp4/ogg` 探测，MIME 白名单 + 25MB 上限，不支持/拒权限给可恢复提示。
4. **AI 可靠性？** —— strict JSON Schema + 服务端运行时校验，空转写 422 不进反馈，失败复用同一行重试。
5. **隐私？** —— 录音私有 bucket、signed URL 短期有效；日志只记 ID/阶段，不记 key/录音/transcript。
6. **RLS 怎么保证？** —— 全表启用，`notes/progress/retell_results` 限定本人，lessons 只读 published，grants 先 revoke 再最小授予。
7. **成本？** —— 转写按量 + 轻量反馈模型（`OPENAI_FEEDBACK_MODEL` 可换），测试全 mock 不烧额度。
8. **扩展性？** —— 数据访问层 + 状态机已抽象，加新题型/新模型只需换 prompt 与 schema，下一步接发音评分也不碰上传链路。
