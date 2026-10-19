import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  backHref?: string;
  backAction?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ title, backHref, backAction, action, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "grid min-h-14 grid-cols-[40px_1fr_40px] items-center px-page pt-[var(--safe-area-top)]",
        className,
      )}
    >
      <div>
        {backAction ?? (backHref ? (
          <Link
            aria-label="返回"
            className="inline-flex size-10 items-center justify-center rounded-full text-ink hover:bg-muted"
            href={backHref}
          >
            <ArrowLeft aria-hidden className="size-5" />
          </Link>
        ) : null)}
      </div>
      <h1 className="truncate text-center text-[20px] font-bold leading-[27px] tracking-tight text-ink">{title}</h1>
      <div className="flex justify-end">{action}</div>
    </header>
  );
}
