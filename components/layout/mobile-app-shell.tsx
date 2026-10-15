import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MobileAppShellProps {
  children: ReactNode;
  withBottomNav?: boolean;
  className?: string;
}

export function MobileAppShell({
  children,
  withBottomNav = false,
  className,
}: MobileAppShellProps) {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-[402px] bg-canvas text-ink shadow-card">
      <div
        className={cn(
          "relative min-h-dvh",
          withBottomNav && "pb-[calc(var(--nav-height)+var(--safe-area-bottom))]",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
