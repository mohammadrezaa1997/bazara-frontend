'use client';

import {
  Activity,
  AlertTriangle,
  Gauge,
  ShieldCheck,
  Target,
} from 'lucide-react';

import type {
  ForexAnalysis,
  ForexTimeframe,
} from '../types';
import { formatForexPrice } from '../utils/indicators';

interface AnalysisPanelProps {
  analysis?: ForexAnalysis;
  timeframe: ForexTimeframe;
  isLoading: boolean;
}

const decisionStyles = {
  buy: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  sell: 'border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-300',
  watch:
    'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  no_trade:
    'border-slate-500/20 bg-slate-500/10 text-[var(--nv-muted)]',
};

function ScoreCard({
  label,
  value,
}: {
  label: string;
  value?: number;
}) {
  const normalized = Math.max(
    0,
    Math.min(100, value ?? 0),
  );

  return (
    <div className="rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-soft)] p-3.5">
      <div className="flex items-center justify-between text-xs text-[var(--nv-muted)]">
        <span>{label}</span>
        <strong className="text-[var(--nv-text)]">
          {normalized}
        </strong>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--nv-soft-strong)]">
        <div
          className="h-full rounded-full bg-gradient-to-l from-cyan-400 to-blue-500"
          style={{ width: `${normalized}%` }}
        />
      </div>
    </div>
  );
}

export function AnalysisPanel({
  analysis,
  timeframe,
  isLoading,
}: AnalysisPanelProps) {
  if (isLoading) {
    return (
      <aside className="rounded-[26px] border border-[var(--nv-border)] bg-[var(--nv-panel)] p-5 text-sm text-[var(--nv-muted)] shadow-[var(--nv-shadow)]">
        در حال دریافت آخرین تحلیل...
      </aside>
    );
  }

  if (!analysis) {
    return (
      <aside className="rounded-[26px] border border-amber-500/20 bg-amber-500/[0.06] p-5 text-sm leading-7 text-amber-800 dark:text-amber-200">
        برای این جفت‌ارز هنوز تحلیل معتبری ثبت نشده است.
      </aside>
    );
  }

  const timeframeIndicators =
    analysis.indicators?.timeframes?.[timeframe];

  return (
    <aside className="space-y-4">
      <section className="rounded-[26px] border border-[var(--nv-border)] bg-[var(--nv-panel)] p-5 shadow-[var(--nv-shadow)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-cyan-600 dark:text-cyan-300">
              خروجی موتور تحلیل
            </p>

            <h2 className="mt-2 text-xl font-black text-[var(--nv-text)]">
              {analysis.pair.display_symbol}
            </h2>
          </div>

          <span
            className={`rounded-xl border px-3 py-2 text-xs font-black ${
              decisionStyles[analysis.decision]
            }`}
          >
            {analysis.decision_display}
          </span>
        </div>

        <p className="mt-4 text-sm leading-7 text-[var(--nv-text-soft)]">
          {analysis.summary}
        </p>

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          <ScoreCard
            label="امتیاز تکنیکال"
            value={analysis.technical_score}
          />

          <ScoreCard
            label="اطمینان"
            value={analysis.confidence_score}
          />

          <ScoreCard
            label="کیفیت داده"
            value={analysis.data_quality_score}
          />
        </div>
      </section>
      <section className="rounded-[26px] border border-[var(--nv-border)] bg-[var(--nv-panel)] p-5 shadow-[var(--nv-shadow)]">
        <div className="flex items-center gap-2 text-sm font-black text-[var(--nv-text)]">
          <Activity className="h-4 w-4 text-cyan-500" />
          وضعیت چندتایم‌فریمی
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          {[
            ['D1', analysis.d1_trend_display],
            ['H4', analysis.h4_trend_display],
            ['H1', analysis.h1_trend_display],
          ].map(([label, trend]) => (
            <div
              key={label}
              className="rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-soft)] p-3"
            >
              <div
                dir="ltr"
                className="font-black text-cyan-500"
              >
                {label}
              </div>

              <div className="mt-1 leading-5 text-[var(--nv-text-soft)]">
                {trend}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[26px] border border-[var(--nv-border)] bg-[var(--nv-panel)] p-5 shadow-[var(--nv-shadow)]">
        <div className="flex items-center gap-2 text-sm font-black text-[var(--nv-text)]">
          <Gauge className="h-4 w-4 text-violet-500" />
          اندیکاتورهای {timeframe.toUpperCase()}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          {[
            ['RSI 14', timeframeIndicators?.rsi14],
            ['ADX 14', timeframeIndicators?.adx14],
            ['ATR 14', timeframeIndicators?.atr14],
            [
              'MACD Hist',
              timeframeIndicators?.macd_histogram,
            ],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-soft)] p-3"
            >
              <div className="text-[var(--nv-muted)]">
                {label}
              </div>

              <div
                dir="ltr"
                className="mt-1 font-black text-[var(--nv-text)]"
              >
                {typeof value === 'number'
                  ? formatForexPrice(value)
                  : '—'}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[26px] border border-[var(--nv-border)] bg-[var(--nv-panel)] p-5 shadow-[var(--nv-shadow)]">
        <div className="flex items-center gap-2 text-sm font-black text-[var(--nv-text)]">
          <Target className="h-4 w-4 text-emerald-500" />
          برنامه معامله
        </div>

        {analysis.is_trade_ready ? (
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.06] p-3">
              <div className="text-[var(--nv-muted)]">
                محدوده ورود
              </div>

              <div
                dir="ltr"
                className="mt-1 font-black text-cyan-600 dark:text-cyan-300"
              >
                {formatForexPrice(analysis.entry_min)} –{' '}
                {formatForexPrice(analysis.entry_max)}
              </div>
            </div>

            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] p-3">
              <div className="text-[var(--nv-muted)]">
                حد ضرر
              </div>

              <div
                dir="ltr"
                className="mt-1 font-black text-rose-600 dark:text-rose-300"
              >
                {formatForexPrice(analysis.stop_loss)}
              </div>
            </div>

            {analysis.targets.map((target, index) => (
              <div
                key={`${target}-${index}`}
                className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3"
              >
                <div className="text-[var(--nv-muted)]">
                  هدف {index + 1}
                </div>

                <div
                  dir="ltr"
                  className="mt-1 font-black text-emerald-600 dark:text-emerald-300"
                >
                  {formatForexPrice(target)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 flex gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-3 text-xs leading-6 text-amber-800 dark:text-amber-200">
            <AlertTriangle className="mt-1 h-4 w-4 shrink-0" />
            تا زمان تکمیل هم‌راستایی و کنترل ریسک، نقطه
            ورود قطعی نمایش داده نمی‌شود.
          </div>
        )}
      </section>

      <div className="flex items-start gap-2 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.05] p-4 text-xs leading-6 text-[var(--nv-muted)]">
        <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-emerald-500" />
        تحلیل تضمین سود نیست و حجم معامله باید با ارزش پیپ
        و مشخصات بروکر محاسبه شود.
      </div>
    </aside>
  );
}