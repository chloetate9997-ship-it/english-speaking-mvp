export interface RetellFeedback {
  contentScore: number;
  coveredPoints: string[];
  missedPoints: string[];
  languageSuggestions: string[];
  naturalVersion: string;
  nextExercise: string;
}

export const retellFeedbackSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    contentScore: { type: "integer", minimum: 0, maximum: 100 },
    coveredPoints: { type: "array", items: { type: "string", minLength: 1, maxLength: 200 } },
    missedPoints: { type: "array", items: { type: "string", minLength: 1, maxLength: 200 } },
    languageSuggestions: { type: "array", items: { type: "string", minLength: 1, maxLength: 300 } },
    naturalVersion: { type: "string", minLength: 1, maxLength: 1200 },
    nextExercise: { type: "string", minLength: 1, maxLength: 300 },
  },
  required: [
    "contentScore",
    "coveredPoints",
    "missedPoints",
    "languageSuggestions",
    "naturalVersion",
    "nextExercise",
  ],
} as const;

function cleanList(value: unknown, maxLen: number): string[] | null {
  if (!Array.isArray(value)) return null;
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") return null;
    const t = item.trim();
    if (!t) continue;
    out.push(t.slice(0, maxLen));
    if (out.length >= 6) break;
  }
  return out;
}

function cleanText(value: unknown, maxLen: number): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  if (!t) return null;
  return t.slice(0, maxLen);
}

export function validateFeedback(raw: unknown): RetellFeedback | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Record<string, unknown>;
  const score = o.contentScore;
  if (typeof score !== "number" || !Number.isInteger(score) || score < 0 || score > 100) {
    return null;
  }
  const coveredPoints = cleanList(o.coveredPoints, 200);
  const missedPoints = cleanList(o.missedPoints, 200);
  const languageSuggestions = cleanList(o.languageSuggestions, 300);
  const naturalVersion = cleanText(o.naturalVersion, 1200);
  const nextExercise = cleanText(o.nextExercise, 300);
  if (!coveredPoints || !missedPoints || !languageSuggestions || !naturalVersion || !nextExercise) {
    return null;
  }
  return { contentScore: score, coveredPoints, missedPoints, languageSuggestions, naturalVersion, nextExercise };
}
