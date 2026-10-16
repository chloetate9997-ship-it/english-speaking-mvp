"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, RotateCcw, Square, X } from "lucide-react";
import { PrimaryAction } from "@/components/ui/primary-action";

export type CoachRecorderState =
  | "idle"
  | "requesting"
  | "recording"
  | "recorded"
  | "error";

const mimeCandidates = [
  "audio/webm;codecs=opus",
  "audio/mp4",
  "audio/webm",
  "audio/ogg;codecs=opus",
];

const maxRecordingSeconds = 120;

export function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function toErrorMessage(error: unknown): string {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "录音仅支持 localhost 或 HTTPS，请切换到安全环境后重试。";
  }
  if (error instanceof DOMException) {
    switch (error.name) {
      case "NotAllowedError":
        return "麦克风权限被拒绝，请在浏览器或系统设置中开启。";
      case "NotFoundError":
        return "没有找到可用的麦克风。";
      case "NotReadableError":
        return "麦克风无法读取，可能正被其他应用占用。";
      default:
        return "无法开始录音，请检查浏览器和设备设置。";
    }
  }
  return "无法开始录音，请检查浏览器和设备设置。";
}

interface CoachRecorderProps {
  disabled?: boolean;
  onSubmit: (payload: { blob: Blob; mime: string; objectUrl: string }) => void;
  submitting: boolean;
}

export function CoachRecorder({ disabled, onSubmit, submitting }: CoachRecorderProps) {
  const [state, setState] = useState<CoachRecorderState>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [recordedSeconds, setRecordedSeconds] = useState(0);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const discardRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const urlRef = useRef<string | null>(null);
  const blobRef = useRef<Blob | null>(null);

  function stopTracks() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function clearTimer() {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function revokePreviewUrl() {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }

  useEffect(
    () => () => {
      discardRef.current = true;
      clearTimer();
      recorderRef.current = null;
      stopTracks();
      revokePreviewUrl();
    },
    [],
  );

  function finishRecording(recorder: MediaRecorder) {
    const chunks = chunksRef.current;
    chunksRef.current = [];
    stopTracks();
    const mimeType = recorder.mimeType || chunks[0]?.type || "";
    if (chunks.length === 0 || chunks.every((chunk) => chunk.size === 0)) {
      setErrorMessage("没有录到有效声音，请重试。");
      setState("error");
      return;
    }
    const blob = new Blob(chunks, mimeType ? { type: mimeType } : undefined);
    if (blob.size === 0) {
      setErrorMessage("没有录到有效声音，请重试。");
      setState("error");
      return;
    }
    blobRef.current = blob;
    const url = URL.createObjectURL(blob);
    revokePreviewUrl();
    urlRef.current = url;
    setRecordingUrl(url);
    setRecordedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    setState("recorded");
  }

  async function startRecording() {
    if (
      typeof window === "undefined" ||
      !window.isSecureContext ||
      !navigator.mediaDevices?.getUserMedia ||
      !window.MediaRecorder
    ) {
      setErrorMessage(
        typeof window !== "undefined" && !window.isSecureContext
          ? "录音仅支持 localhost 或 HTTPS，请切换到安全环境后重试。"
          : "当前浏览器不支持录音，请升级或更换浏览器。",
      );
      setState("error");
      return;
    }
    discardRef.current = false;
    chunksRef.current = [];
    setErrorMessage(null);
    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: false,
      });
      if (discardRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      const supported = mimeCandidates.find((mime) => MediaRecorder.isTypeSupported(mime));
      const recorder = supported
        ? new MediaRecorder(stream, { mimeType: supported })
        : new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        clearTimer();
        recorderRef.current = null;
        if (discardRef.current) {
          chunksRef.current = [];
          stopTracks();
          setElapsedSeconds(0);
          setState("idle");
          return;
        }
        finishRecording(recorder);
      };
      startTimeRef.current = Date.now();
      setElapsedSeconds(0);
      recorder.start();
      setState("recording");
      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedSeconds(elapsed);
        if (elapsed >= maxRecordingSeconds) stopRecording(false);
      }, 250);
    } catch (error) {
      stopTracks();
      setErrorMessage(toErrorMessage(error));
      setState("error");
    }
  }

  function stopRecording(preview: boolean) {
    const recorder = recorderRef.current;
    discardRef.current = !preview;
    if (!recorder || recorder.state === "inactive") {
      clearTimer();
      stopTracks();
      setElapsedSeconds(0);
      setState("idle");
      return;
    }
    recorder.stop();
  }

  function resetRecorder() {
    revokePreviewUrl();
    blobRef.current = null;
    setRecordingUrl(null);
    setRecordedSeconds(0);
    setElapsedSeconds(0);
    setErrorMessage(null);
    setState("idle");
  }

  if (state === "recorded" && recordingUrl) {
    const blob = blobRef.current;
    return (
      <section aria-label="本轮录音预览" className="rounded-lg bg-card p-5 shadow-card">
        <p className="text-sm font-semibold text-ink">本轮录音预览</p>
        <p className="mt-1 text-xs text-subtle">
          时长 {formatElapsed(recordedSeconds)} · 提交前仅保存在当前页面
        </p>
        <audio className="mt-3 w-full" controls src={recordingUrl} />
        <div className="mt-4 space-y-3">
          <PrimaryAction
            disabled={disabled || submitting || !blob}
            onClick={() =>
              blob &&
              onSubmit({ blob, mime: blob.type || "audio/webm", objectUrl: recordingUrl })
            }
          >
            {submitting ? "AI 分析中…" : "提交本轮录音"}
          </PrimaryAction>
          <button
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-button border border-line text-sm font-semibold text-ink disabled:opacity-40"
            disabled={submitting}
            onClick={resetRecorder}
            type="button"
          >
            <RotateCcw aria-hidden className="size-4" />
            重新录制
          </button>
          <p className="text-center text-xs text-subtle">
            提交后录音将发送给第三方 AI 服务进行转写与反馈；取消录音不会上传。
          </p>
        </div>
      </section>
    );
  }

  if (state === "recording" || state === "requesting") {
    const busy = state === "requesting";
    return (
      <section
        aria-label={busy ? "正在请求麦克风权限" : "录音中"}
        aria-live="polite"
        className="flex flex-col items-center rounded-lg bg-warm px-5 py-7 text-center shadow-card"
      >
        <p className="text-sm font-semibold tabular-nums text-ink">
          {busy ? "正在请求麦克风权限…" : `录音中 · ${formatElapsed(elapsedSeconds)}`}
        </p>
        <div className="mt-5 flex w-full gap-3">
          <button
            aria-label="取消录音"
            className="inline-flex h-[52px] w-14 shrink-0 items-center justify-center rounded-button border border-line bg-card text-ink"
            onClick={() => stopRecording(false)}
            type="button"
          >
            <X aria-hidden className="size-5" />
          </button>
          <button
            aria-label="停止并预览录音"
            className="inline-flex h-[52px] flex-1 items-center justify-center gap-2 rounded-button bg-ink text-[15px] font-semibold text-white disabled:opacity-40"
            disabled={busy}
            onClick={() => stopRecording(true)}
            type="button"
          >
            <Square aria-hidden className="size-4" />
            停止并预览
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="录音准备"
      className="flex flex-col items-center rounded-lg bg-card px-5 py-8 text-center shadow-card"
    >
      <span className="flex size-16 items-center justify-center rounded-full bg-play text-ink">
        <Mic aria-hidden className="size-7" />
      </span>
      <p className="mt-4 text-sm font-semibold text-ink">用英语回答 Agent 的提问</p>
      <p className="mt-1 text-xs text-subtle">尽量用上本轮目标表达，说 2~4 句话</p>
      <PrimaryAction className="mt-5 max-w-[240px]" disabled={disabled} onClick={() => void startRecording()}>
        开始录音
      </PrimaryAction>
      {state === "error" && errorMessage ? (
        <p role="alert" className="mt-4 w-full rounded-lg bg-warm p-3 text-xs leading-relaxed text-ink">
          {errorMessage}
        </p>
      ) : null}
    </section>
  );
}
