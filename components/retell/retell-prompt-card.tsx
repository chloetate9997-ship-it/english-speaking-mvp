import { SurfaceCard } from "@/components/ui/surface-card";
import { cn } from "@/lib/utils";

interface RetellPromptCardProps {
  scopeLabel: string;
  prompt: string;
  className?: string;
}

export function RetellPromptCard({ scopeLabel, prompt, className }: RetellPromptCardProps) {
  return (
    <SurfaceCard className={cn("bg-warm", className)}>
      <p className="text-xs font-semibold tracking-wide text-accent-red">{scopeLabel}</p>
      <p className="mt-2 text-[15px] leading-relaxed text-ink">{prompt}</p>
    </SurfaceCard>
  );
}
