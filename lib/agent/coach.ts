import "server-only";
import type OpenAI from "openai";
import { feedbackModel } from "@/lib/openai/client";
import {
  coachTurnSchema,
  validateCoachTurn,
  type CoachTurn,
} from "./coach-schema";
import type { KnowledgeChunk } from "./rag";

const SYSTEM = [
  "你是英语情景口语教练。基于检索到的课程知识出题与反馈，不编造课程外目标表达。",
  "每轮只练一个目标表达。意思错误→hint或simplify；意思对但未用目标表达→hint并要求retry；",
  "语法/不自然→给correction并retry；正确使用→continue；3~5轮后complete。",
  "reply 用英文提问或反馈 + 一句简体中文提示。只输出 JSON。",
].join("\n");

export async function generateCoachTurn(
  client: OpenAI,
  input: {
    lessonId: string;
    scenario: string;
    targetExpression: string;
    history: Array<{ role: string; text: string }>;
    transcript: string;
    knowledge: KnowledgeChunk[];
    weak: Array<{ expression_id: string; mastery: number }>;
  },
): Promise<CoachTurn> {
  const res = await client.responses.create({
    model: feedbackModel(),
    input: [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: [
          `课程：${input.lessonId} 场景：${input.scenario} 本轮目标表达：${input.targetExpression}`,
          `检索知识：\n${input.knowledge.map((k) => `- [${k.content_type}] ${k.content}`).join("\n") || "(无)"}`,
          `薄弱表达：${input.weak.map((w) => `${w.expression_id}(${w.mastery})`).join(", ") || "(无)"}`,
          `历史：\n${input.history.map((h) => `${h.role}: ${h.text}`).join("\n") || "(首轮)"}`,
          `本轮学生 transcript：\n${input.transcript}`,
        ].join("\n\n"),
      },
    ],
    text: {
      format: { type: "json_schema", name: "coach_turn", strict: true, schema: coachTurnSchema },
    },
  });
  const parsed: unknown = JSON.parse(res.output_text.trim());
  const turn = validateCoachTurn(parsed);
  if (!turn) throw new Error("coach_validation_failed");
  return turn;
}
