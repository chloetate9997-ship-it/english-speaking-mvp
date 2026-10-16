"use client";

import { cn } from "@/lib/utils";

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      aria-label={ariaLabel}
      className={cn("flex rounded-pill bg-segment p-1", className)}
      role="radiogroup"
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <button
            aria-checked={selected}
            className={cn(
              "min-h-9 flex-1 rounded-pill px-3 text-sm font-medium text-subtle transition-colors",
              selected && "bg-white text-ink shadow-card",
            )}
            key={option.value}
            onClick={() => onChange(option.value)}
            role="radio"
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
