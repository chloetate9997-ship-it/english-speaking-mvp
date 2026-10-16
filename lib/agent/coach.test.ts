import { describe, expect, it, vi } from "vitest";
import { decideAction, validateCoachTurn } from "./coach-schema";
import { buildLesson01Chunks, retrieveKnowledge } from "./rag";

describe("coach structured output", () => {
  it("accepts a valid turn", () => {
    const turn = validateCoachTurn({
      transcript: "In my opinion computers are the best.",
      reply: "Great! 你用了目标表达。",
      action: "continue",
      targetExpression: "In my opinion",
      hint: "",
      correction: "",
      naturalVersion: "In my opinion, computers are the greatest invention.",
      scores: { meaning: 90, targetUsage: 100, grammar: 90, naturalness: 85 },
      sessionCompleted: false,
    });
    expect(turn?.action).toBe("continue");
  });

  it("rejects bad action / scores", () => {
    expect(
      validateCoachTurn({
        transcript: "hi",
        reply: "hi",
        action: "dance",
        targetExpression: "",
        hint: "",
        correction: "",
        naturalVersion: "",
        scores: { meaning: 120, targetUsage: 0, grammar: 0, naturalness: 0 },
        sessionCompleted: false,
      }),
    ).toBeNull();
  });
});

describe("action branches", () => {
  it("meaning error -> hint/simplify", () => {
    expect(
      decideAction({ meaningOk: false, usedTarget: false, grammarOk: true, turnNo: 1, retriesOnExpression: 0 }),
    ).toBe("hint");
    expect(
      decideAction({ meaningOk: false, usedTarget: false, grammarOk: true, turnNo: 2, retriesOnExpression: 1 }),
    ).toBe("simplify");
  });
  it("correct meaning without target -> hint", () => {
    expect(
      decideAction({ meaningOk: true, usedTarget: false, grammarOk: true, turnNo: 1, retriesOnExpression: 0 }),
    ).toBe("hint");
  });
  it("grammar issue -> retry; success -> continue; cap -> complete", () => {
    expect(
      decideAction({ meaningOk: true, usedTarget: true, grammarOk: false, turnNo: 1, retriesOnExpression: 0 }),
    ).toBe("retry");
    expect(
      decideAction({ meaningOk: true, usedTarget: true, grammarOk: true, turnNo: 1, retriesOnExpression: 0 }),
    ).toBe("continue");
    expect(
      decideAction({ meaningOk: true, usedTarget: true, grammarOk: true, turnNo: 5, retriesOnExpression: 0 }),
    ).toBe("complete");
  });
});

describe("rag lesson scope", () => {
  it("chunks are all lesson-01", () => {
    for (const c of buildLesson01Chunks()) expect(c.lesson_id).toBe("lesson-01");
    expect(buildLesson01Chunks().length).toBeGreaterThanOrEqual(7);
  });

  it("rejects non-lesson-01 retrieval", async () => {
    const admin = { rpc: vi.fn() } as never;
    const openai = { embeddings: { create: vi.fn() } } as never;
    await expect(
      retrieveKnowledge(admin, openai, { lessonId: "lesson-02", userText: "hi" }),
    ).rejects.toThrow("only_lesson_01_supported");
  });

  it("rpc is called with lesson filter + topK clamp", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    const admin = { rpc } as never;
    const openai = {
      embeddings: { create: vi.fn().mockResolvedValue({ data: [{ embedding: new Array(1536).fill(0) }] }) },
    } as never;
    await retrieveKnowledge(admin, openai, { lessonId: "lesson-01", userText: "I think computers", topK: 99 });
    expect(rpc).toHaveBeenCalledOnce();
    const args = rpc.mock.calls[0][1];
    expect(args.p_lesson_id).toBe("lesson-01");
    expect(args.p_match_count).toBeLessThanOrEqual(10);
  });
});

describe("env guard", () => {
  it("service client throws understandable error without key", async () => {
    const savedUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const savedKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { createServiceClient } = await import("@/lib/supabase/service");
    expect(() => createServiceClient()).toThrow("SUPABASE_SERVICE_ROLE_KEY");
    if (savedUrl !== undefined) process.env.NEXT_PUBLIC_SUPABASE_URL = savedUrl;
    if (savedKey !== undefined) process.env.SUPABASE_SERVICE_ROLE_KEY = savedKey;
  });
});
