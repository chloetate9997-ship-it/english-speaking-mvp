"use client";

import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { SurfaceCard } from "@/components/ui/surface-card";
import { PrimaryAction } from "@/components/ui/primary-action";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <MobileAppShell>
      <main className="space-y-4 px-page pb-10 pt-10">
        <SurfaceCard>
          <div className="space-y-2 py-6 text-center">
            <h1 className="text-lg font-bold text-ink">出了点小问题</h1>
            <p className="text-sm text-subtle">请重试，本地录音预览不会丢失。</p>
            <div className="pt-3">
              <PrimaryAction onClick={reset}>重试</PrimaryAction>
            </div>
          </div>
        </SurfaceCard>
      </main>
    </MobileAppShell>
  );
}
