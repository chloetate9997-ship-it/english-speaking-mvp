"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, ChevronRight, Mic, MessagesSquare } from "lucide-react";
import { MobileAppShell } from "@/components/layout/mobile-app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { SectionHeader } from "@/components/ui/section-header";
import { FeedbackSection } from "@/components/feedback/feedback-section";
import { PrimaryAction } from "@/components/ui/primary-action";
import { StepTabs } from "@/components/navigation/step-tabs";
import { CoachRecorder } from "@/components/coach/coach-recorder";
import {
  COACH_SCENARIOS,
  getCoachScenario,
  type CoachScenario,
} from "@/lib/agent/scenarios";
import {
  actionGuide,
  buildReport,
  countRetriesOnExpression,
  reachedRetryLimit,
  toCoachErrorMessage,
  toReportTurn,
  type CoachPhase,
  type CoachTurnState,
} from "@/lib/agent/coach-flow";
import type { CoachAction } from "@/lib/agent/coach-schema";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

interface CoachExperienceProps {
  lessonId: string;
  lessonTitle: string;
}

interface PersistedState {
  scenarioId: string;
  sessionId: string;
  phase: CoachPhase;
  turns: CoachTurnState[];
  history: Array<{ role: "assistant" | "user"; text: string }>;
  errorMessage: string | null;
}

const EMPTY: PersistedState = {
  scenarioId: "",
  sessionId: "",
  phase: "scenario",
  turns: [],
  history: [],
  errorMessage: null,
};

function storageKey(lessonId: string): string {
  return `coach:${lessonId}:v1`;
}

function readPersisted(lessonId: string): PersistedState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(storageKey(lessonId));
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return { ...EMPTY, ...parsed };
  } catch {
    return EMPTY;
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("read_failed"));
        return;
      }
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(new Error("read_failed"));
    reader.readAsDataURL(blob);
  });
}

interface ApiResponse {
  sessionId?: string;
  turnNo?: number;
  transcript?: string;
  reply?: string;
  action?: CoachAction;
  targetExpression?: string;
  hint?: string;
  correction?: string;
  naturalVersion?: string;
  scores?: CoachTurnState["scores"];
  sessionCompleted?: boolean;
  error?: string;
}

export function CoachExperience({ lessonId, lessonTitle }: CoachExperienceProps) {
  const [state, setState] = useState<PersistedState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [textMode, setTextMode] = useState(false);
  const [typedText, setTypedText] = useState("");
  const inFlightRef = useRef(false);

  useEffect(() => {
    // 恢复未完成练习：一次性从 localStorage 读取（外部系统同步，见 react.dev 推荐模式）。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(readPersisted(lessonId));
    setHydrated(true);
  }, [lessonId]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey(lessonId), JSON.stringify(state));
    } catch {
      // 存储不可用时忽略：不影响本轮练习。
    }
  }, [state, hydrated, lessonId]);

  const scenario = useMemo(() => getCoachScenario(state.scenarioId), [state.scenarioId]);
  const currentTarget = scenario
    ? scenario.targetExpressions[Math.min(state.turns.length, scenario.targetExpressions.length - 1)]
    : undefined;
  const retries = currentTarget
    ? countRetriesOnExpression(state.turns, currentTarget.expression)
    : 0;

  const startScenario = useCallback((picked: CoachScenario) => {
    setState({
      scenarioId: picked.id,
      sessionId: "",
      phase: "practicing",
      turns: [],
      history: [{ role: "assistant", text: picked.opener }],
      errorMessage: null,
    });
  }, []);

  const restart = useCallback(() => {
    setState(EMPTY);
    setTypedText("");
    setTextMode(false);
  }, []);

  const submitTurn = useCallback(
    async (input: { transcript?: string; audioBase64?: string; audioMime?: string }) => {
      if (inFlightRef.current || submitting) return;
      if (!scenario) return;
      inFlightRef.current = true;
      setSubmitting(true);
      setState((prev) => ({ ...prev, errorMessage: null }));
      try {
        const res = await fetch("/api/practice/turn", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            lessonId,
            scenario: scenario.title,
            sessionId: state.sessionId || undefined,
            history: state.history,
            ...input,
          }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as ApiResponse | null;
          const message = toCoachErrorMessage(res.status, body?.error ?? null);
          const hardFail = res.status === 502 || res.status === 503;
          setState((prev) => ({
            ...prev,
            ...(hardFail ? { phase: "service-error" as CoachPhase } : {}),
            errorMessage: message,
          }));
          return;
        }
        const body = (await res.json()) as ApiResponse;
        if (!body.action || typeof body.turnNo !== "number") {
          setState((prev) => ({
            ...prev,
            errorMessage: "AI 返回格式异常，请重试。",
          }));
          return;
        }
        const targetExpression = body.targetExpression || currentTarget?.expression || "";
        const turnState: CoachTurnState = {
          turnNo: body.turnNo,
          targetExpression,
          targetExpressionChinese: currentTarget?.chinese ?? "",
          reply: body.reply ?? "",
          userTranscript: body.transcript ?? input.transcript ?? "（语音）",
          action: body.action,
          hint: body.hint ?? "",
          correction: body.correction ?? "",
          naturalVersion: body.naturalVersion ?? "",
          scores: body.scores ?? { meaning: 0, targetUsage: 0, grammar: 0, naturalness: 0 },
          completed: Boolean(body.sessionCompleted),
        };
        setState((prev) => {
          const turns = [...prev.turns, turnState];
          const nextHistory = [
            ...prev.history,
            { role: "user" as const, text: turnState.userTranscript },
            { role: "assistant" as const, text: turnState.reply },
          ];
          return {
            ...prev,
            sessionId: body.sessionId ?? prev.sessionId,
            turns,
            history: nextHistory,
            phase: turnState.completed ? ("report" as CoachPhase) : ("practicing" as CoachPhase),
            errorMessage: null,
          };
        });
        setTypedText("");
      } catch {
        setState((prev) => ({
          ...prev,
          phase: "service-error" as CoachPhase,
          errorMessage: "网络异常或 AI 服务暂时不可连接，请稍后重试。",
        }));
      } finally {
        setSubmitting(false);
        inFlightRef.current = false;
      }
    },
    [lessonId, scenario, state.sessionId, state.history, submitting, currentTarget],
  );

  if (!isSupabaseConfigured) {
    return (
      <MobileAppShell>
        <PageHeader backHref={`/lessons/${lessonId}`} title="AI 情景口语教练" />
        <main className="space-y-5 px-page pb-10 pt-2">
          <SurfaceCard className="bg-warm">
            <p className="text-sm text-ink">云端功能未配置，AI 情景练习需连接 Supabase 与 OpenAI。</p>
          </SurfaceCard>
        </main>
      </MobileAppShell>
    );
  }

  return (
    <MobileAppShell>
      <PageHeader
        action={
          <Link className="text-sm font-medium text-brand" href={`/lessons/${lessonId}/notes`}>
            我的笔记
          </Link>
        }
        backHref={`/lessons/${lessonId}`}
        title="AI 情景口语教练"
      />
      <main className="space-y-5 px-page pb-10 pt-2">
        <StepTabs
          current="retell"
          listenHref={`/lessons/${lessonId}`}
          retellHref={`/lessons/${lessonId}`}
        />
        <p className="text-center text-xs text-subtle">{lessonTitle}</p>

        {state.phase === "scenario" ? (
          <ScenarioPicker onPick={startScenario} />
        ) : null}

        {state.phase === "service-error" ? (
          <ServiceErrorView
            message={state.errorMessage ?? "AI 服务暂时不可连接。"}
            onRetry={() => setState((prev) => ({ ...prev, phase: "practicing", errorMessage: null }))}
            onRestart={restart}
            lessonId={lessonId}
          />
        ) : null}

        {state.phase === "practicing" && scenario ? (
          <PracticeView
            currentTargetExpression={currentTarget?.expression ?? ""}
            currentTargetChinese={currentTarget?.chinese ?? ""}
            errorMessage={state.errorMessage}
            onTypedSubmit={() => void submitTurn({ transcript: typedText.trim() })}
            onSubmitAudio={(payload) =>
              void (async () => {
                const audioBase64 = await blobToBase64(payload.blob);
                await submitTurn({ audioBase64, audioMime: payload.mime });
              })()
            }
            onToggleText={() => setTextMode((v) => !v)}
            retries={retries}
            scenario={scenario}
            submitting={submitting}
            textMode={textMode}
            turns={state.turns}
            typedText={typedText}
            onTypedChange={setTypedText}
          />
        ) : null}

        {state.phase === "report" ? (
          <ReportView lessonId={lessonId} onRestart={restart} turns={state.turns} />
        ) : null}
      </main>
    </MobileAppShell>
  );
}

function ScenarioPicker({ onPick }: { onPick: (scenario: CoachScenario) => void }) {
  return (
    <div className="space-y-3">
      <SurfaceCard className="bg-warm">
        <SectionHeader title="选择练习场景" />
        <p className="mt-2 text-sm text-subtle">
          MVP 提供三个基于 lesson-01 的场景，选择后开始多轮情景对话。
        </p>
      </SurfaceCard>
      {COACH_SCENARIOS.map((scenario) => (
        <button
          aria-label={`选择场景 ${scenario.title}`}
          className="w-full rounded-lg bg-card p-4 text-left shadow-card transition-opacity hover:opacity-90"
          key={scenario.id}
          onClick={() => onPick(scenario)}
          type="button"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink">{scenario.title}</p>
            <ChevronRight aria-hidden className="size-5 shrink-0 text-subtle" />
          </div>
          <p className="mt-1 text-xs text-subtle">{scenario.description}</p>
          <p className="mt-2 text-xs text-brand">
            目标表达：{scenario.targetExpressions.map((t) => t.expression).join(" · ")}
          </p>
        </button>
      ))}
    </div>
  );
}

function ServiceErrorView({
  message,
  onRetry,
  onRestart,
  lessonId,
}: {
  message: string;
  onRetry: () => void;
  onRestart: () => void;
  lessonId: string;
}) {
  return (
    <div className="space-y-4">
      <SurfaceCard className="bg-warm">
        <div className="flex flex-col items-center gap-3 py-6 text-center" role="alert">
          <AlertCircle aria-hidden className="size-8 text-accent-red" />
          <p className="text-sm font-semibold text-ink">AI 服务暂时不可连接</p>
          <p className="text-xs leading-relaxed text-subtle">{message}</p>
        </div>
      </SurfaceCard>
      <div className="space-y-3">
        <PrimaryAction onClick={onRetry}>重试本轮</PrimaryAction>
        <button
          className="inline-flex h-[52px] w-full items-center justify-center rounded-button border border-line bg-card text-[15px] font-semibold text-ink"
          onClick={onRestart}
          type="button"
        >
          重新开始
        </button>
        <Link
          className="block text-center text-sm font-semibold text-accent-red"
          href={`/lessons/${lessonId}/retell`}
        >
          返回复述练习
        </Link>
      </div>
    </div>
  );
}

function PracticeView({
  scenario,
  currentTargetExpression,
  currentTargetChinese,
  turns,
  retries,
  textMode,
  typedText,
  submitting,
  errorMessage,
  onTypedChange,
  onToggleText,
  onTypedSubmit,
  onSubmitAudio,
}: {
  scenario: CoachScenario;
  currentTargetExpression: string;
  currentTargetChinese: string;
  turns: CoachTurnState[];
  retries: number;
  textMode: boolean;
  typedText: string;
  submitting: boolean;
  errorMessage: string | null;
  onTypedChange: (value: string) => void;
  onToggleText: () => void;
  onTypedSubmit: () => void;
  onSubmitAudio: (payload: { blob: Blob; mime: string; objectUrl: string }) => void;
}) {
  const roundLabel = `第 ${Math.min(turns.length + 1, 5)} / 5 轮`;
  const retryLocked = reachedRetryLimit(retries);

  return (
    <div className="space-y-4">
      <SurfaceCard>
        <div className="flex items-center justify-between">
          <SectionHeader title={scenario.title} />
          <span className="shrink-0 text-xs font-semibold text-accent-red">{roundLabel}</span>
        </div>
        <p className="mt-2 text-xs text-subtle">{scenario.description}</p>
      </SurfaceCard>

      <SurfaceCard className="bg-warm">
        <SectionHeader title="本轮目标表达" />
        <p className="mt-2 text-sm font-semibold text-ink">{currentTargetExpression}</p>
        {currentTargetChinese ? (
          <p className="mt-1 text-xs text-subtle">{currentTargetChinese}</p>
        ) : null}
        {retryLocked ? (
          <p className="mt-2 text-xs text-accent-red">本题已重试两次，AI 会带你进入下一题。</p>
        ) : null}
      </SurfaceCard>

      <div className="space-y-3">
        {turns.length === 0 ? (
          <FeedbackSection title="Agent 提问">
            <p>{scenario.opener}</p>
          </FeedbackSection>
        ) : null}
        {turns.map((turn) => (
          <div className="space-y-3" key={turn.turnNo}>
            {turn.userTranscript ? (
              <FeedbackSection title="你说的">
                <p>{turn.userTranscript}</p>
              </FeedbackSection>
            ) : null}
            <FeedbackSection title={`Agent 回复 · 第 ${turn.turnNo} 轮`}>
              <p>{turn.reply}</p>
              <p className="mt-2 text-xs text-subtle">{actionGuide(turn.action)}</p>
            </FeedbackSection>
            {turn.hint ? (
              <FeedbackSection title="提示" tone="warm">
                <p>{turn.hint}</p>
              </FeedbackSection>
            ) : null}
            {turn.correction ? (
              <FeedbackSection title="纠错" tone="warm">
                <p>{turn.correction}</p>
              </FeedbackSection>
            ) : null}
            {turn.naturalVersion ? (
              <FeedbackSection title="自然表达">
                <p>{turn.naturalVersion}</p>
              </FeedbackSection>
            ) : null}
            <SurfaceCard className="bg-segment">
              <p className="text-xs text-subtle">
                含义 {turn.scores.meaning} · 目标表达 {turn.scores.targetUsage} · 语法{" "}
                {turn.scores.grammar} · 自然度 {turn.scores.naturalness}
              </p>
            </SurfaceCard>
          </div>
        ))}
      </div>

      {errorMessage ? (
        <p role="alert" className="rounded-lg bg-warm p-3 text-xs leading-relaxed text-ink">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex gap-2" role="group" aria-label="回答方式">
        <button
          aria-pressed={!textMode}
          className={cn(
            "flex h-9 flex-1 items-center justify-center gap-1.5 rounded-pill text-sm font-medium",
            !textMode ? "bg-ink text-white" : "bg-segment text-subtle",
          )}
          onClick={() => textMode && onToggleText()}
          type="button"
        >
          <Mic aria-hidden className="size-4" />
          语音回答
        </button>
        <button
          aria-pressed={textMode}
          className={cn(
            "flex h-9 flex-1 items-center justify-center gap-1.5 rounded-pill text-sm font-medium",
            textMode ? "bg-ink text-white" : "bg-segment text-subtle",
          )}
          onClick={() => !textMode && onToggleText()}
          type="button"
        >
          <MessagesSquare aria-hidden className="size-4" />
          文字回答
        </button>
      </div>

      {textMode ? (
        <SurfaceCard>
          <label className="text-sm font-semibold text-ink" htmlFor="coach-typed">
            用英语写出你的回答
          </label>
          <textarea
            className="mt-2 h-24 w-full resize-none rounded-lg bg-segment p-3 text-sm text-ink outline-none"
            id="coach-typed"
            onChange={(e) => onTypedChange(e.target.value)}
            placeholder="In my opinion..."
            value={typedText}
          />
          <PrimaryAction
            className="mt-3"
            disabled={submitting || typedText.trim().length === 0}
            onClick={onTypedSubmit}
          >
            {submitting ? "AI 分析中…" : "提交本轮回答"}
          </PrimaryAction>
        </SurfaceCard>
      ) : (
        <CoachRecorder disabled={submitting} onSubmit={onSubmitAudio} submitting={submitting} />
      )}
    </div>
  );
}

function ReportView({
  turns,
  lessonId,
  onRestart,
}: {
  turns: CoachTurnState[];
  lessonId: string;
  onRestart: () => void;
}) {
  const report = useMemo(() => buildReport(turns.map(toReportTurn)), [turns]);
  return (
    <div className="space-y-4">
      <SurfaceCard>
        <div className="flex items-center justify-between">
          <SectionHeader title="练习报告" />
          <span className="text-sm font-semibold text-ink">完成 {report.turnCount} 轮</span>
        </div>
      </SurfaceCard>
      <FeedbackSection title="已掌握的表达">
        {report.passedExpressions.length > 0 ? (
          <ul className="space-y-1">
            {report.passedExpressions.map((e) => (
              <li key={e}>✓ {e}</li>
            ))}
          </ul>
        ) : (
          <p className="text-subtle">本轮暂无完全掌握的表达，可再练一次。</p>
        )}
      </FeedbackSection>
      <FeedbackSection title="未掌握的表达" tone="warm">
        {report.weakExpressions.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5">
            {report.weakExpressions.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        ) : (
          <p className="text-subtle">全部目标表达均已通过。</p>
        )}
      </FeedbackSection>
      {report.grammarTips.length > 0 ? (
        <FeedbackSection title="语法与自然度建议">
          <ul className="space-y-1">
            {report.grammarTips.map((t, i) => (
              <li key={`${t}-${i}`}>→ {t}</li>
            ))}
          </ul>
        </FeedbackSection>
      ) : null}
      {report.naturalVersions.length > 0 ? (
        <FeedbackSection title="推荐表达">
          <ul className="space-y-1">
            {report.naturalVersions.map((t, i) => (
              <li key={`${t}-${i}`}>{t}</li>
            ))}
          </ul>
        </FeedbackSection>
      ) : null}
      <FeedbackSection title="下一步复习">
        <p>{report.reviewTip}</p>
      </FeedbackSection>
      <div className="space-y-3 pt-1">
        <PrimaryAction onClick={onRestart}>再练一次</PrimaryAction>
        <Link
          className="block text-center text-sm font-semibold text-accent-red"
          href={`/lessons/${lessonId}/notes`}
        >
          查看本篇笔记
        </Link>
      </div>
    </div>
  );
}
