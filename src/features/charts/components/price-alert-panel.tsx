'use client';

import { useState } from 'react';
import { BellRing, RefreshCw, Trash2, X } from 'lucide-react';

import type {
  PriceAlert,
  PriceAlertDirection,
} from '../hooks/use-price-alerts';

interface PriceAlertPanelProps {
  instrumentName: string;
  currentPrice?: number;
  alerts: PriceAlert[];
  onAdd: (direction: PriceAlertDirection, targetPrice: number) => boolean;
  onRemove: (id: string) => void;
  onRearm: (id: string) => void;
  onClose: () => void;
  formatPrice: (value?: number) => string;
}

function formatDate(value: string | null) {
  if (!value) return 'فعال';
  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function PriceAlertPanel({
  instrumentName,
  currentPrice,
  alerts,
  onAdd,
  onRemove,
  onRearm,
  onClose,
  formatPrice,
}: PriceAlertPanelProps) {
  const [direction, setDirection] = useState<PriceAlertDirection>('above');
  const [target, setTarget] = useState(
    Number.isFinite(currentPrice) ? String(currentPrice) : '',
  );
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const value = Number(target.replaceAll(',', '').trim());
    if (!Number.isFinite(value) || value <= 0) {
      setError('یک قیمت مثبت و معتبر وارد کنید.');
      return;
    }
    if (!onAdd(direction, value)) return;
    setError('');
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/65 p-3 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="مدیریت هشدارهای قیمت"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        dir="rtl"
        className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-[var(--nv-border)] bg-[var(--nv-panel-raised)] p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-base font-black text-[var(--nv-text)]">
              <BellRing className="h-5 w-5 text-amber-500" />
              هشدار قیمت {instrumentName}
            </div>
            <p className="mt-2 text-xs leading-6 text-[var(--nv-muted)]">
              آخرین قیمت: <b dir="ltr">{formatPrice(currentPrice)}</b>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--nv-border)] text-[var(--nv-muted)]"
            aria-label="بستن"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[140px_1fr_auto]">
          <select
            value={direction}
            onChange={(event) =>
              setDirection(event.target.value as PriceAlertDirection)
            }
            className="h-11 rounded-xl border border-[var(--nv-border)] bg-[var(--nv-soft)] px-3 text-xs font-bold outline-none"
          >
            <option value="above">رسیدن یا عبور به بالا</option>
            <option value="below">رسیدن یا عبور به پایین</option>
          </select>
          <input
            dir="ltr"
            inputMode="decimal"
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            placeholder="Target price"
            className="h-11 min-w-0 rounded-xl border border-[var(--nv-border)] bg-[var(--nv-soft)] px-3 text-left text-sm font-bold outline-none focus:border-amber-500/50"
          />
          <button
            type="button"
            onClick={handleSubmit}
            className="h-11 rounded-xl bg-amber-500 px-4 text-xs font-black text-slate-950"
          >
            افزودن
          </button>
        </div>
        {error ? <p className="mt-2 text-xs text-rose-500">{error}</p> : null}

        <div className="mt-5 space-y-2">
          {alerts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--nv-border-strong)] p-6 text-center text-xs text-[var(--nv-muted)]">
              هنوز هشداری برای این نماد ثبت نشده است.
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center gap-3 rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-soft)] p-3"
              >
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    alert.active ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-[var(--nv-text)]">
                    {alert.direction === 'above' ? 'عبور به بالا از' : 'عبور به پایین از'}{' '}
                    <span dir="ltr">{formatPrice(alert.targetPrice)}</span>
                  </p>
                  <p className="mt-1 text-[10px] text-[var(--nv-muted)]">
                    {alert.triggeredAt ? `فعال‌شده در ${formatDate(alert.triggeredAt)}` : 'در حال پایش'}
                  </p>
                </div>
                {!alert.active ? (
                  <button
                    type="button"
                    title="فعال‌سازی مجدد"
                    onClick={() => onRearm(alert.id)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-cyan-500 hover:bg-cyan-500/10"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                ) : null}
                <button
                  type="button"
                  title="حذف هشدار"
                  onClick={() => onRemove(alert.id)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-rose-500 hover:bg-rose-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <p className="mt-4 text-[10px] leading-5 text-[var(--nv-muted)]">
          هشدارهای این نسخه در همین مرورگر ذخیره می‌شوند و فقط هنگامی که صفحه
          BAZARA باز است قیمت را پایش می‌کنند.
        </p>
      </section>
    </div>
  );
}
