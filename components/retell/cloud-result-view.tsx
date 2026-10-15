"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { SurfaceCard } from "@/components/ui/surface-card";
import { FeedbackSection } from "@/components/feedback/feedback-section";
import { PrimaryAction } from "@/components/ui/primary-action";
import { getRetellResult, type StoredRetellResult } from "@/lib/data/retell-results";

async function requestAnalyze(resultId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/retell/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ resultId }),
    });
    if (res.ok) return { ok: true };
    if (res.status === 409) return { ok: true };
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    return { ok: false, error: body?.error ?? "分析失败，可重试。" };
  } catch {
    return { ok: false, error: "网络异常，录音已保留，可重试。" };
  }
}

interface CloudResultViewProps {
  resultId: string;
  lessonId: string;
  lessonTitle: string;
}

const analyzingStatuses = ["uploaded", "transcribing", "analyzing"];

export function CloudResultView({ resultId, lessonId, lessonTitle }: CloudResultViewProps) {
  const [result, setResult] = useState<StoredRetellResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const fetched = await getRetellResult(resultId);
    if (fetched.ok) {
      setResult(fetched.data);
      setError(null);
    } else {
      setError(fetched.error);
    }
  }, [resultId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const fetched = await getRetellResult(resultId);
      if (cancelled) return;
      if (fetched.ok) {
        setResult(fetched.data);
        // 刚提交的 uploaded 记录自动触发一次 AI 分析（同一记录，不新增）
        if (
          fetched.data.status === "uploaded" &&
          fetched.data.contentScore === null
        ) {
          setAnalyzing(true);
          const r = await requestAnalyze(resultId);
          if (cancelled) return;
          setAnalyzing(false);
          if (!r.ok) setAnalyzeError(r.error ?? "分析失败，可重试。");
          await refresh();
        }
      } else if (!cancelled) {
        setError(fetched.error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resultId, refresh]);

  async function handleRetry() {
    setAnalyzing(true);
    setAnalyzeError(null);
    const r = await requestAnalyze(resultId);
    setAnalyzing(false);
    if (!r.ok) setAnalyzeError(r.error ?? "分析失败，可重试。");
    await refresh();
  }

  if (error) {
    return (
      <SurfaceCard>
        <div className="space-y-2 py-8 text-center">
          <p role="alert" className="text-sm font-semibold text-ink">{error}</p>
          <Link
            className="inline-block pt-1 text-sm font-semibold text-accent-red"
            href={`/lessons/${lessonId}/retell`}
          >
            返回重新录制
          </Link>
        </div>
      </SurfaceCard>
    );
  }

  if (!result) {
    return (
      <SurfaceCard>
        <p className="py-8 text-center text-sm text-subtle">正在加载复述记录…</p>
      </SurfaceCard>
    );
  }

  const pending = analyzing || analyzingStatuses.includes(result.status);

  return (
    <div className="space-y-4">
      <p className="text-center text-xs text-subtle">{lessonTitle}</p>
      <SurfaceCard>
        <h2 className="text-sm font-semibold text-ink">录音回放</h2>
        {result.signedAudioUrl ? (
          <audio className="mt-3 w-full" controls src={result.signedAudioUrl} />
        ) : (
          <p className="mt-2 text-xs text-subtle">录音暂不可用，链接已过期或已被删除。</p>
        )}
        <p className="mt-2 text-xs text-subtle">
          范围：{result.scope === "full" ? "整篇" : "分段"} · 私有存储，链接短期有效。
        </p>
      </SurfaceCard>

      {result.status === "completed" && result.contentScore !== null ? (
        <>
          <SurfaceCard>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">内容得分</h2>
              <p className="text-2xl font-bold tabular-nums text-accent-red">
                {result.contentScore}
              </p>
            </div>
            <div aria-hidden className="mt-3 h-2 overflow-hidden rounded-full bg-segment">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${result.contentScore}%` }}
              />
            </div>
          </SurfaceCard>
          {result.transcript ? (
            <FeedbackSection title="你说的">
              <p>{result.transcript}</p>
            </FeedbackSection>
          ) : null}
          {result.coveredPoints.length > 0 ? (
            <FeedbackSection title="已覆盖内容">
              <ul className="space-y-1">
                {result.coveredPoints.map((p) => (
                  <li key={p}>✓ {p}</li>
                ))}
              </ul>
            </FeedbackSection>
          ) : null}
          {result.missedPoints.length > 0 ? (
            <FeedbackSection title="遗漏内容" tone="warm">
              <ul className="list-disc space-y-1 pl-5">
                {result.missedPoints.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </FeedbackSection>
          ) : null}
          {result.languageSuggestions.length > 0 ? (
            <FeedbackSection title="语言建议">
              <ul className="space-y-1">
                {result.languageSuggestions.map((t) => (
                  <li key={t}>→ {t}</li>
                ))}
              </ul>
            </FeedbackSection>
          ) : null}
          {result.naturalVersion ? (
            <FeedbackSection title="自然表达示例">
              <p>{result.naturalVersion}</p>
            </FeedbackSection>
          ) : null}
          {result.nextExercise ? (
            <FeedbackSection title="下一步练习">
              <p>{result.nextExercise}</p>
            </FeedbackSection>
          ) : null}
        </>
      ) : (
        <SurfaceCard className="bg-warm">
          <h2 className="text-sm font-semibold text-ink">AI 反馈</h2>
          <p className="mt-2 text-sm text-subtle">
            {pending
              ? `正在分析（${result.status}），请稍候…`
              : "分析尚未完成。"}
          </p>
          {result.transcript ? (
            <p className="mt-2 text-sm text-ink">已有转写已保留，重试不会丢失录音。</p>
          ) : null}
          {analyzeError ? (
            <p role="alert" className="mt-2 text-sm text-ink">{analyzeError}</p>
          ) : null}
          <div className="mt-3 space-y-2">
            <PrimaryAction onClick={() => void handleRetry()}>
              {analyzing ? "分析中…" : "重试分析"}
            </PrimaryAction>
            <Link
              className="block text-center text-sm font-semibold text-accent-red"
              href={`/lessons/${lessonId}/result/demo-result`}
            >
              查看演示反馈示例
            </Link>
          </div>
        </SurfaceCard>
      )}
    </div>
  );
}
