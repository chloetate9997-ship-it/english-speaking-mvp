# Supabase 接入说明

## 1. 创建项目

1. 打开 Supabase Dashboard，新建 Project（记下数据库密码，仅自己保管）。
2. 进入 Project Settings → Data API，复制：
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `Publishable`（`sb_publishable_...`）→ `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. 切勿把 `service_role` / secret key 放进代码或发到聊天中；本项目不会使用它们。

## 2. 执行 migration

- Dashboard → SQL Editor → New query，把 `supabase/migrations/001_initial_schema.sql`
  全文粘贴后 Run（含建表、RLS、grants、私有 bucket `retell-recordings`）。
- 或用 Supabase CLI：`supabase db push`（需自行登录 CLI）。

## 3. 本地环境变量

在项目根目录创建 `.env.local`（不要提交）：

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

未设置这两个变量时，应用自动进入演示模式：Mock 课程、localStorage 笔记均可照常使用。

## 4. Auth redirect 设置

登录使用邮箱 OTP / Magic Link，回调地址为 `/auth/confirm`。

1. Dashboard → Authentication → URL Configuration：
   - Site URL 设为生产域名（本地开发填 `http://localhost:3000`）。
2. Redirect URLs 添加：
   - `http://localhost:3000/auth/confirm`
   - 生产域名下的 `https://<your-domain>/auth/confirm`
3. 确认 Authentication → Providers → Email 已启用；Magic Link / OTP 模板中的
   `{{ .ConfirmationURL }}` 会回到上面的 redirect 地址。

## 5. 安全边界

- `notes` / `learning_progress` / `retell_results` / `profiles` 全表 RLS，
  读写均限制 `auth.uid() = user_id`（profiles 为 `auth.uid() = id`）。
- `lessons` / `lesson_segments` 仅已发布内容可读（含匿名），客户端无写入权限。
- Storage bucket `retell-recordings` 为私有；policy 仅允许登录用户读写
  `retell-recordings/{自己的 user id}/...` 路径；预览使用短期 signed URL。
- 管理类写入不在客户端执行；`/manage/lessons` 保持只读占位。
