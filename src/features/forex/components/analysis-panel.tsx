'use client';

import {
  Activity,
  AlertTriangle,
  Gauge,
  ShieldCheck,
  Target,
} from 'lucide-react';

import { FreshnessNotice } from '@/components/data/freshness-notice';
import { resolveFreshness } from '@/lib/freshness';
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
  buy: 'nv-status-success',
  sell: 'nv-status-danger',
  watch:
    'nv-status-warning',
  no_trade:
    'border-[var(--nv-border-strong)] bg-[var(--nv-soft-strong)] text-[var(--nv-text-soft)]',
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
    <div className="nv-surface rounded-xl p-3.5">
      <div className="flex items-center justify-between text-sm font-bold text-[var(--nv-muted)]">
        <span>{label}</span>
        <strong className="text-[var(--nv-text)]">
          {normalized}
        </strong>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--nv-soft-strong)]">
        <div
          className="h-full rounded-full bg-[var(--nv-accent)]"
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
      <aside className="nv-card rounded-2xl p-5 text-sm text-[var(--nv-muted)]">
        در حال دریافت آخرین تحلیل...
      </aside>
    );
  }

  if (!analysis) {
    return (
      <aside className="nv-status-warning rounded-2xl p-5 text-sm leading-7">
        برای این جفت‌ارز هنوز تحلیل معتبری ثبت نشده است.
      </aside>
    );
  }

  const timeframeIndicators =
    analysis.indicators?.timeframes?.[timeframe];
  const freshness = resolveFreshness({
    isValid: analysis.is_valid,
    validUntil: analysis.valid_until,
    freshness: analysis.freshness,
  });

  return (
    <aside className="space-y-4">
      <section className="nv-card rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="nv-kicker">
              خروجی موتور تحلیل
            </p>

            <h2 className="mt-2 text-xl font-black text-[var(--nv-text)]">
              {analysis.pair.display_symbol}
            </h2>
          </div>

          <span
            className={`rounded-xl border px-3 py-2 text-sm font-black ${
              freshness.isFresh
                ? decisionStyles[analysis.decision]
                : 'nv-status-warning'
            }`}
          >
            {freshness.isFresh ? analysis.decision_display : 'منقضی'}
          </span>
        </div>

        <div className="mt-4">
          <FreshnessNotice
            freshness={freshness}
            analyzedAt={analysis.analyzed_at}
            compact
          />
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
      <section className="nv-card rounded-2xl p-5">
        <div className="flex items-center gap-2 text-sm font-black text-[var(--nv-text)]">
          <Activity className="h-4 w-4 text-[var(--nv-accent)]" />
          وضعیت چندتایم‌فریمی
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
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
                className="font-black text-[var(--nv-accent)]"
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

      <section className="nv-card rounded-2xl p-5">
        <div className="flex items-center gap-2 text-sm font-black text-[var(--nv-text)]">
          <Gauge className="h-4 w-4 text-[var(--nv-info)]" />
          اندیکاتورهای {timeframe.toUpperCase()}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
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

      <section className="nv-card rounded-2xl p-5">
        <div className="flex items-center gap-2 text-sm font-black text-[var(--nv-text)]">
          <Target className="h-4 w-4 text-[var(--nv-positive)]" />
          برنامه معامله
        </div>

        {freshness.isFresh && analysis.is_trade_ready ? (
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="nv-status-info rounded-xl p-3">
              <div className="text-[var(--nv-muted)]">
                محدوده ورود
              </div>

              <div
                dir="ltr"
                className="mt-1 font-black"
              >
                {formatForexPrice(analysis.entry_min)} –{' '}
                {formatForexPrice(analysis.entry_max)}
              </div>
            </div>

            <div className="nv-status-danger rounded-xl p-3">
              <div className="text-[var(--nv-muted)]">
                حد ضرر
              </div>

              <div
                dir="ltr"
                className="mt-1 font-black"
              >
                {formatForexPrice(analysis.stop_loss)}
              </div>
            </div>

            {analysis.targets.map((target, index) => (
              <div
                key={`${target}-${index}`}
                className="nv-status-success rounded-xl p-3"
              >
                <div className="text-[var(--nv-muted)]">
                  هدف {index + 1}
                </div>

                <div
                  dir="ltr"
                  className="mt-1 font-black"
                >
                  {formatForexPrice(target)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="nv-status-warning mt-4 flex gap-2 rounded-xl p-3 text-sm leading-7">
            <AlertTriangle className="mt-1 h-4 w-4 shrink-0" />
            {freshness.isFresh
              ? 'تا زمان تکمیل هم‌راستایی و کنترل ریسک، نقطه ورود قطعی نمایش داده نمی‌شود.'
              : 'اعتبار این تحلیل پایان یافته است؛ سطوح معامله تا اجرای تحلیل تازه پنهان می‌مانند.'}
          </div>
        )}
      </section>

      <div className="nv-status-success flex items-start gap-2 rounded-xl p-4 text-sm leading-7">
        <ShieldCheck className="mt-1 h-4 w-4 shrink-0" />
        تحلیل تضمین سود نیست و حجم معامله باید با ارزش پیپ
        و مشخصات بروکر محاسبه شود.
      </div>
    </aside>
  );
}
