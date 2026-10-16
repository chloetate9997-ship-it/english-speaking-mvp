# 部署（Vercel）

本仓库尚未连接 GitHub / 尚未部署，以下只写步骤，不代为执行。

## 方式 A：GitHub 导入 Vercel

1. 将本项目推送到 GitHub 私有/公开仓库（自行决定，不强制公开）。
2. Vercel → Add New Project → Import 该仓库，框架选 Next.js，根目录即项目根。
3. 在 Preview 环境先填环境变量并部署，QA 通过后再配 Production。
4. 生产域名确定后，回 Supabase Auth URL Configuration 追加对应 redirect URL。

## 方式 B：Vercel CLI（项目根目录）

```bash
npm i -g vercel
vercel login   # 自行在浏览器完成登录
vercel         # 生成 Preview 部署
vercel --prod  # QA 通过后再升 Production
```

## 环境变量

Preview 与 Production 均需（按环境分别填写）：

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
OPENAI_API_KEY
OPENAI_FEEDBACK_MODEL
OPENAI_EMBEDDING_MODEL
SUPABASE_SERVICE_ROLE_KEY
RAG_SYNC_SECRET
```

注意：

- `NEXT_PUBLIC_` 会进入客户端 bundle，只有公开的 URL / publishable key 可这样命名。
- `OPENAI_API_KEY` 只能服务端使用，绝不加 `NEXT_PUBLIC_` 前缀。
- 添加或修改环境变量后需要重新部署才能生效。
- Supabase Auth 中添加 redirect：`http://localhost:3000/auth/confirm`、
  Vercel Preview 地址（按实际策略）、Production 地址。
- Vercel 默认 HTTPS，满足麦克风 `secure context` 要求。
- 先部署 Preview 完成 QA，再升 Production。

## RAG 向量初始化（部署后一次性执行）

本地网络无法直连 `api.openai.com`，因此 lesson-01 的 8 条 knowledge chunks 的
embedding 回填改为在部署环境（Vercel，可访问 OpenAI）通过受保护的服务端入口执行：

```bash
curl -X POST https://<你的部署域名>/api/admin/rag-sync \
  -H "Authorization: Bearer <RAG_SYNC_SECRET>"
```

- 仅在服务端读取 `OPENAI_API_KEY` / `SUPABASE_SERVICE_ROLE_KEY`，不进入浏览器 bundle。
- 幂等：只更新 `embedding` 为空的行，重复执行返回 `{"lessonId":"lesson-01","updated":0}`，不产生重复数据。
- 未授权（缺失/错误 Bearer）返回 `401`；未配置密钥返回 `503`。
- 成功后返回 `{"lessonId":"lesson-01","updated":N}`，N 为本次回填的真实 embedding 数量。
