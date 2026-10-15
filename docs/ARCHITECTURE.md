# 架构

```mermaid
flowchart LR
    UI[Next.js App Router 页面/组件] --> DATA[lib/data 数据访问层]
    UI --> API[POST /api/retell/analyze]
    DATA --> MOCK[集中 Mock 数据]
    DATA --> SB[Supabase Auth/Database/Storage]
    API --> SB
    API --> AI[OpenAI 转写 + 反馈]
    API --> DB[(retell_results)]
```

## 分层

- `app/`：路由与服务端入口（`loading`/`error`/`not-found` 全局收口）。
- `components/`：展示与交互，不直接散落 Supabase/OpenAI 查询。
- `lib/data/`：repository 层，云端读 Supabase、演示读 Mock，snake_case→camelCase 显式映射。
- `lib/openai/`：`server-only` 服务端模块（client/transcribe/generate-feedback/schema）。
- `lib/supabase/`：browser/server/proxy 三客户端 + `isSupabaseConfigured` 演示开关。
- `supabase/migrations/`：`001` 建表 + RLS + 私有 bucket，`002` 补反馈字段。

## 关键决策

- 同源 Route Handler 做 AI 分析，`OPENAI_API_KEY` 不出服务端。
- 状态机 `uploaded → transcribing → analyzing → completed/failed`，失败复用同一行重试。
- 缺变量自动演示模式，保证可构建、可浏览。
