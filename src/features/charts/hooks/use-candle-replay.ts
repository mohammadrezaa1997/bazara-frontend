'use client';

import { useCallback, useEffect, useState } from 'react';

export type ReplaySpeed = 1 | 2 | 4;

function initialCount(total: number) {
  return Math.min(total - 1, Math.max(30, Math.floor(total * 0.65)));
}

export function useCandleReplay(total: number, identity: string) {
  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [visibleCount, setVisibleCount] = useState(total);
  const [speed, setSpeed] = useState<ReplaySpeed>(1);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setActive(false);
      setPlaying(false);
      setVisibleCount(total);
      setSpeed(1);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [identity, total]);

  useEffect(() => {
    if (!active || !playing || visibleCount >= total) return;
    const delay = speed === 4 ? 250 : speed === 2 ? 500 : 900;
    const timer = window.setTimeout(() => {
      setVisibleCount((current) => Math.min(total, current + 1));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [active, playing, speed, total, visibleCount]);

  useEffect(() => {
    if (active && visibleCount >= total) {
      const frame = window.requestAnimationFrame(() => setPlaying(false));
      return () => window.cancelAnimationFrame(frame);
    }
  }, [active, total, visibleCount]);

  const start = useCallback(() => {
    if (total < 4) return;
    setVisibleCount(initialCount(total));
    setPlaying(false);
    setActive(true);
  }, [total]);

  const exit = useCallback(() => {
    setActive(false);
    setPlaying(false);
    setVisibleCount(total);
  }, [total]);

  const stepForward = useCallback(() => {
    setPlaying(false);
    setVisibleCount((current) => Math.min(total, current + 1));
  }, [total]);

  const stepBack = useCallback(() => {
    setPlaying(false);
    setVisibleCount((current) => Math.max(2, current - 1));
  }, []);

  const seek = useCallback(
    (count: number) => {
      setPlaying(false);
      setVisibleCount(Math.min(total, Math.max(2, Math.round(count))));
    },
    [total],
  );

  return {
    active,
    playing,
    visibleCount: active ? visibleCount : total,
    speed,
    canStart: total >= 4,
    start,
    exit,
    setPlaying,
    setSpeed,
    stepForward,
    stepBack,
    seek,
  };
}
