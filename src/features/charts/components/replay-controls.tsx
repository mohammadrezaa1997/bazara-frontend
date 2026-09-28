'use client';

import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  X,
} from 'lucide-react';

import type { ReplaySpeed } from '../hooks/use-candle-replay';

interface ReplayControlsProps {
  total: number;
  visibleCount: number;
  playing: boolean;
  speed: ReplaySpeed;
  onPlayingChange: (playing: boolean) => void;
  onSpeedChange: (speed: ReplaySpeed) => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onSeek: (count: number) => void;
  onExit: () => void;
}

export function ReplayControls({
  total,
  visibleCount,
  playing,
  speed,
  onPlayingChange,
  onSpeedChange,
  onStepBack,
  onStepForward,
  onSeek,
  onExit,
}: ReplayControlsProps) {
  return (
    <div
      dir="rtl"
      className="flex flex-wrap items-center gap-2 border-b border-amber-500/15 bg-amber-500/[0.055] px-3 py-2.5"
    >
      <span className="text-xs font-black text-amber-700 dark:text-amber-300">
        بازپخش کندل
      </span>
      <button
        type="button"
        onClick={onStepBack}
        disabled={visibleCount <= 2}
        className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--nv-border)] disabled:opacity-30"
        aria-label="یک کندل عقب"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onPlayingChange(!playing)}
        className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500 text-slate-950"
        aria-label={playing ? 'توقف بازپخش' : 'شروع بازپخش'}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
      <button
        type="button"
        onClick={onStepForward}
        disabled={visibleCount >= total}
        className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--nv-border)] disabled:opacity-30"
        aria-label="یک کندل جلو"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <input
        type="range"
        min={2}
        max={Math.max(2, total)}
        value={Math.min(total, visibleCount)}
        onChange={(event) => onSeek(Number(event.target.value))}
        className="h-1.5 min-w-36 flex-1 accent-amber-500"
        aria-label="موقعیت بازپخش"
      />
      <span dir="ltr" className="text-[11px] font-bold text-[var(--nv-muted)]">
        {visibleCount} / {total}
      </span>
      <div className="flex rounded-lg border border-[var(--nv-border)] p-0.5">
        {([1, 2, 4] as ReplaySpeed[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onSpeedChange(item)}
            className={`rounded-md px-2 py-1 text-[10px] font-black ${
              speed === item
                ? 'bg-amber-500 text-slate-950'
                : 'text-[var(--nv-muted)]'
            }`}
          >
            {item}x
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onExit}
        className="mr-auto grid h-8 w-8 place-items-center rounded-lg text-[var(--nv-muted)] hover:bg-[var(--nv-soft)]"
        aria-label="خروج از بازپخش"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
