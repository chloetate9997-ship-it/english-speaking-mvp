// AI 情景口语教练：MVP 三个练习场景。
// 目标表达 id/文案与 supabase/migrations/004_agent_rag.sql 的种子一致，不编造新课。

export interface ScenarioTargetExpression {
  id: string;
  expression: string;
  chinese: string;
}

export interface CoachScenario {
  id: string;
  title: string;
  description: string;
  opener: string;
  targetExpressions: ScenarioTargetExpression[];
}

export const COACH_SCENARIOS: CoachScenario[] = [
  {
    id: "weekend-plans",
    title: "讨论周末安排",
    description: "和朋友聊周末计划，表达你的想法并回应不同意见。",
    opener:
      "Suppose you and your friends are planning the weekend. What would you like to do? 用英语回答，并试着用上目标表达。",
    targetExpressions: [
      { id: "lesson-01-exp-01", expression: "In my opinion", chinese: "依我看来" },
      { id: "lesson-01-exp-06", expression: "Suppose", chinese: "假设" },
      { id: "lesson-01-exp-03", expression: "I would say", chinese: "我会说" },
    ],
  },
  {
    id: "meeting-opinion",
    title: "会议中表达观点",
    description: "在会议上说出你的判断，并补充理由支撑观点。",
    opener:
      "In a meeting, your team is discussing the most useful invention for daily work. What do you believe? 用英语表达你的观点并给出理由。",
    targetExpressions: [
      { id: "lesson-01-exp-02", expression: "I believe", chinese: "我相信" },
      { id: "lesson-01-exp-01", expression: "In my opinion", chinese: "依我看来" },
      { id: "lesson-01-exp-07", expression: "point out", chinese: "指出" },
    ],
  },
  {
    id: "confirm-itinerary",
    title: "询问并确认行程",
    description: "和同伴确认出行安排，礼貌回应不同意见并达成一致。",
    opener:
      "You and a friend disagree about the travel plan. Acknowledge their idea first, then explain yours. 用英语回应并确认行程。",
    targetExpressions: [
      { id: "lesson-01-exp-04", expression: "I see what you are saying, but...", chinese: "我明白你的意思，但是……" },
      { id: "lesson-01-exp-05", expression: "I couldn't agree more", chinese: "我完全同意" },
      { id: "lesson-01-exp-03", expression: "I would say", chinese: "我会说" },
    ],
  },
];

export function getCoachScenario(scenarioId: string): CoachScenario | undefined {
  return COACH_SCENARIOS.find((s) => s.id === scenarioId);
}
