import { describe, expect, it } from "vitest";
import {
  isAuthorizedSyncRequest,
  parseSyncBearerToken,
} from "./rag-sync-auth";
import { backfillSeededEmbeddings } from "./rag-backfill";

describe("rag sync auth", () => {
  it("rejects missing/empty secrets", () => {
    expect(isAuthorizedSyncRequest(null, "s")).toBe(false);
    expect(isAuthorizedSyncRequest("s", null)).toBe(false);
    expect(isAuthorizedSyncRequest("", "")).toBe(false);
    expect(isAuthorizedSyncRequest(undefined, undefined)).toBe(false);
  });

  it("accepts exact match only", () => {
    expect(isAuthorizedSyncRequest("abc123", "abc123")).toBe(true);
    expect(isAuthorizedSyncRequest("abc123", "abc124")).toBe(false);
    expect(isAuthorizedSyncRequest("abc12", "abc123")).toBe(false);
    expect(isAuthorizedSyncRequest("abc123 ", "abc123")).toBe(true);
  });

  it("parses Bearer token", () => {
    expect(parseSyncBearerToken("Bearer abc123")).toBe("abc123");
    expect(parseSyncBearerToken("bearer abc123")).toBe("abc123");
    expect(parseSyncBearerToken("Token abc123")).toBeNull();
    expect(parseSyncBearerToken(null)).toBeNull();
    expect(parseSyncBearerToken("Bearer ")).toBeNull();
  });
});

describe("backfill is idempotent, no fake embeddings", () => {
  it("only updates rows with null embedding", async () => {
    const updates: string[] = [];
    const admin = {
      from: (table: string) => {
        if (table !== "knowledge_chunks") throw new Error("wrong table");
        return {
          select: () => ({
            eq: () => ({
              is: () =>
                Promise.resolve({
                  data: [{ id: "lesson-01-kc-01", content: "real content" }],
                  error: null,
                }),
            }),
          }),
          update: (row: { embedding: number[] }) => ({
            eq: (col: string, id: string) => {
              expect(row.embedding).toHaveLength(1536);
              updates.push(id);
              expect(col).toBe("id");
              return Promise.resolve({ error: null });
            },
          }),
        };
      },
    } as never;
    const openai = {
      embeddings: {
        create: async () => ({ data: [{ embedding: new Array(1536).fill(0.01) }] }),
      },
    } as never;
    const updated = await backfillSeededEmbeddings(admin, openai, "lesson-01");
    expect(updated).toBe(1);
    expect(updates).toEqual(["lesson-01-kc-01"]);
  });

  it("rejects non-lesson-01", async () => {
    await expect(
      backfillSeededEmbeddings({} as never, {} as never, "lesson-02"),
    ).rejects.toThrow("only_lesson_01_supported");
  });
});
