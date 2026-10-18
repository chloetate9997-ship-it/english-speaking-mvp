"use client";

import { useRef, useState } from "react";
import type { ReactEventHandler } from "react";
import { ChevronDown, ChevronRight, Pause, Play } from "lucide-react";
import type { LessonSegment } from "@/lib/types";
import { formatClock } from "@/lib/mock-data/lessons";
import { SectionHeader } from "@/components/ui/section-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { saveProgress } from "@/lib/data/progress";

type PlayerDisplay = "expanded" | "collapsed";
type AudioLoadState = "idle" | "loading" | "ready" | "error";

interface ListenExperienceProps {
  audioUrl: string;
  lessonId: string;
  segments: LessonSegment[];
  durationSeconds: number;
}

export function ListenExperience({
  audioUrl,
  lessonId,
  segments,
  durationSeconds,
}: ListenExperienceProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSavedRef = useRef(0);
  const [display, setDisplay] = useState<PlayerDisplay>("expanded");
  const [loadState, setLoadState] = useState<AudioLoadState>("loading");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [mediaDuration, setMediaDuration] = useState(durationSeconds);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [showChinese, setShowChinese] = useState(false);

  const firstSegment = segments[0];
  const rangeMin = 0;
  const rangeMax = mediaDuration;
  const displayTime = `${formatClock(Math.floor(currentTime))} / ${formatClock(Math.floor(mediaDuration))}`;

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
    setCurrentTime(event.currentTarget.currentTime);
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
        className="rounded-lg bg-card p-4 shadow-card transition-all duration-200"
      >
        {display === "collapsed" ? (
          <div className="flex h-12 items-center gap-3">
            <button
              aria-label={isPlaying ? "暂停课程音频" : "播放课程音频"}
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-play text-ink disabled:opacity-40"
              disabled={audioUnavailable}
              onClick={togglePlay}
              type="button"
            >
              {isPlaying ? (
                <Pause aria-hidden className="size-4 fill-current" />
              ) : (
                <Play aria-hidden className="size-4 fill-current" />
              )}
            </button>
            <p className="min-w-0 flex-1 truncate text-xs tabular-nums text-subtle">
              {audioUnavailable
                ? "音频缺失 · 展开查看说明"
                : `${isPlaying ? "播放中" : "已暂停"} · ${displayTime}`}
            </p>
            <button
              aria-expanded={false}
              aria-label="展开播放器"
              className="inline-flex items-center gap-1 text-xs font-semibold text-ink"
              onClick={() => setDisplay("expanded")}
              type="button"
            >
              展开
              <ChevronDown aria-hidden className="size-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <button
                aria-label={isPlaying ? "暂停课程音频" : "播放课程音频"}
                className="flex size-[42px] shrink-0 items-center justify-center rounded-full bg-play text-ink disabled:opacity-40"
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
                <p className="text-xs tabular-nums text-subtle">
                  {audioUnavailable ? "音频缺失" : `${isPlaying ? "播放中" : "已暂停"} · ${displayTime}`}
                </p>
                <input
                  aria-label="课程音频进度"
                  className="mt-2 w-full accent-brand"
                  disabled={audioUnavailable}
                  max={rangeMax}
                  min={rangeMin}
                  onChange={(event) => handleSeek(Number(event.target.value))}
                  step={0.1}
                  type="range"
                  value={Math.min(Math.max(currentTime, rangeMin), rangeMax)}
                />
              </div>
              <button
                aria-expanded
                aria-label="收起播放器"
                className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-subtle"
                onClick={() => setDisplay("collapsed")}
                type="button"
              >
                收起
                <ChevronRight aria-hidden className="size-4 rotate-90" />
              </button>
            </div>
            {audioUnavailable && audioError ? (
              <p role="alert" className="mt-3 rounded-lg bg-warm p-3 text-xs leading-relaxed text-ink">
                {audioError}
              </p>
            ) : null}
          </>
        )}
      </section>

      <SurfaceCard>
        <div className="flex items-center justify-between gap-3">
          <SectionHeader title="精听原文" />
          <button
            aria-pressed={showChinese}
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-pill border border-line bg-card px-3 text-xs font-semibold text-accent-red transition-colors hover:bg-warm"
            onClick={() => setShowChinese((value) => !value)}
            type="button"
          >
            {showChinese ? "显示英文" : "中文解释"}
          </button>
        </div>
        <p className="mt-2 text-xs text-subtle">第 1 段 · 先听音频，再对照原文</p>
        {firstSegment ? (
          <div className="mt-4" aria-live="polite">
            <p className="text-[15px] leading-relaxed text-ink">
              {showChinese ? firstSegment.chineseText : firstSegment.englishText}
            </p>
          </div>
        ) : null}
      </SurfaceCard>
    </div>
  );
}
