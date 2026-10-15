import "server-only";
import type OpenAI from "openai";

export const TRANSCRIBE_MODEL = "gpt-4o-transcribe";

export async function transcribeRecording(client: OpenAI, file: File): Promise<string> {
  const res = await client.audio.transcriptions.create({
    file,
    model: TRANSCRIBE_MODEL,
    language: "en",
  });
  return (res.text ?? "").trim();
}
