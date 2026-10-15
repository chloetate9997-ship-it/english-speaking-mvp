"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SurfaceCard } from "@/components/ui/surface-card";
import { createClient } from "@/lib/supabase/client";

interface ProfileAuthSectionProps {
  email: string | null;
  demo: boolean;
}

export function ProfileAuthSection({ email, demo }: ProfileAuthSectionProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      /* 演示模式或网络异常时直接刷新即可 */
    } finally {
      setSigningOut(false);
      router.refresh();
    }
  }

  return (
    <SurfaceCard>
      <h2 className="text-sm font-semibold text-ink">账号</h2>
      {demo ? (
        <p role="status" className="mt-2 text-xs leading-relaxed text-subtle">
          演示模式：未配置 Supabase，云端登录与同步不可用，本地功能不受影响。
        </p>
      ) : email ? (
        <div className="mt-2 space-y-3">
          <p className="truncate text-sm text-ink">{email}</p>
          <button
            className="inline-flex h-10 items-center justify-center rounded-button border border-line px-5 text-sm font-semibold text-ink disabled:opacity-40"
            disabled={signingOut}
            onClick={() => void handleSignOut()}
            type="button"
          >
            {signingOut ? "退出中…" : "退出登录"}
          </button>
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          <p className="text-xs leading-relaxed text-subtle">
            未登录：登录后可将笔记、进度与录音同步到云端。
          </p>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-button bg-ink px-5 text-sm font-semibold text-white"
            href="/login"
          >
            去登录
          </Link>
        </div>
      )}
    </SurfaceCard>
  );
}
