import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {action ? <div className="shrink-0 text-sm font-medium text-brand">{action}</div> : null}
    </div>
  );
}
