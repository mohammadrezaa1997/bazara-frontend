'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { ChartDrawing } from '../components/chart-drawings';
import { readDrawings, writeDrawings } from '../components/chart-drawings';

interface DrawingHistory {
  past: ChartDrawing[][];
  present: ChartDrawing[];
  future: ChartDrawing[][];
}

const emptyHistory: DrawingHistory = { past: [], present: [], future: [] };

export function useChartDrawings(storageKey: string) {
  const [history, setHistory] = useState<DrawingHistory>(emptyHistory);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setHistory({ past: [], present: readDrawings(storageKey), future: [] });
      setSelectedId(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [storageKey]);

  const commit = useCallback(
    (updater: (current: ChartDrawing[]) => ChartDrawing[]) => {
      setHistory((current) => {
        const next = updater(current.present);
        writeDrawings(storageKey, next);
        return {
          past: [...current.past.slice(-49), current.present],
          present: next,
          future: [],
        };
      });
    },
    [storageKey],
  );

  const addDrawing = useCallback(
    (drawing: ChartDrawing) => commit((current) => [...current, drawing]),
    [commit],
  );

  const updateDrawing = useCallback(
    (drawing: ChartDrawing) => {
      commit((current) =>
        current.map((item) => (item.id === drawing.id ? drawing : item)),
      );
    },
    [commit],
  );

  const undo = useCallback(() => {
    setHistory((current) => {
      const previous = current.past.at(-1);
      if (!previous) return current;
      writeDrawings(storageKey, previous);
      return {
        past: current.past.slice(0, -1),
        present: previous,
        future: [current.present, ...current.future.slice(0, 49)],
      };
    });
    setSelectedId(null);
  }, [storageKey]);

  const redo = useCallback(() => {
    setHistory((current) => {
      const next = current.future[0];
      if (!next) return current;
      writeDrawings(storageKey, next);
      return {
        past: [...current.past.slice(-49), current.present],
        present: next,
        future: current.future.slice(1),
      };
    });
    setSelectedId(null);
  }, [storageKey]);

  const clearAll = useCallback(() => {
    commit(() => []);
    setSelectedId(null);
  }, [commit]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    commit((current) => current.filter((drawing) => drawing.id !== selectedId));
    setSelectedId(null);
  }, [commit, selectedId]);

  const toggleSelectedLock = useCallback(() => {
    if (!selectedId) return;
    commit((current) =>
      current.map((drawing) =>
        drawing.id === selectedId
          ? { ...drawing, locked: !drawing.locked }
          : drawing,
      ),
    );
  }, [commit, selectedId]);

  const toggleSelectedVisibility = useCallback(() => {
    if (!selectedId) return;
    commit((current) =>
      current.map((drawing) =>
        drawing.id === selectedId
          ? { ...drawing, visible: !drawing.visible }
          : drawing,
      ),
    );
  }, [commit, selectedId]);

  const toggleAllVisibility = useCallback(() => {
    commit((current) => {
      const shouldShow = current.some((drawing) => !drawing.visible);
      return current.map((drawing) => ({ ...drawing, visible: shouldShow }));
    });
  }, [commit]);

  const selectedDrawing = useMemo(
    () => history.present.find((drawing) => drawing.id === selectedId) ?? null,
    [history.present, selectedId],
  );

  return {
    drawings: history.present,
    selectedId,
    selectedDrawing,
    setSelectedId,
    addDrawing,
    updateDrawing,
    undo,
    redo,
    clearAll,
    deleteSelected,
    toggleSelectedLock,
    toggleSelectedVisibility,
    toggleAllVisibility,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}
