"use client";

import Link from "next/link";
import { BookOpen, History, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "首页", icon: BookOpen },
  { href: "/history", label: "学习记录", icon: History },
  { href: "/profile", label: "我的", icon: UserRound },
] as const;

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="主导航"
      className="fixed bottom-0 left-1/2 z-10 grid h-[calc(var(--nav-height)+var(--safe-area-bottom))] w-full max-w-[402px] -translate-x-1/2 grid-cols-3 border-t border-divider bg-canvas/95 pb-[var(--safe-area-bottom)] backdrop-blur"
    >
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className="flex items-center justify-center"
            href={item.href}
            key={item.href}
          >
            <span
              className={cn(
                "flex h-12 w-[108px] flex-col items-center justify-center gap-0.5 rounded-[24px] text-[11px] text-subtle",
                active && "border border-line bg-white font-semibold text-ink shadow-card",
              )}
            >
              <Icon aria-hidden className="size-5" />
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
