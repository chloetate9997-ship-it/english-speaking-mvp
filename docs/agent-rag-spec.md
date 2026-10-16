# Agent RAG Spec（MVP · lesson-01 可演示）

## 1. RAG 知识来源（只用现有课程数据，不编造新课）
- `lib/mock-data/lessons.ts` 的 `lesson01`：5 个 segment 英文/中文/keywords。
- `lesson01Notes`：4 条短语笔记（suppose / In my opinion / I couldn't agree more / I see what you're saying, but…）。
- `demoRetellResult`：naturalVersion 与 languageSuggestions 作为“地道改写”示例。
- 入库形态：`target_expressions`（7 条目标表达，见迁移 004）+ `knowledge_chunks`（expression / segment / example 三类，lessonId 全为 `lesson-01`）。
- embedding 模型：`text-embedding-3-small`，维度 1536（与 `match_knowledge_chunks` 的 `vector(1536)` 一致）。chunk 文本 = 英文 + 中文 + 场景拼接后取 embedding。

## 2. Agent 可执行动作
| action | 含义 | 触发条件（MVP 规则） |
|---|---|---|
| `continue` | 本轮通过，进入下一目标表达 | 意思正确且使用了目标表达 |
| `hint` + `retry` | 给提示并要求用目标表达重说 | 意思正确但未用目标表达 |
| `hint` / `simplify` | 降低难度重问 | 意思错误 / 连续失败 |
| `retry`（带 correction） | 纠正语法/不自然表达后重说 | 意思对但语法或自然度差 |
| `complete` | 结束练习 | 完成 3~5 轮，或同一表达重试超 2 次后放行 |

约束：单表达最多重试 2 次；整 session 最多 5 轮；不无限重试。

## 3. 一次练习的数据流程
1. 客户端 `POST /api/practice/turn`（lessonId / scenario / sessionId? / transcript 或音频 / history）。
2. 服务端鉴权（Supabase user），校验 lessonId == `lesson-01`（MVP 边界，其它课 400）。
3. 如有音频 → `transcribeRecording` 得 transcript。
4. 读 `expression_progress` 得薄弱表达 → 取 query embedding → `match_knowledge_chunks(lesson-01, top 3~5)`。
5. 组装 Responses API 输入（system 规则 + 检索知识 + 薄弱表达 + 对话历史 + 本轮 transcript，约束 json_schema）。
6. `validateCoachTurn` 校验结构化输出 → 落库 `practice_sessions` / `practice_turns`（service role）→ 更新 `expression_progress`（掌握度/错误次数/下次复习）。
7. 返回结构化结果给客户端渲染。

## 4. MVP 边界
- 只保证 `lesson-01` 可演示；其它 lessonId 直接 400。
- 已有场景选择、练习、错误恢复和练习报告页面；不是实时语音通话。
- 远程迁移、向量回填及真实 Agent 效果仍须在 Vercel 环境完成验收。
- service role 与 OpenAI key 只在服务端（`lib/supabase/service.ts`、`lib/openai/*` 均为 `server-only`）。
