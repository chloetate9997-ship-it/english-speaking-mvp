import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SurfaceCardProps {
  children: ReactNode;
  className?: string;
}

export function SurfaceCard({ children, className }: SurfaceCardProps) {
  return (
    <section className={cn("rounded-lg bg-card p-4 text-ink shadow-card", className)}>
      {children}
    </section>
  );
}
