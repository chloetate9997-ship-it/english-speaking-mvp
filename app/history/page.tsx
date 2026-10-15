import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { BottomNavigation } from "@/components/navigation/bottom-navigation";
import { PageHeader } from "@/components/layout/page-header";
import { HistoryExperience } from "@/components/history/history-experience";

export default function HistoryPage() {
  return (
    <MobileAppShell withBottomNav>
      <PageHeader title="我的笔记" />
      <main className="space-y-4 px-page pb-10 pt-2">
        <p className="text-center text-xs text-subtle">按文章查看我的笔记</p>
        <HistoryExperience />
      </main>
      <BottomNavigation />
    </MobileAppShell>
  );
}
