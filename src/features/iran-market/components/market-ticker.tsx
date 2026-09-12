import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

import type { IranMarketAsset } from '../types';
import {
  changeTone,
  formatPercent,
  formatPrice,
  unitLabel,
} from '../utils/formatters';

interface MarketTickerProps {
  assets: IranMarketAsset[];
  selectedSymbol: string;
  onSelect: (symbol: string) => void;
}

export function MarketTicker({
  assets,
  selectedSymbol,
  onSelect,
}: MarketTickerProps) {
  if (!assets.length) {
    return (
      <div className="border-b border-[var(--nv-border)] bg-[var(--nv-panel)] px-4 py-4 text-center text-sm text-[var(--nv-muted)]">
        هنوز قیمت قابل نمایشی از بک‌اند دریافت نشده است.
      </div>
    );
  }

  return (
    <section className="border-b border-[var(--nv-border)] bg-[var(--nv-panel)]">
      <div className="nv-scrollbar nv-mobile-scroll mx-auto flex max-w-[1440px] gap-2 overflow-x-auto px-3 py-3 sm:px-6 lg:px-10">
        {assets.map((asset) => {
          const price = asset.latest_price;
          const tone = changeTone(price?.change_percent);
          const Icon =
            tone === 'positive'
              ? TrendingUp
              : tone === 'negative'
                ? TrendingDown
                : Minus;
          const selected = selectedSymbol === asset.symbol;

          return (
            <button
              type="button"
              key={asset.symbol}
              onClick={() => onSelect(asset.symbol)}
              className={`nv-mobile-snap flex min-w-[178px] items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 text-right transition sm:min-w-[210px] sm:px-4 ${
                selected
                  ? 'border-cyan-500/35 bg-cyan-500/[0.09] shadow-[0_0_28px_rgba(34,211,238,0.08)]'
                  : 'border-[var(--nv-border)] bg-[var(--nv-soft)] hover:border-cyan-500/20'
              }`}
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-[var(--nv-text-soft)] sm:text-sm">
                  {asset.name}
                </p>
                <p className="mt-1 whitespace-nowrap text-sm font-black text-[var(--nv-text)] sm:text-base">
                  {formatPrice(price?.price)}
                  <span className="mr-1 text-[10px] font-medium text-[var(--nv-muted)]">
                    {unitLabel(asset.price_unit)}
                  </span>
                </p>
              </div>
              <div
                className={`flex items-center gap-1 text-xs font-bold ${
                  tone === 'positive'
                    ? 'text-emerald-400'
                    : tone === 'negative'
                      ? 'text-rose-400'
                      : 'text-[var(--nv-muted)]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {formatPercent(price?.change_percent)}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
