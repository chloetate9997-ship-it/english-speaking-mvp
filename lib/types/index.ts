export type LessonStatus = "not-started" | "in-progress" | "completed";
export interface LessonSegment { id: string; lessonId: string; order: number; englishText: string; chineseText: string; startSeconds: number; endSeconds: number; keywords: string[]; }
export interface Lesson { id: string; order: number; title: string; subtitle: string; durationSeconds: number; audioUrl: string; status: LessonStatus; segments: LessonSegment[]; published: boolean; }
export interface Note { id: string; lessonId: string; segmentId?: string; content: string; createdAt: string; updatedAt: string; }
export interface RetellResult { id: string; lessonId: string; createdAt: string; scope: "full" | "segment" | "custom"; selectedSegmentIds: string[]; audioUrl?: string; transcript: string; contentScore: number; coveredPoints: string[]; missedPoints: string[]; languageSuggestions: string[]; naturalVersion: string; nextExercise: string; }
export interface LessonSummary { id: string; order: number; title: string; subtitle: string; durationSeconds: number; status: LessonStatus; }
export interface PhraseNote { id: string; order: number; english: string; chinese: string; }
export interface LessonNoteSummary { lessonId: string; order: number; title: string; noteCount: number; lastRecordedAt: string | null; }
export interface ProfileStats { completedLessons: number; totalLessons: number; totalNotes: number; totalRecordings: number; }
