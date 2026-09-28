'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

export type PriceAlertDirection = 'above' | 'below';

export interface PriceAlert {
  id: string;
  direction: PriceAlertDirection;
  targetPrice: number;
  active: boolean;
  triggeredAt: string | null;
  createdAt: string;
}

function readAlerts(storageKey: string): PriceAlert[] {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const value = item as Partial<PriceAlert>;
      const targetPrice = Number(value.targetPrice);
      if (
        typeof value.id !== 'string' ||
        (value.direction !== 'above' && value.direction !== 'below') ||
        !Number.isFinite(targetPrice) ||
        targetPrice <= 0
      ) {
        return [];
      }
      return [{
        id: value.id,
        direction: value.direction,
        targetPrice,
        active: value.active !== false,
        triggeredAt: typeof value.triggeredAt === 'string' ? value.triggeredAt : null,
        createdAt:
          typeof value.createdAt === 'string'
            ? value.createdAt
            : new Date().toISOString(),
      } satisfies PriceAlert];
    });
  } catch {
    return [];
  }
}

function writeAlerts(storageKey: string, alerts: PriceAlert[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(alerts));
}

export function usePriceAlerts({
  storageKey,
  currentPrice,
  instrumentName,
}: {
  storageKey: string;
  currentPrice?: number;
  instrumentName: string;
}) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const notifiedIdsRef = useRef(new Set<string>());

  useEffect(() => {
    notifiedIdsRef.current = new Set();
    const frame = window.requestAnimationFrame(() => {
      setAlerts(readAlerts(storageKey));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [storageKey]);

  useEffect(() => {
    if (!Number.isFinite(currentPrice)) return;
    const matched = alerts.filter(
      (alert) =>
        alert.active &&
        !alert.triggeredAt &&
        !notifiedIdsRef.current.has(alert.id) &&
        (alert.direction === 'above'
          ? (currentPrice as number) >= alert.targetPrice
          : (currentPrice as number) <= alert.targetPrice),
    );
    if (matched.length === 0) return;

    const triggeredAt = new Date().toISOString();
    matched.forEach((alert) => notifiedIdsRef.current.add(alert.id));
    const matchedIds = new Set(matched.map((alert) => alert.id));
    const next = alerts.map((alert) =>
      matchedIds.has(alert.id)
        ? { ...alert, active: false, triggeredAt }
        : alert,
    );
    writeAlerts(storageKey, next);
    const frame = window.requestAnimationFrame(() => setAlerts(next));

    const message = `${instrumentName} به قیمت ${Number(currentPrice).toLocaleString('en-US')} رسید.`;
    toast.success('هشدار قیمت فعال شد', { description: message });
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('BAZARA · هشدار قیمت', { body: message });
    }
    return () => window.cancelAnimationFrame(frame);
  }, [alerts, currentPrice, instrumentName, storageKey]);

  const commit = useCallback(
    (updater: (current: PriceAlert[]) => PriceAlert[]) => {
      setAlerts((current) => {
        const next = updater(current);
        writeAlerts(storageKey, next);
        return next;
      });
    },
    [storageKey],
  );

  const addAlert = useCallback(
    (direction: PriceAlertDirection, targetPrice: number) => {
      if (!Number.isFinite(targetPrice) || targetPrice <= 0) return false;
      const alert: PriceAlert = {
        id: `price-alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        direction,
        targetPrice,
        active: true,
        triggeredAt: null,
        createdAt: new Date().toISOString(),
      };
      commit((current) => [alert, ...current].slice(0, 30));
      return true;
    },
    [commit],
  );

  const removeAlert = useCallback(
    (id: string) => commit((current) => current.filter((alert) => alert.id !== id)),
    [commit],
  );

  const rearmAlert = useCallback(
    (id: string) => {
      notifiedIdsRef.current.delete(id);
      commit((current) =>
        current.map((alert) =>
          alert.id === id
            ? { ...alert, active: true, triggeredAt: null }
            : alert,
        ),
      );
    },
    [commit],
  );

  const activeCount = useMemo(
    () => alerts.filter((alert) => alert.active && !alert.triggeredAt).length,
    [alerts],
  );

  return { alerts, activeCount, addAlert, removeAlert, rearmAlert };
}
