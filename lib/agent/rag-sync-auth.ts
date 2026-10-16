import "server-only";

export function readRagSyncSecret(): string | null {
  const secret = process.env.RAG_SYNC_SECRET?.trim();
  return secret ? secret : null;
}

/** 常量时间比较，避免时序侧信道；任一为空直接拒绝。 */
export function isAuthorizedSyncRequest(
  provided: string | null | undefined,
  expected: string | null | undefined,
): boolean {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided.trim(), "utf8");
  const b = Buffer.from(expected.trim(), "utf8");
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/**
 * 从 Authorization 头解析 Bearer token（唯一鉴权方式）。
 * 返回 null 表示缺失或格式错误 → 调用方回 401。
 */
export function parseSyncBearerToken(header: string | null): string | null {
  if (!header) return null;
  const match = header.trim().match(/^Bearer\s+(\S+)$/i);
  return match?.[1] ? match[1].trim() : null;
}
