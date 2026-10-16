import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { LoadingState } from "@/components/ui/app-states";

export default function Loading() {
  return (
    <MobileAppShell>
      <main className="px-page pb-10 pt-10">
        <LoadingState label="正在加载…" />
      </main>
    </MobileAppShell>
  );
}
