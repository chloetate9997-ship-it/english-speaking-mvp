import type { ReactNode } from "react";
import { SurfaceCard } from "@/components/ui/surface-card";
import { cn } from "@/lib/utils";

interface FeedbackSectionProps {
  title: string;
  children: ReactNode;
  tone?: "default" | "warm";
  className?: string;
}

export function FeedbackSection({ title, children, tone = "default", className }: FeedbackSectionProps) {
  return (
    <SurfaceCard className={cn(tone === "warm" && "bg-warm", className)}>
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <div className="mt-2 text-sm leading-relaxed text-ink">{children}</div>
    </SurfaceCard>
  );
}
