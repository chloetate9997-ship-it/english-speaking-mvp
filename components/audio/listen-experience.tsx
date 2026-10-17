"use client";

import { useRef, useState } from "react";
import type { ReactEventHandler } from "react";
import { ChevronDown, ChevronRight, Pause, Play } from "lucide-react";
import type { LessonSegment } from "@/lib/types";
import { formatClock } from "@/lib/mock-data/lessons";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SectionHeader } from "@/components/ui/section-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { CustomSegmentSelector } from "@/components/audio/custom-segment-selector";
import { saveProgress } from "@/lib/data/progress";
import { cn } from "@/lib/utils";

type ListenMode = "full" | "segment";
type PlayerDisplay = "expanded" | "collapsed";
type AudioLoadState = "idle" | "loading" | "ready" | "error";

const modeOptions = [
  { value: "full", label: "整篇" },
  { value: "segment", label: "分段" },
] as const;

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
  const [mode, setMode] = useState<ListenMode>("full");
  const [currentOrder, setCurrentOrder] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    segments.map((segment) => segment.id),
  );
  const [selectingCustom, setSelectingCustom] = useState(false);
  const [display, setDisplay] = useState<PlayerDisplay>("expanded");
  const [loadState, setLoadState] = useState<AudioLoadState>("loading");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [mediaDuration, setMediaDuration] = useState(durationSeconds);
  const [audioError, setAudioError] = useState<string | null>(null);

  const visibleSegments = segments.filter((segment) => selectedIds.includes(segment.id));
  const current =
    visibleSegments.find((segment) => segment.order === currentOrder) ??
    visibleSegments[0];
  const currentIndex = visibleSegments.findIndex(
    (segment) => segment.id === current?.id,
  );
  const isFirst = currentIndex <= 0;
  const isLast = currentIndex === visibleSegments.length - 1;

  const rangeMin = mode === "segment" && current ? current.startSeconds : 0;
  const rangeMax =
    mode === "segment" && current ? current.endSeconds : mediaDuration;
  const displayTime =
    mode === "segment" && current
      ? `${formatClock(Math.floor(currentTime))} / ${formatClock(current.endSeconds)}`
      : `${formatClock(Math.floor(currentTime))} / ${formatClock(Math.floor(mediaDuration))}`;

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

  function jumpToSegment(order: number) {
    const target = visibleSegments.find((segment) => segment.order === order);
    const audio = audioRef.current;
    if (!target) return;
    setCurrentOrder(order);
    if (audio && loadState === "ready") {
      audio.pause();
      audio.currentTime = target.startSeconds;
      setCurrentTime(target.startSeconds);
    }
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
    setMode(next);
    if (next === "segment" && current) {
      jumpToSegment(current.order);
    }
  }

  function confirmCustom(ids: string[]) {
    setSelectedIds(ids);
    const first = segments.find((segment) => segment.id === ids[0]);
    if (first) {
      setCurrentOrder(first.order);
      const audio = audioRef.current;
      if (audio && loadState === "ready") {
        audio.pause();
        audio.currentTime = first.startSeconds;
        setCurrentTime(first.startSeconds);
      }
    }
    setSelectingCustom(false);
  }

  if (selectingCustom) {
    return (
      <>
        <audio ref={audioRef} src={audioUrl} preload="metadata" aria-hidden tabIndex={-1} />
        <CustomSegmentSelector
          confirmLabel="完成"
          description="点击选择，Shift+点击可快速选择连续范围"
          initialSelectedIds={selectedIds}
          onCancel={() => setSelectingCustom(false)}
          onConfirm={confirmCustom}
          segments={segments}
          title="自定义段落"
          tone="listen"
        />
      </>
    );
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
            <SegmentedControl
              ariaLabel="播放范围"
              className="mt-3"
              onChange={handleModeChange}
              options={[...modeOptions]}
              value={mode}
            />
          </>
        )}
      </section>

      {mode === "full" ? (
        <SurfaceCard>
          <SectionHeader title="英文全文" />
          <p className="mt-2 text-xs text-subtle">中文解释标签 · 共 5 段 · 约 7 分钟</p>
          <div className="mt-4 space-y-5">
            {segments.map((segment) => (
              <div key={segment.id}>
                <p className="text-[15px] leading-relaxed text-ink">
                  {segment.englishText}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-subtle">
                  {segment.chineseText}
                </p>
              </div>
            ))}
          </div>
        </SurfaceCard>
      ) : (
        <SurfaceCard>
          <div className="flex items-center justify-between">
            <SectionHeader title="分段精听" />
            <button
              className="inline-flex items-center gap-0.5 text-xs font-semibold text-accent-red"
              onClick={() => setSelectingCustom(true)}
              type="button"
            >
              自定义段落
              <ChevronRight aria-hidden className="size-3.5" />
            </button>
          </div>
          <div className="mt-3 flex gap-2" role="group" aria-label="段落选择">
            {visibleSegments.map((segment) => (
              <button
                aria-pressed={segment.order === current?.order}
                className={cn(
                  "flex h-9 min-w-9 flex-1 items-center justify-center rounded-pill text-sm font-medium transition-colors duration-200",
                  segment.order === current?.order
                    ? "bg-brand text-white"
                    : "bg-segment text-subtle",
                )}
                key={segment.id}
                onClick={() => jumpToSegment(segment.order)}
                type="button"
              >
                {segment.order}
              </button>
            ))}
          </div>
          {current ? (
            <div className="mt-4" aria-live="polite">
              <p className="text-[15px] leading-relaxed text-ink">{current.englishText}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-subtle">
                {current.chineseText}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {current.keywords.map((keyword) => (
                  <span
                    className="rounded-pill bg-muted px-2.5 py-1 text-xs text-subtle"
                    key={keyword}
                  >
                    {keyword}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-button border border-line text-sm font-semibold text-ink disabled:opacity-40"
                  disabled={isFirst}
                  onClick={() =>
                    jumpToSegment(visibleSegments[currentIndex - 1].order)
                  }
                  type="button"
                >
                  上一段
                </button>
                <button
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-button bg-ink text-sm font-semibold text-white disabled:opacity-40"
                  disabled={isLast}
                  onClick={() =>
                    !isLast &&
                    jumpToSegment(visibleSegments[currentIndex + 1].order)
                  }
                  type="button"
                >
                  {isLast ? "已完成全部段落" : "听懂了，下一段 →"}
                </button>
              </div>
            </div>
          ) : null}
        </SurfaceCard>
      )}
    </div>
  );
}
