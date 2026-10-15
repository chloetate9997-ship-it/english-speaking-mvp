import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface NoteRowProps {
  title: string;
  meta?: string;
  href: string;
  icon?: ReactNode;
  className?: string;
}

export function NoteRow({ title, meta, href, icon, className }: NoteRowProps) {
  return (
    <Link
      className={cn(
        "flex items-center gap-3 rounded-lg bg-card px-4 py-3.5 shadow-card",
        className,
      )}
      href={href}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{title}</p>
        {meta ? <p className="mt-1 truncate text-xs text-subtle">{meta}</p> : null}
      </div>
      <span aria-hidden className="text-subtle">
        {icon ?? <ChevronRight className="size-5" />}
      </span>
    </Link>
  );
}
