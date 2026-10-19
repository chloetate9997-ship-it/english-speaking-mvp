"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactEventHandler } from "react";
import Link from "next/link";
import { Pause, Play, Plus, Volume2 } from "lucide-react";
import type { LessonSegment, PhraseNote } from "@/lib/types";
import { formatClock } from "@/lib/mock-data/lessons";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { saveProgress } from "@/lib/data/progress";

type ListenMode = "full" | "segment";
type AudioLoadState = "idle" | "loading" | "ready" | "error";

const modeOptions = [
  { value: "full", label: "全篇" },
  { value: "segment", label: "分段听" },
] as const;

const phonetics: Record<string, string> = {
  suppose: "/səˈpoʊz/",
  "in my opinion": "/ɪn maɪ əˈpɪnjən/",
  "i couldn't agree more": "/aɪ ˈkʊdənt əˈɡriː mɔːr/",
  "i see what you're saying, but…": "/aɪ siː wʌt jʊr ˈseɪɪŋ bʌt/",
};

interface ListenExperienceProps {
  audioUrl: string;
  lessonId: string;
  phraseNotes?: PhraseNote[];
  segments: LessonSegment[];
  transcript?: string[];
  transcriptChinese?: string[];
  durationSeconds: number;
}

export function ListenExperience({
  audioUrl,
  lessonId,
  phraseNotes = [],
  segments,
  transcript = [],
  transcriptChinese = [],
  durationSeconds,
}: ListenExperienceProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const explanationCardRef = useRef<HTMLDivElement | null>(null);
  const lastSavedRef = useRef(0);
  const [mode, setMode] = useState<ListenMode>("full");
  const [loadState, setLoadState] = useState<AudioLoadState>("loading");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [mediaDuration, setMediaDuration] = useState(durationSeconds);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [showChinese, setShowChinese] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [selectedExplanation, setSelectedExplanation] = useState("");
  const [selectionPosition, setSelectionPosition] = useState({ left: 0, top: 0 });
  const [noteSaved, setNoteSaved] = useState(false);

  const current = segments[0];
  const rangeMin = mode === "segment" && current ? current.startSeconds : 0;
  const rangeMax = mode === "segment" && current ? current.endSeconds : mediaDuration;

  useEffect(() => {
    function dismissExplanation(event: PointerEvent) {
      if (explanationCardRef.current?.contains(event.target as Node)) return;
      setSelectedText("");
      setSelectedExplanation("");
      setNoteSaved(false);
      window.getSelection()?.removeAllRanges();
    }

    document.addEventListener("pointerdown", dismissExplanation);
    return () => document.removeEventListener("pointerdown", dismissExplanation);
  }, []);

  const handleLoadedMetadata: ReactEventHandler<HTMLAudioElement> = (event) => {
    const audio = event.currentTarget;
    setMediaDuration(
      Number.isFinite(audio.duration) && audio.duration > 0
        ? audio.duration
        : durationSeconds,
    );
    setLoadState("ready");
    setAudioError(null);
  };

  const handleTimeUpdate: ReactEventHandler<HTMLAudioElement> = (event) => {
    const audio = event.currentTarget;
    if (mode === "segment" && current && audio.currentTime >= current.endSeconds) {
      audio.pause();
      audio.currentTime = Math.max(current.endSeconds - 0.1, current.startSeconds);
      setCurrentTime(audio.currentTime);
      return;
    }
    setCurrentTime(audio.currentTime);
  };

  const handleAudioError: ReactEventHandler<HTMLAudioElement> = () => {
    setLoadState("error");
    setIsPlaying(false);
    setAudioError("课程演示音频尚未添加或无法读取，请稍后重试。");
  };

  function persistProgress(seconds: number) {
    const now = Date.now();
    if (now - lastSavedRef.current < 10000) return;
    lastSavedRef.current = now;
    void saveProgress({ lessonId, progressSeconds: seconds }).catch(() => {});
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio || loadState === "error") return;
    if (isPlaying) {
      audio.pause();
      return;
    }
    if (mode === "segment" && current) {
      if (audio.currentTime < current.startSeconds || audio.currentTime >= current.endSeconds - 0.15) {
        audio.currentTime = current.startSeconds;
        setCurrentTime(current.startSeconds);
      }
    }
    void audio.play().catch(() => {
      setLoadState("error");
      setAudioError("课程演示音频尚未添加或无法读取，请稍后重试。");
    });
  }

  function handleSeek(value: number) {
    const audio = audioRef.current;
    if (!audio || loadState !== "ready") return;
    const clamped = Math.min(Math.max(value, rangeMin), rangeMax);
    audio.currentTime = clamped;
    setCurrentTime(clamped);
  }

  function handleModeChange(next: ListenMode) {
    const audio = audioRef.current;
    setMode(next);
    setShowChinese(false);
    setSelectedText("");
    setSelectedExplanation("");
    setNoteSaved(false);
    if (next === "segment" && current && audio && loadState === "ready") {
      audio.pause();
      audio.currentTime = current.startSeconds;
      setCurrentTime(current.startSeconds);
    }
  }

  function captureTextSelection() {
    const selection = window.getSelection();
    const transcript = transcriptRef.current;
    const selected = selection?.toString().trim() ?? "";
    if (!selection || !transcript || !selected || !selection.anchorNode) return;
    if (!transcript.contains(selection.anchorNode)) return;
    const range = selection.getRangeAt(0);
    const selectionRect = range.getBoundingClientRect();
    const transcriptRect = transcript.getBoundingClientRect();
    const cardWidth = Math.min(256, transcript.clientWidth);
    const preferredLeft = selectionRect.left - transcriptRect.left;
    const left = Math.max(0, Math.min(preferredLeft, transcript.clientWidth - cardWidth));
    setSelectedText(selected);
    const normalized = selected.toLocaleLowerCase();
    const phrase = phraseNotes.find(
      (note) => note.english.toLocaleLowerCase() === normalized,
    );
    const segment = segments.find((item) =>
      item.englishText.toLocaleLowerCase().includes(normalized),
    );
    setSelectedExplanation(
      phrase?.chinese ?? segment?.chineseText ?? "这段内容暂时没有现成的中文解释。",
    );
    setSelectionPosition({
      left,
      top: selectionRect.bottom - transcriptRect.top + 8,
    });
    setNoteSaved(false);
  }

  function playSelectedText() {
    if (!("speechSynthesis" in window) || !selectedText) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(selectedText);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  }

  function addSelectionToNotes() {
    const key = `demo-notes:${lessonId}`;
    const content = `${selectedText} · ${selectedExplanation}`;
    try {
      const stored = window.localStorage.getItem(key);
      const existing = stored
        ? (JSON.parse(stored) as Array<{ id: string; content: string }>)
        : phraseNotes.map((note) => ({ id: note.id, content: `${note.english} · ${note.chinese}` }));
      if (!existing.some((note) => note.content === content)) {
        window.localStorage.setItem(
          key,
          JSON.stringify([{ id: `selection-${Date.now()}`, content }, ...existing]),
        );
      }
      setNoteSaved(true);
    } catch {
      setNoteSaved(false);
    }
  }

  const audioUnavailable = loadState === "error";

  return (
    <div className="space-y-5">
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        aria-hidden
        tabIndex={-1}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={(event) => {
          setIsPlaying(false);
          persistProgress(Math.floor(event.currentTarget.currentTime));
        }}
        onEnded={(event) => {
          setIsPlaying(false);
          persistProgress(Math.floor(event.currentTarget.currentTime));
        }}
        onError={handleAudioError}
      />
      <section
        aria-label="音频播放"
        className="rounded-[18px] bg-card px-4 py-4 shadow-card"
      >
        <div className="flex items-center gap-4">
          <button
            aria-label={isPlaying ? "暂停课程音频" : "播放课程音频"}
            className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-white bg-play text-white shadow-card disabled:opacity-40"
            disabled={audioUnavailable}
            onClick={togglePlay}
            type="button"
          >
            {isPlaying ? (
              <Pause aria-hidden className="size-5 fill-current" />
            ) : (
              <Play aria-hidden className="size-5 fill-current" />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between text-xs font-semibold tabular-nums text-subtle">
              <span>{audioUnavailable ? "音频缺失" : formatClock(Math.floor(currentTime))}</span>
              <span>{formatClock(Math.floor(rangeMax))}</span>
            </div>
            <input
              aria-label="课程音频进度"
              className="mt-1.5 block w-full accent-brand"
              disabled={audioUnavailable}
              max={rangeMax}
              min={rangeMin}
              onChange={(event) => handleSeek(Number(event.target.value))}
              step={0.1}
              type="range"
              value={Math.min(Math.max(currentTime, rangeMin), rangeMax)}
            />
          </div>
        </div>
        {audioUnavailable && audioError ? (
          <p role="alert" className="mt-3 rounded-lg bg-warm p-3 text-xs leading-relaxed text-ink">
            {audioError}
          </p>
        ) : null}
        <SegmentedControl
          ariaLabel="播放范围"
          className="mt-4 w-[160px] p-0.5 [&_button]:min-h-7 [&_button]:px-2 [&_button]:text-xs"
          onChange={handleModeChange}
          options={[...modeOptions]}
          value={mode}
        />
      </section>

      {mode === "full" || mode === "segment" ? (
        <section className="bg-card text-ink">
          <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
            <div className="flex min-w-0 items-center gap-3">
              <h2 className="text-lg font-bold text-ink">
                {mode === "full" ? "英文全文" : "段落全文"}
              </h2>
              <button
                aria-pressed={showChinese}
                className="shrink-0 rounded-pill border border-line px-2.5 py-1 text-[11px] font-medium text-subtle transition-colors hover:text-ink"
                onClick={() => setShowChinese((value) => !value)}
                type="button"
              >
                {showChinese ? "隐藏解释" : "中文解释"}
              </button>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {mode === "segment" ? (
                <button className="text-[11px] text-subtle" type="button">
                  自定义段落 ›
                </button>
              ) : null}
              <Link
                className="text-[11px] font-medium text-ink"
                href={`/lessons/${lessonId}/notes`}
              >
                我的笔记 ›
              </Link>
            </div>
          </div>
          <div
            className="relative mt-4 space-y-4"
            onMouseUp={captureTextSelection}
            onTouchEnd={() => window.setTimeout(captureTextSelection, 0)}
            ref={transcriptRef}
          >
            {(transcript.length > 0 ? transcript : segments.map((segment) => segment.englishText)).map((paragraph, index) => (
              <div key={`${index}-${paragraph.slice(0, 12)}`}>
                <p className="whitespace-pre-line text-[13px] leading-[1.5] text-ink">{paragraph}</p>
                {showChinese ? (
                  <p className="mt-1 text-[13px] leading-[1.5] text-subtle">
                    {transcriptChinese[index] ?? segments[index]?.chineseText}
                  </p>
                ) : null}
              </div>
            ))}
            {selectedText ? (
              <div
                aria-live="polite"
                className="absolute z-20 rounded-[20px] border-2 border-[#a9c4ff] bg-white px-4 py-3 shadow-[0_10px_24px_rgba(29,45,80,0.16)]"
                ref={explanationCardRef}
                style={{
                  left: selectionPosition.left,
                  top: selectionPosition.top,
                  width: "min(256px, 100%)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-[21px] font-bold leading-tight text-ink">
                      {selectedText}
                    </p>
                    {phonetics[selectedText.toLocaleLowerCase()] ? (
                      <p className="mt-1 text-[15px] text-ink">
                        {phonetics[selectedText.toLocaleLowerCase()]}
                      </p>
                    ) : null}
                  </div>
                  <button
                    aria-label="朗读选中内容"
                    className="flex size-11 shrink-0 items-center justify-center rounded-full border-[3px] border-white bg-play text-white shadow-card"
                    onClick={playSelectedText}
                    type="button"
                  >
                    <Volume2 aria-hidden className="size-5" />
                  </button>
                </div>
                <p className="mt-3 text-lg font-bold leading-relaxed text-ink">
                  {selectedExplanation}
                </p>
                <div className="mt-2.5 border-t border-line pt-2.5">
                  <button
                    className="inline-flex h-8 items-center justify-center gap-1 rounded-pill border border-line px-3 text-xs font-semibold text-accent-red"
                    disabled={noteSaved}
                    onClick={addSelectionToNotes}
                    type="button"
                  >
                    <Plus aria-hidden className="size-4" />
                    {noteSaved ? "已加入笔记" : "加入笔记"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
