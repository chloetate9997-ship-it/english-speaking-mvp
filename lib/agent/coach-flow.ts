import type { CoachAction, CoachTurn } from "./coach-schema";

export type CoachPhase =
  | "scenario"
  | "practicing"
  | "report"
  | "service-error";

export interface CoachHistoryItem {
  role: "assistant" | "user";
  text: string;
}

export interface CoachTurnState {
  turnNo: number;
  targetExpression: string;
  targetExpressionChinese: string;
  reply: string;
  userTranscript: string;
  action: CoachAction;
  hint: string;
  correction: string;
  naturalVersion: string;
  scores: CoachTurn["scores"];
  completed: boolean;
}

export interface CoachReportTurn {
  turnNo: number;
  targetExpression: string;
  action: CoachAction;
  correction: string;
  naturalVersion: string;
  grammar: number;
  naturalness: number;
}

export const MAX_PRACTICE_TURNS = 5;
export const MAX_RETRIES_PER_EXPRESSION = 2;

export function countRetriesOnExpression(
  turns: Pick<CoachTurnState, "action" | "targetExpression">[],
  targetExpression: string,
): number {
  return turns.filter(
    (t) =>
      t.targetExpression === targetExpression &&
      (t.action === "hint" || t.action === "retry"),
  ).length;
}

/** 每题最多重试两次：达到上限后提示换表达继续（由服务端强制推进）。 */
export function reachedRetryLimit(retries: number): boolean {
  return retries >= MAX_RETRIES_PER_EXPRESSION;
}

export function toReportTurn(turn: CoachTurnState): CoachReportTurn {
  return {
    turnNo: turn.turnNo,
    targetExpression: turn.targetExpression,
    action: turn.action,
    correction: turn.correction,
    naturalVersion: turn.naturalVersion,
    grammar: turn.scores.grammar,
    naturalness: turn.scores.naturalness,
  };
}

export interface CoachReport {
  turnCount: number;
  passedExpressions: string[];
  weakExpressions: string[];
  grammarTips: string[];
  naturalVersions: string[];
  suggestedExpressions: string[];
  reviewTip: string;
}

export function buildReport(turns: CoachReportTurn[]): CoachReport {
  const passed = new Set<string>();
  const weak = new Set<string>();
  const grammarTips: string[] = [];
  const naturalVersions: string[] = [];
  for (const t of turns) {
    if (t.action === "continue" || t.action === "complete") passed.add(t.targetExpression);
    else weak.add(t.targetExpression);
    if (t.correction) grammarTips.push(t.correction);
    if (t.naturalVersion) naturalVersions.push(t.naturalVersion);
  }
  for (const e of passed) weak.delete(e);
  const suggested = turns.map((t) => t.targetExpression).filter((e) => !passed.has(e));
  return {
    turnCount: turns.length,
    passedExpressions: [...passed],
    weakExpressions: [...weak],
    grammarTips: grammarTips.slice(0, 5),
    naturalVersions: naturalVersions.slice(0, 5),
    suggestedExpressions: [...new Set(suggested)].slice(0, 3),
    reviewTip:
      weak.size > 0
        ? "把未掌握的表达各造一个新句子，明天再练一次本场景。"
        : "全部目标表达已通过，明天用新话题再巩固一次。",
  };
}

/**
 * 服务端错误 → 页面展示文案。
 * AI 服务不可连接（含本地直连超时、本次 embedding 留空导致的 502）统一展示同一错误状态，不假装成功。
 */
export function toCoachErrorMessage(status: number, serverMessage: string | null): string {
  if (status === 401) return "请先登录后再开始 AI 情景练习。";
  if (status === 503 || status === 502) {
    return "AI 服务暂时不可连接，本次练习未完成，录音已保留，请稍后重试。";
  }
  if (status === 404) return "练习会话不存在或已结束，请重新开始。";
  if (status === 422) return "本轮练习已达 5 轮上限，可查看报告或重新开始。";
  return serverMessage?.trim() || "请求失败，请重试。";
}

/** 对应 /api/practice/turn 的 Agent 动作 → 下一步操作文案。 */
export function actionGuide(action: CoachAction): string {
  switch (action) {
    case "continue":
      return "本轮通过，下一题将换一个目标表达。";
    case "hint":
      return "按提示用目标表达重新录制（每题最多重试两次）。";
    case "retry":
      return "先看纠错，再用正确说法重新录制。";
    case "simplify":
      return "题目已降低难度，可以从给出的句子开头说起。";
    case "complete":
      return "练习完成，正在生成你的练习报告。";
  }
}
