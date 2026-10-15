import Link from "next/link";
import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { SurfaceCard } from "@/components/ui/surface-card";
import { PrimaryAction } from "@/components/ui/primary-action";

export default function NotFound() {
  return (
    <MobileAppShell>
      <main className="space-y-4 px-page pb-10 pt-10">
        <SurfaceCard>
          <div className="space-y-2 py-6 text-center">
            <h1 className="text-lg font-bold text-ink">页面不存在</h1>
            <p className="text-sm text-subtle">链接可能已变化，回到首页继续练习。</p>
            <div className="space-y-2 pt-3">
              <PrimaryAction href="/">回到首页</PrimaryAction>
              <Link
                className="block text-center text-sm font-semibold text-accent-red"
                href="/lessons/lesson-01"
              >
                去第 1 篇课程
              </Link>
            </div>
          </div>
        </SurfaceCard>
      </main>
    </MobileAppShell>
  );
}
