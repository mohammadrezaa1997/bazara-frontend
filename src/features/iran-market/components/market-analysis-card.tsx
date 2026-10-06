import { AlertTriangle, BarChart3, CheckCircle2, Clock3, ShieldAlert } from 'lucide-react';

import { FreshnessNotice } from '@/components/data/freshness-notice';
import { resolveFreshness } from '@/lib/freshness';
import type { IranMarketAnalysis, IranMarketAsset } from '../types';
import { formatPrice, unitLabel } from '../utils/formatters';

interface MarketAnalysisCardProps {
  asset?: IranMarketAsset;
  analysis?: IranMarketAnalysis;
  isLoading?: boolean;
  selected?: boolean;
  onSelect: (symbol: string) => void;
}

const recommendationLabels: Record<string, string> = {
  strong_buy: 'خرید قوی',
  buy: 'خرید مشروط',
  hold: 'نگهداری',
  wait: 'انتظار',
  sell: 'فروش',
  strong_sell: 'فروش قوی',
};

const trendLabels: Record<string, string> = {
  strong_bullish: 'صعودی قوی',
  bullish: 'صعودی',
  neutral: 'خنثی',
  bearish: 'نزولی',
  strong_bearish: 'نزولی قوی',
  unknown: 'نامشخص',
};

function recommendationTone(value?: string) {
  if (value === 'buy' || value === 'strong_buy') {
    return 'nv-status-success';
  }
  if (value === 'sell' || value === 'strong_sell') {
    return 'nv-status-danger';
  }
  return 'nv-status-warning';
}

export function MarketAnalysisCard({
  asset,
  analysis,
  isLoading = false,
  selected = false,
  onSelect,
}: MarketAnalysisCardProps) {
  const quality = analysis?.indicators?.composite?.data_quality_score;
  const freshness = analysis
    ? resolveFreshness({
        isValid: analysis.is_valid,
        validUntil: analysis.valid_until,
        freshness: analysis.freshness,
      })
    : null;

  return (
    <button
      type="button"
      disabled={!asset}
      onClick={() => asset && onSelect(asset.symbol)}
      className={`min-w-0 rounded-2xl border p-4 text-right shadow-[var(--nv-shadow)] transition sm:p-5 ${
        selected
          ? 'border-[var(--nv-accent-border)] bg-[var(--nv-accent-soft)] ring-2 ring-[var(--nv-accent-border)]/20'
          : 'border-[var(--nv-border)] bg-[var(--nv-panel)] hover:-translate-y-0.5 hover:border-[var(--nv-border-strong)] hover:shadow-[var(--nv-shadow-raised)]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-black text-[var(--nv-text)] sm:text-lg">
            {asset?.name ?? 'در حال دریافت نماد...'}
          </p>
          <p dir="ltr" className="mt-1 text-right text-xs font-bold text-[var(--nv-muted)]">
            {asset?.provider_symbol || asset?.symbol || '—'}
          </p>
        </div>
        {analysis ? (
          <span className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-black ${recommendationTone(analysis.recommendation)}`}>
            {!freshness?.isFresh
              ? 'تحلیل منقضی'
              : recommendationLabels[analysis.recommendation] ?? analysis.recommendation}
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <div className="mt-5 h-20 animate-pulse rounded-2xl bg-[var(--nv-soft)]" />
      ) : analysis ? (
        <>
          {freshness ? (
            <div className="mt-4">
              <FreshnessNotice
                freshness={freshness}
                analyzedAt={analysis.analyzed_at}
                compact
              />
            </div>
          ) : null}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Metric label="ریسک" value={analysis.risk_score} danger={analysis.risk_score >= 70} />
            <Metric label="اطمینان" value={analysis.confidence_score} />
            <Metric label="کیفیت" value={quality} />
          </div>
          <p className="mt-4 line-clamp-4 text-sm leading-7 text-[var(--nv-text-soft)]">
            {analysis.summary}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-[var(--nv-muted)]">
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--nv-soft)] px-2.5 py-1">
              <BarChart3 className="h-3 w-3 text-[var(--nv-accent)]" />
              {trendLabels[analysis.trend] ?? analysis.trend}
            </span>
            <span className="rounded-full bg-[var(--nv-soft)] px-2.5 py-1">
              {formatPrice(asset?.latest_price?.price)} {unitLabel(asset?.price_unit)}
            </span>
          </div>
        </>
      ) : (
        <div className="nv-status-warning mt-4 flex items-start gap-2 rounded-xl p-3 text-sm leading-7">
          <Clock3 className="mt-1 h-3.5 w-3.5 shrink-0" />
          تحلیل معتبر برای این نماد هنوز آماده نیست.
        </div>
      )}
    </button>
  );
}

function Metric({ label, value, danger = false }: { label: string; value?: number; danger?: boolean }) {
  const Icon = danger ? ShieldAlert : value !== undefined ? CheckCircle2 : AlertTriangle;
  return (
    <div className="rounded-xl border border-[var(--nv-border)] bg-[var(--nv-soft)] p-2.5">
      <p className="text-xs font-bold text-[var(--nv-muted)]">{label}</p>
      <p className={`mt-1.5 flex items-center gap-1 text-sm font-black ${danger ? 'text-[var(--nv-danger)]' : 'text-[var(--nv-text)]'}`}>
        <Icon className="h-3 w-3" />
        {value === undefined ? '—' : Math.round(value).toLocaleString('fa-IR')}
      </p>
    </div>
  );
}
