import "server-only";
import OpenAI from "openai";

export function feedbackModel(): string {
  return process.env.OPENAI_FEEDBACK_MODEL?.trim() || "gpt-4o-mini";
}

export function createOpenAiClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}
