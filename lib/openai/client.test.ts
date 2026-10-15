import { describe, expect, it } from "vitest";
import { createOpenAiClient, feedbackModel } from "./client";

describe("openai client safety branches", () => {
  it("returns null without key and never exposes one", () => {
    const saved = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    expect(createOpenAiClient()).toBeNull();
    if (saved !== undefined) process.env.OPENAI_API_KEY = saved;
  });

  it("falls back to a non-secret default model", () => {
    const saved = process.env.OPENAI_FEEDBACK_MODEL;
    delete process.env.OPENAI_FEEDBACK_MODEL;
    expect(feedbackModel()).toBe("gpt-4o-mini");
    if (saved !== undefined) process.env.OPENAI_FEEDBACK_MODEL = saved;
  });
});
