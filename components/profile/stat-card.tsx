import { cn } from "@/lib/utils";

interface StatCardProps {
  value: number | string;
  label: string;
  className?: string;
}

export function StatCard({ value, label, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "flex h-[92px] w-[106px] flex-col items-center justify-center gap-1 rounded-lg border border-[#FFEFEF] bg-[#FFF8F5] shadow-card",
        className,
      )}
    >
      <p className="text-2xl font-bold tabular-nums text-ink">{value}</p>
      <p className="text-xs text-subtle">{label}</p>
    </div>
  );
}
