import { describe, expect, it } from "vitest";
import { formatElapsed, isSegmentActive, mapRetellRow } from "./format";
import { validateFeedback } from "@/lib/openai/feedback-schema";

const validFeedback = {
  contentScore: 82,
  coveredPoints: ["表达了个人观点"],
  missedPoints: ["缺少礼貌回应"],
  languageSuggestions: ["用 I see your point, but... 衔接"],
  naturalVersion: "I see your point, but computers changed everything.",
  nextExercise: "用目标句式再复述一次。",
};

describe("formatElapsed", () => {
  it("formats zero and typical durations", () => {
    expect(formatElapsed(0)).toBe("00:00");
    expect(formatElapsed(65)).toBe("01:05");
    expect(formatElapsed(435)).toBe("07:15");
  });

  it("floors fractional input and clamps negatives", () => {
    expect(formatElapsed(61.9)).toBe("01:01");
    expect(formatElapsed(-5)).toBe("00:00");
  });
});

describe("isSegmentActive", () => {
  it("matches inclusive boundaries", () => {
    expect(isSegmentActive(0, 0, 82)).toBe(true);
    expect(isSegmentActive(82, 0, 82)).toBe(true);
    expect(isSegmentActive(83, 0, 82)).toBe(false);
  });
});

describe("mapRetellRow", () => {
  it("maps snake_case arrays with null fallback", () => {
    const mapped = mapRetellRow({
      covered_points: null,
      missed_points: ["a"],
      language_suggestions: null,
    });
    expect(mapped.coveredPoints).toEqual([]);
    expect(mapped.missedPoints).toEqual(["a"]);
    expect(mapped.languageSuggestions).toEqual([]);
  });
});

describe("validateFeedback", () => {
  it("accepts valid feedback", () => {
    expect(validateFeedback(validFeedback)).toEqual(validFeedback);
  });

  it("rejects out-of-range score and missing fields", () => {
    expect(validateFeedback({ ...validFeedback, contentScore: 101 })).toBeNull();
    expect(validateFeedback({ ...validFeedback, contentScore: 82.5 })).toBeNull();
    const { nextExercise: _omitted, ...missing } = validFeedback;
    void _omitted;
    expect(validateFeedback(missing)).toBeNull();
  });

  it("rejects non-string array items", () => {
    expect(validateFeedback({ ...validFeedback, coveredPoints: [42] })).toBeNull();
  });
});
