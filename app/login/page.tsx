"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { PrimaryAction } from "@/components/ui/primary-action";
import { SurfaceCard } from "@/components/ui/surface-card";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";

type LoginView = "form" | "sending" | "sent" | "error";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [view, setView] = useState<LoginView>("form");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMessage("请输入有效的邮箱地址。");
      setView("error");
      return;
    }
    if (!isSupabaseConfigured) return;
    setView("sending");
    setErrorMessage(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });
      if (error) {
        setErrorMessage("发送失败，请检查网络后重试。");
        setView("error");
        return;
      }
      setView("sent");
    } catch {
      setErrorMessage("发送失败，请检查网络后重试。");
      setView("error");
    }
  }

  return (
    <MobileAppShell>
      <PageHeader backHref="/profile" title="登录" />
      <main className="space-y-4 px-page pb-10 pt-2">
        <SurfaceCard>
          <h1 className="text-[20px] font-bold leading-[27px] text-ink">
            邮箱登录
          </h1>
          <p className="mt-1 text-xs text-subtle">
            输入邮箱后，我们会发送一封登录链接邮件。
          </p>
          {!isSupabaseConfigured ? (
            <p role="status" className="mt-4 rounded-lg bg-warm p-3 text-xs leading-relaxed text-ink">
              当前为演示模式：未检测到 Supabase 环境变量。如需启用云端登录，
              请在 `.env.local` 中设置 `NEXT_PUBLIC_SUPABASE_URL` 与
              `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`，详见 README。
            </p>
          ) : view === "sent" ? (
            <div className="mt-4 space-y-3">
              <p role="status" className="rounded-lg bg-warm p-3 text-xs leading-relaxed text-ink">
                登录邮件已发送至 {email.trim()}，请点击邮件中的链接完成登录。
              </p>
              <button
                className="text-sm font-semibold text-accent-red"
                onClick={() => setView("form")}
                type="button"
              >
                重新发送
              </button>
            </div>
          ) : (
            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-ink" htmlFor="login-email">
                邮箱地址
              </label>
              <input
                autoComplete="email"
                className="h-12 w-full rounded-button border border-line bg-canvas px-4 text-[15px] text-ink"
                disabled={view === "sending"}
                id="login-email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                type="email"
                value={email}
              />
              {view === "error" && errorMessage ? (
                <p role="alert" className="text-xs text-accent-red">
                  {errorMessage}
                </p>
              ) : null}
              <PrimaryAction disabled={view === "sending"} type="submit">
                {view === "sending" ? "发送中…" : "发送登录链接"}
              </PrimaryAction>
              {view === "error" ? (
                <button
                  className="w-full text-center text-sm font-semibold text-accent-red"
                  onClick={() => {
                    setErrorMessage(null);
                    setView("form");
                  }}
                  type="button"
                >
                  重试
                </button>
              ) : null}
            </form>
          )}
        </SurfaceCard>
      </main>
    </MobileAppShell>
  );
}
