import "server-only";
import type OpenAI from "openai";
import { feedbackModel } from "./client";
import { retellFeedbackSchema, validateFeedback, type RetellFeedback } from "./feedback-schema";

const SYSTEM_PROMPT = [
  "你是支持性的英语口语教练，而不是考试裁判。",
  "只依据参考课程内容和学生的 transcript 给反馈，不杜撰用户没说的话。",
  "contentScore 只衡量内容覆盖（0-100 整数），绝不伪装成发音准确率。",
  "coveredPoints 和 missedPoints 简短、具体。",
  "languageSuggestions 优先指出语法、用词和表达自然度，每条可直接采取行动。",
  "naturalVersion 保留用户原意，用自然但不过分高级的英语重写。",
  "nextExercise 是 5 分钟内能执行的一项具体练习。",
  "transcript 太短、无意义或只有噪声时，给低内容分并诚实说明，不能编造完整复述。",
  "coveredPoints/missedPoints/languageSuggestions/nextExercise 用简体中文，naturalVersion 用英文。",
  "只输出 JSON，不要展示隐藏推理过程。",
].join("\n");

export async function generateRetellFeedback(
  client: OpenAI,
  input: { lessonTitle: string; scope: string; referenceEnglish: string; transcript: string },
): Promise<RetellFeedback> {
  const res = await client.responses.create({
    model: feedbackModel(),
    input: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          `课程：${input.lessonTitle}`,
          `范围：${input.scope}`,
          `参考段落英文：\n${input.referenceEnglish}`,
          `评分准则：内容覆盖优先；发音不打分；噪声/过短 transcript 诚实低分。`,
          `学生复述 transcript：\n${input.transcript}`,
        ].join("\n\n"),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "retell_feedback",
        strict: true,
        schema: retellFeedbackSchema,
      },
    },
  });
  const parsed: unknown = JSON.parse(res.output_text.trim());
  const feedback = validateFeedback(parsed);
  if (!feedback) throw new Error("feedback_validation_failed");
  return feedback;
}
