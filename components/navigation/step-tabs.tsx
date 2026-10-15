import Link from "next/link";
import { cn } from "@/lib/utils";

export type LessonStep = "listen" | "retell";

interface StepTabsProps {
  current: LessonStep;
  listenHref: string;
  retellHref: string;
  className?: string;
}

const steps: Array<{ value: LessonStep; label: string; hrefKey: "listenHref" | "retellHref" }> = [
  { value: "listen", label: "精听", hrefKey: "listenHref" },
  { value: "retell", label: "复述", hrefKey: "retellHref" },
];

export function StepTabs({ current, listenHref, retellHref, className }: StepTabsProps) {
  const hrefs = { listenHref, retellHref };

  return (
    <nav
      aria-label="课程步骤"
      className={cn("grid grid-cols-2 gap-2 rounded-pill bg-segment p-1", className)}
    >
      {steps.map((step) => {
        const active = step.value === current;

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-pill px-4 py-2 text-center text-sm font-medium text-subtle transition-colors",
              active && "bg-brand text-white",
            )}
            href={hrefs[step.hrefKey]}
            key={step.value}
          >
            {step.label}
          </Link>
        );
      })}
    </nav>
  );
}
