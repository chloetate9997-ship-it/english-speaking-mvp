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
```

注意：

- `NEXT_PUBLIC_` 会进入客户端 bundle，只有公开的 URL / publishable key 可这样命名。
- `OPENAI_API_KEY` 只能服务端使用，绝不加 `NEXT_PUBLIC_` 前缀。
- 添加或修改环境变量后需要重新部署才能生效。
- Supabase Auth 中添加 redirect：`http://localhost:3000/auth/confirm`、
  Vercel Preview 地址（按实际策略）、Production 地址。
- Vercel 默认 HTTPS，满足麦克风 `secure context` 要求。
- 先部署 Preview 完成 QA，再升 Production。
