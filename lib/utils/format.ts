export function formatElapsed(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** 判断段落是否与播放进度相交（秒级边界含端点）。 */
export function isSegmentActive(
  currentSeconds: number,
  startSeconds: number,
  endSeconds: number,
): boolean {
  return currentSeconds >= startSeconds && currentSeconds <= endSeconds;
}

/** 把 snake_case 的复述行映射为 camelCase 展示模型所需的最小字段。 */
export function mapRetellRow<T extends {
  covered_points: string[] | null;
  missed_points: string[] | null;
  language_suggestions: string[] | null;
}>(row: T): Pick<T, "covered_points" | "missed_points" | "language_suggestions"> & {
  coveredPoints: string[];
  missedPoints: string[];
  languageSuggestions: string[];
} {
  return {
    ...row,
    coveredPoints: row.covered_points ?? [],
    missedPoints: row.missed_points ?? [],
    languageSuggestions: row.language_suggestions ?? [],
  };
}
