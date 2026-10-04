import {
  BarChart3,
  CheckCircle2,
  ShieldAlert,
  Target,
  TrendingUp,
} from 'lucide-react';

import type { SmartPortfolioItem } from '@/features/smart-portfolio/types';
import { formatNative, toNumber } from '@/features/smart-portfolio/utils/formatters';

const actionLabels: Record<string, string> = {
  buy: 'فرصت خرید مشروط',
  hold: 'نگهداری',
  sell: 'فروش',
  wait: 'زیر نظر',
  watch: 'زیر نظر',
};

export function StockOpportunityCard({ item }: { item: SmartPortfolioItem }) {
  const targets = item.targets ?? [];
  const risk = Math.round(toNumber(item.risk_score));

  return (
    <article className="nv-card-interactive min-w-0 overflow-hidden rounded-2xl p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-black text-[var(--nv-text)]">
            {item.name || item.display_symbol}
          </h3>
          <p dir="ltr" className="mt-1 text-right text-sm font-bold text-[var(--nv-muted)]">
            {item.display_symbol || item.symbol}
          </p>
        </div>
        <span className="nv-status-success inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black sm:text-sm">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {actionLabels[item.action.toLowerCase()] ?? item.action}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Score label="ریسک" value={risk} danger={risk >= 70} />
        <Score label="اطمینان" value={toNumber(item.confidence_score)} />
        <Score label="کیفیت داده" value={toNumber(item.data_quality_score)} />
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <Level
          Icon={TrendingUp}
          label="محدوده ورود"
          value={
            item.entry_min && item.entry_max
              ? `${formatNative(item.entry_min, item.native_currency)} تا ${formatNative(item.entry_max, item.native_currency)}`
              : 'هنوز صادر نشده'
          }
        />
        <Level
          Icon={ShieldAlert}
          label="حد ضرر"
          value={formatNative(item.stop_loss, item.native_currency)}
          danger
        />
        <Level
          Icon={Target}
          label="اهداف"
          value={
            targets.length
              ? targets.map((target) => formatNative(target, item.native_currency)).join(' · ')
              : 'هنوز صادر نشده'
          }
        />
      </div>

      {item.rationale ? (
        <p className="mt-4 text-sm leading-7 text-[var(--nv-text-soft)]">
          {item.rationale}
        </p>
      ) : null}

      <p className="nv-status-info mt-4 flex items-start gap-2 rounded-xl p-3 text-sm leading-7">
        <BarChart3 className="mt-1 h-3.5 w-3.5 shrink-0" />
        این کارت فقط فرصت تحلیلی را نشان می‌دهد؛ مبلغ و درصد تخصیص فقط در صفحه
        «سبد ترکیبی» نمایش داده می‌شود.
      </p>
    </article>
  );
}

function Score({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="rounded-xl border border-[var(--nv-border)] bg-[var(--nv-soft)] p-2.5">
      <p className="text-xs font-bold text-[var(--nv-muted)] sm:text-sm">{label}</p>
      <p className={`mt-1.5 text-sm font-black ${danger ? 'text-[var(--nv-danger)]' : 'text-[var(--nv-text)]'}`}>
        {Math.round(value).toLocaleString('fa-IR')} / ۱۰۰
      </p>
    </div>
  );
}

function Level({ Icon, label, value, danger = false }: { Icon: typeof Target; label: string; value: string; danger?: boolean }) {
  return (
    <div className="nv-surface-raised rounded-xl p-3">
      <p className="flex items-center gap-1.5 text-xs font-bold text-[var(--nv-muted)] sm:text-sm">
        <Icon className={`h-3.5 w-3.5 ${danger ? 'text-[var(--nv-danger)]' : 'text-[var(--nv-accent)]'}`} />
        {label}
      </p>
      <p dir="ltr" className="nv-number mt-2 text-right text-sm font-bold leading-6 text-[var(--nv-text-soft)]">
        {value}
      </p>
    </div>
  );
}
