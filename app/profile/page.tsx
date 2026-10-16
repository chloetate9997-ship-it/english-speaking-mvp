import Link from "next/link";
import { ChevronRight, LayoutGrid } from "lucide-react";
import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { BottomNavigation } from "@/components/navigation/bottom-navigation";
import { StatCard } from "@/components/profile/stat-card";
import { SurfaceCard } from "@/components/ui/surface-card";
import { ProfileAuthSection } from "@/components/profile/profile-auth-section";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSessionUser } from "@/lib/supabase/server";
import { profileStats } from "@/lib/mock-data/lessons";

export default async function ProfilePage() {
  const user = await getSessionUser();
  const progressPercent = Math.min(
    100,
    Math.round((profileStats.completedLessons / profileStats.totalLessons) * 100),
  );

  return (
    <MobileAppShell withBottomNav>
      <main className="space-y-5 px-page pb-10 pt-8">
        <section className="flex items-center gap-4">
          <span
            aria-hidden
            className="flex size-16 items-center justify-center rounded-full border border-line bg-white text-2xl font-bold text-ink shadow-card"
          >
            C
          </span>
          <div>
            <h1 className="text-[20px] font-bold leading-[27px] text-ink">学习者</h1>
            <p className="mt-0.5 text-xs text-subtle">坚持完成20篇，开口说英语</p>
          </div>
        </section>

        <ProfileAuthSection
          demo={!isSupabaseConfigured}
          email={user?.email ?? null}
        />

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-ink">学习统计</h2>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="已学课程" value={String(profileStats.completedLessons)} />
            <StatCard label="总笔记" value={String(profileStats.totalNotes)} />
            <StatCard label="总录音" value={String(profileStats.totalRecordings)} />
          </div>
        </section>

        <SurfaceCard>
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-ink">学习进度总览</h2>
            <p className="text-xs tabular-nums text-subtle">
              {profileStats.completedLessons} / {profileStats.totalLessons}篇
            </p>
          </div>
          <div
            aria-hidden
            className="mt-3 h-2 overflow-hidden rounded-full bg-segment"
          >
            <div className="h-full rounded-full bg-brand" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="mt-2 text-xs text-subtle">
            已完成 {profileStats.completedLessons} 篇，继续加油，下一站第 2 篇。
          </p>
        </SurfaceCard>

        <Link
          className="flex items-center gap-3 rounded-lg bg-card p-4 shadow-card"
          href="/manage/lessons"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-play text-ink">
            <LayoutGrid aria-hidden className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-ink">课程管理</span>
            <span className="mt-0.5 block text-xs text-subtle">查看 20 篇课程安排</span>
          </span>
          <ChevronRight aria-hidden className="size-5 shrink-0 text-subtle" />
        </Link>
      </main>
      <BottomNavigation />
    </MobileAppShell>
  );
}
