import type {
  Lesson,
  LessonNoteSummary,
  LessonSummary,
  Note,
  PhraseNote,
  ProfileStats,
  RetellResult,
} from "@/lib/types";

export const lesson01: Lesson = { id: "lesson-01", order: 1, title: "How to Express Your Opinion", subtitle: "表达观点与回应", durationSeconds: 435, audioUrl: "/audio/lesson-01.mp3", status: "completed", published: true, segments: [
  { id: "segment-01", lessonId: "lesson-01", order: 1, englishText: "Suppose you are with a group of friends discussing the greatest inventions of the twentieth century.", chineseText: "假设你正在和朋友讨论二十世纪最伟大的发明。", startSeconds: 0, endSeconds: 82, keywords: ["suppose", "discuss", "inventions"] },
  { id: "segment-02", lessonId: "lesson-01", order: 2, englishText: "One friend says that the computer was the best invention.", chineseText: "一位朋友认为电脑是最伟大的发明。", startSeconds: 82, endSeconds: 164, keywords: ["computer", "best invention"] },
  { id: "segment-03", lessonId: "lesson-01", order: 3, englishText: "Another friend disagrees and points out that airplanes also changed the world.", chineseText: "另一位朋友不同意，并指出飞机也改变了世界。", startSeconds: 164, endSeconds: 250, keywords: ["disagree", "airplanes", "changed"] },
  { id: "segment-04", lessonId: "lesson-01", order: 4, englishText: "You can respond politely by acknowledging the other opinion before explaining your reason.", chineseText: "你可以先认可对方的观点，再解释自己的理由。", startSeconds: 250, endSeconds: 340, keywords: ["respond politely", "acknowledge", "reason"] },
  { id: "segment-05", lessonId: "lesson-01", order: 5, englishText: "Useful phrases include I think, I believe, in my opinion, and I would say.", chineseText: "常用表达包括我认为、我相信、在我看来以及我会说。", startSeconds: 340, endSeconds: 435, keywords: ["I think", "I believe", "in my opinion"] },
] };
export const demoNote: Note = { id: "note-01", lessonId: "lesson-01", segmentId: "segment-04", content: "回应不同意见时，先表示理解，再给出自己的理由。", createdAt: "2026-10-15T09:00:00+08:00", updatedAt: "2026-10-15T09:00:00+08:00" };
export const demoRetellResult: RetellResult = { id: "demo-result", lessonId: "lesson-01", createdAt: "2026-10-15T09:10:00+08:00", scope: "full", selectedSegmentIds: lesson01.segments.map((segment) => segment.id), transcript: "In my opinion, computers were one of the most important inventions because modern airplanes also depend on them.", contentScore: 82, coveredPoints: ["表达了个人观点", "提到了电脑的重要性", "用飞机作为补充理由"], missedPoints: ["可以更礼貌地回应另一位朋友的观点"], languageSuggestions: ["使用 I see your point, but... 来衔接不同意见"], naturalVersion: "I see your point about airplanes, but in my opinion computers were the greater invention because modern aircraft could not operate without them.", nextExercise: "再次复述，并至少使用一次 I see your point, but...。" };

const summaries: Array<[string, string, number, LessonSummary["status"]]> = [
  ["Short Form Yes/No Questions", "简短问答与确认", 392, "in-progress"],
  ["Three Common Forms in Everyday Speech", "日常口语三种句式", 418, "not-started"],
  ["How to Make a Complaint in English", "礼貌投诉与反馈", 447, "not-started"],
  ["Giving and Receiving Compliments", "给予和接受赞美", 376, "not-started"],
  ["Most Useful Eating and Drinking Expressions", "饮食场景表达", 404, "not-started"],
  ["The Many Ways We Use “Of Course”", "Of Course 的多种用法", 365, "not-started"],
  ["Using Past Forms to Describe Present and Future", "过去式表现在与将来", 452, "not-started"],
  ["The Verbs Let, Allow and Permit", "Let Allow Permit 辨析", 388, "not-started"],
  ["Talking About Weekend Plans", "谈论周末计划", 371, "not-started"],
  ["Small Talk at Work", "职场闲聊", 383, "not-started"],
  ["Ordering Food Like a Native", "像母语者一样点餐", 396, "not-started"],
  ["Expressing Likes and Dislikes", "表达喜好", 374, "not-started"],
  ["Making Phone Calls in English", "英文电话沟通", 421, "not-started"],
  ["Talking About the Weather", "谈论天气", 348, "not-started"],
  ["Shopping and Bargaining", "购物与砍价", 389, "not-started"],
  ["Apologizing Sincerely", "真诚道歉", 367, "not-started"],
  ["Making Suggestions", "提出建议", 381, "not-started"],
  ["Telling Stories in Past Tense", "用过去时讲故事", 433, "not-started"],
  ["Asking for Directions Politely", "礼貌问路", 359, "not-started"],
];

export const lessonSummaries: LessonSummary[] = [
  {
    id: lesson01.id,
    order: lesson01.order,
    title: "How to Express Your Opinion in English",
    subtitle: lesson01.subtitle,
    durationSeconds: lesson01.durationSeconds,
    status: lesson01.status,
  },
  ...summaries.map(([title, subtitle, durationSeconds, status], index) => ({
    id: `lesson-${String(index + 2).padStart(2, "0")}`,
    order: index + 2,
    title,
    subtitle,
    durationSeconds,
    status,
  })),
];

export function getLessonSummary(lessonId: string): LessonSummary | undefined {
  return lessonSummaries.find((lesson) => lesson.id === lessonId);
}

export const lesson01Notes: PhraseNote[] = [
  { id: "lesson-01-note-01", order: 1, english: "suppose", chinese: "假设；认为" },
  { id: "lesson-01-note-02", order: 2, english: "In my opinion", chinese: "依我看来" },
  { id: "lesson-01-note-03", order: 3, english: "I couldn't agree more", chinese: "我完全同意" },
  { id: "lesson-01-note-04", order: 4, english: "I see what you're saying, but…", chinese: "我明白你的意思，但是……" },
];

export const lessonNoteSummaries: LessonNoteSummary[] = lessonSummaries.slice(0, 9).map((lesson) =>
  lesson.id === "lesson-01"
    ? {
        lessonId: lesson.id,
        order: lesson.order,
        title: lesson.title,
        noteCount: 4,
        lastRecordedAt: "10月15日 09:00",
      }
    : {
        lessonId: lesson.id,
        order: lesson.order,
        title: lesson.title,
        noteCount: 0,
        lastRecordedAt: null,
      },
);

export const profileStats: ProfileStats = {
  completedLessons: 1,
  totalLessons: 20,
  totalNotes: 4,
  totalRecordings: 3,
};

export function formatDurationMinutes(durationSeconds: number): string {
  const minutes = Math.max(1, Math.round(durationSeconds / 60));
  return `${minutes} 分钟`;
}

export function formatClock(durationSeconds: number): string {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
