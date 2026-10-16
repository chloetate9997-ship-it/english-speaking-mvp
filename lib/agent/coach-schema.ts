export type CoachAction = "continue" | "hint" | "retry" | "simplify" | "complete";

export interface CoachScores {
  meaning: number;
  targetUsage: number;
  grammar: number;
  naturalness: number;
}

export interface CoachTurn {
  transcript: string;
  reply: string;
  action: CoachAction;
  targetExpression: string;
  hint: string;
  correction: string;
  naturalVersion: string;
  scores: CoachScores;
  sessionCompleted: boolean;
}

export const coachTurnSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    transcript: { type: "string", minLength: 1, maxLength: 2000 },
    reply: { type: "string", minLength: 1, maxLength: 600 },
    action: { type: "string", enum: ["continue", "hint", "retry", "simplify", "complete"] },
    targetExpression: { type: "string", maxLength: 200 },
    hint: { type: "string", maxLength: 300 },
    correction: { type: "string", maxLength: 500 },
    naturalVersion: { type: "string", maxLength: 600 },
    scores: {
      type: "object",
      additionalProperties: false,
      properties: {
        meaning: { type: "integer", minimum: 0, maximum: 100 },
        targetUsage: { type: "integer", minimum: 0, maximum: 100 },
        grammar: { type: "integer", minimum: 0, maximum: 100 },
        naturalness: { type: "integer", minimum: 0, maximum: 100 },
      },
      required: ["meaning", "targetUsage", "grammar", "naturalness"],
    },
    sessionCompleted: { type: "boolean" },
  },
  required: [
    "transcript",
    "reply",
    "action",
    "targetExpression",
    "hint",
    "correction",
    "naturalVersion",
    "scores",
    "sessionCompleted",
  ],
} as const;

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 100 ? v : null;
}

function str(v: unknown, max: number, required: boolean): string | null {
  if (typeof v !== "string") return required ? null : "";
  const t = v.trim();
  if (required && !t) return null;
  return t.slice(0, max);
}

export function validateCoachTurn(raw: unknown): CoachTurn | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Record<string, unknown>;
  const transcript = str(o.transcript, 2000, true);
  const reply = str(o.reply, 600, true);
  const targetExpression = str(o.targetExpression, 200, false) ?? "";
  const hint = str(o.hint, 300, false) ?? "";
  const correction = str(o.correction, 500, false) ?? "";
  const naturalVersion = str(o.naturalVersion, 600, false) ?? "";
  const action = o.action;
  const s = o.scores as Record<string, unknown> | null;
  const meaning = s ? num(s.meaning) : null;
  const targetUsage = s ? num(s.targetUsage) : null;
  const grammar = s ? num(s.grammar) : null;
  const naturalness = s ? num(s.naturalness) : null;
  if (
    transcript === null ||
    reply === null ||
    !["continue", "hint", "retry", "simplify", "complete"].includes(action as string) ||
    meaning === null ||
    targetUsage === null ||
    grammar === null ||
    naturalness === null ||
    typeof o.sessionCompleted !== "boolean"
  ) {
    return null;
  }
  return {
    transcript,
    reply,
    action: action as CoachAction,
    targetExpression,
    hint,
    correction,
    naturalVersion,
    scores: { meaning, targetUsage, grammar, naturalness },
    sessionCompleted: o.sessionCompleted,
  };
}

/** 纯规则：不调 LLM 即可单测 action 分支。 */
export function decideAction(input: {
  meaningOk: boolean;
  usedTarget: boolean;
  grammarOk: boolean;
  turnNo: number;
  retriesOnExpression: number;
}): CoachAction {
  if (input.turnNo >= 5) return "complete";
  if (!input.meaningOk) return input.retriesOnExpression >= 1 ? "simplify" : "hint";
  if (!input.usedTarget) return "hint";
  if (!input.grammarOk) return "retry";
  if (input.retriesOnExpression >= 2) return "continue";
  return input.turnNo >= 3 ? "complete" : "continue";
}
