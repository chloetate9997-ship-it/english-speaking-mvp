"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface HistoryBackButtonProps {
  fallbackHref: string;
}

export function HistoryBackButton({ fallbackHref }: HistoryBackButtonProps) {
  const router = useRouter();

  function goBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  }

  return (
    <button
      aria-label="返回上一页"
      className="inline-flex size-10 items-center justify-center rounded-full text-ink hover:bg-muted"
      onClick={goBack}
      type="button"
    >
      <ArrowLeft aria-hidden className="size-5" />
    </button>
  );
}
