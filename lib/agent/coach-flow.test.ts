import { describe, expect, it } from "vitest";
import {
  actionGuide,
  buildReport,
  countRetriesOnExpression,
  reachedRetryLimit,
  toCoachErrorMessage,
  type CoachTurnState,
} from "./coach-flow";
import type { CoachAction } from "./coach-schema";

function turn(overrides: Partial<CoachTurnState>): CoachTurnState {
  return {
    turnNo: 1,
    targetExpression: "In my opinion",
    targetExpressionChinese: "依我看来",
    reply: "Great!",
    userTranscript: "In my opinion computers are great.",
    action: "continue",
    hint: "",
    correction: "",
    naturalVersion: "",
    scores: { meaning: 90, targetUsage: 100, grammar: 90, naturalness: 85 },
    completed: false,
    ...overrides,
  };
}

const actions: CoachAction[] = ["continue", "hint", "retry", "simplify", "complete"];

describe("coach action guides cover all branches", () => {
  it.each(actions)("has a guide for %s", (action) => {
    expect(actionGuide(action).length).toBeGreaterThan(0);
  });
});

describe("retry cap: max 2 per expression", () => {
  it("counts hint/retry on the same expression only", () => {
    const turns = [
      turn({ action: "hint" }),
      turn({ action: "retry", turnNo: 2 }),
      turn({ action: "hint", targetExpression: "Suppose", turnNo: 3 }),
      turn({ action: "continue", turnNo: 4 }),
    ];
    expect(countRetriesOnExpression(turns, "In my opinion")).toBe(2);
    expect(countRetriesOnExpression(turns, "Suppose")).toBe(1);
  });

  it("locks at 2 retries", () => {
    expect(reachedRetryLimit(0)).toBe(false);
    expect(reachedRetryLimit(1)).toBe(false);
    expect(reachedRetryLimit(2)).toBe(true);
    expect(reachedRetryLimit(3)).toBe(true);
  });
});

describe("report", () => {
  it("splits passed/weak, dedupes, and gives review tip", () => {
    const report = buildReport([
      { turnNo: 1, targetExpression: "In my opinion", action: "continue", correction: "", naturalVersion: "nv1", grammar: 90, naturalness: 85 },
      { turnNo: 2, targetExpression: "Suppose", action: "hint", correction: "fix verb", naturalVersion: "nv2", grammar: 60, naturalness: 60 },
    ]);
    expect(report.turnCount).toBe(2);
    expect(report.passedExpressions).toEqual(["In my opinion"]);
    expect(report.weakExpressions).toEqual(["Suppose"]);
    expect(report.grammarTips).toEqual(["fix verb"]);
    expect(report.naturalVersions).toEqual(["nv1", "nv2"]);
    expect(report.suggestedExpressions).toEqual(["Suppose"]);
    expect(report.reviewTip).toContain("明天");
  });

  it("all passed -> no weak expressions", () => {
    const report = buildReport([
      { turnNo: 1, targetExpression: "In my opinion", action: "complete", correction: "", naturalVersion: "", grammar: 95, naturalness: 90 },
    ]);
    expect(report.weakExpressions).toEqual([]);
    expect(report.suggestedExpressions).toEqual([]);
  });
});

describe("service error status shows offline state, never fake success", () => {
  it("maps 502/503 to the unconnectable message", () => {
    expect(toCoachErrorMessage(502, "transcribe failed")).toContain("暂时不可连接");
    expect(toCoachErrorMessage(502, "transcribe failed")).toContain("本次练习未完成");
    expect(toCoachErrorMessage(503, "no key")).toContain("暂时不可连接");
  });

  it("maps 401/404/422 distinctly", () => {
    expect(toCoachErrorMessage(401, null)).toContain("登录");
    expect(toCoachErrorMessage(404, null)).toContain("重新开始");
    expect(toCoachErrorMessage(422, null)).toContain("5 轮");
  });

  it("falls back to server message or generic", () => {
    expect(toCoachErrorMessage(400, "缺少转写。")).toBe("缺少转写。");
    expect(toCoachErrorMessage(500, null)).toBe("请求失败，请重试。");
  });
});
