import {
  AlertTriangle,
  Coins,
  Landmark,
  ShieldAlert,
  Target,
  TrendingUp,
} from 'lucide-react';

import type { SmartPortfolioItem } from '../types';
import {
  formatNative,
  formatPercent,
  formatToman,
  toNumber,
} from '../utils/formatters';

const actionLabels: Record<string, string> = {
  buy: 'خرید',
  sell: 'فروش',
  hold: 'نگهداری',
  wait: 'انتظار',
  watch: 'زیر نظر',
  avoid: 'عدم ورود',
};

export function PortfolioItemCard({ item }: { item: SmartPortfolioItem }) {
  const isForex = item.allocation_type === 'risk_budget';
  const MarketIcon = item.market === 'iran' ? Landmark : Coins;
  const targets = item.targets ?? [];

  return (
    <article className="nv-card-interactive overflow-hidden rounded-2xl">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--nv-accent-border)] bg-[var(--nv-accent-soft)] text-[var(--nv-accent)]">
              <MarketIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 dir="ltr" className="truncate text-right text-lg font-black text-[var(--nv-text)]">
                {item.display_symbol || item.symbol}
              </h3>
              <p className="mt-1 truncate text-sm font-medium text-[var(--nv-muted)]">{item.name}</p>
            </div>
          </div>
          <span className="rounded-xl border border-[var(--nv-border-strong)] bg-[var(--nv-soft-strong)] px-3 py-2 text-xs font-black text-[var(--nv-text)]">
            {actionLabels[item.action.toLowerCase()] ?? item.action}
          </span>
        </div>

        <div className="nv-surface mt-4 rounded-xl p-4">
          {isForex ? (
            <>
              <p className="text-xs text-[var(--nv-muted)]">سقف زیان مجاز این سناریو</p>
              <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
                <strong className="text-xl font-black text-[var(--nv-text)]">
                  {formatToman(item.risk_amount_toman)}
                </strong>
                <span className="text-base font-black text-[var(--nv-info)]">
                  {formatPercent(item.risk_percent)} از بودجه
                </span>
              </div>
              <p className="mt-2 text-xs font-medium leading-6 text-[var(--nv-muted)] sm:text-sm">
                این عدد تخصیص سرمایه یا اندازه لات نیست؛ فقط حداکثر زیان قابل‌قبول است.
              </p>
            </>
          ) : (
            <>
              <p className="text-xs text-[var(--nv-muted)]">تخصیص پیشنهادی</p>
              <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
                <strong className="text-xl font-black text-[var(--nv-text)]">
                  {formatToman(item.allocated_amount_toman)}
                </strong>
                <span className="text-base font-black text-[var(--nv-accent)]">
                  {formatPercent(item.allocation_percent)}
                </span>
              </div>
              {item.suggested_quantity ? (
                <p dir="ltr" className="nv-number mt-2 text-right text-xs font-bold text-[var(--nv-muted)]">
                  Quantity: {formatNative(item.suggested_quantity)}
                </p>
              ) : null}
            </>
          )}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <Score label="ریسک" value={item.risk_score} danger={toNumber(item.risk_score) >= 70} />
          <Score label="اطمینان" value={item.confidence_score} />
          <Score label="کیفیت" value={item.data_quality_score} />
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <Level
            Icon={TrendingUp}
            label="ورود"
            value={
              item.entry_min && item.entry_max
                ? `${formatNative(item.entry_min, item.native_currency)} تا ${formatNative(item.entry_max, item.native_currency)}`
                : '—'
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
                : '—'
            }
          />
        </div>

        {item.rationale ? (
          <p className="mt-4 text-sm leading-7 text-[var(--nv-text-soft)]">
            {item.rationale}
          </p>
        ) : null}

        {item.warnings?.length ? (
          <div className="nv-status-warning mt-4 rounded-xl p-3 text-sm leading-7">
            {item.warnings.map((warning) => (
              <p key={warning} className="flex items-start gap-2">
                <AlertTriangle className="mt-1 h-3.5 w-3.5 shrink-0" /> {warning}
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function Score({ label, value, danger = false }: { label: string; value: number | string; danger?: boolean }) {
  return (
    <div className="rounded-xl border border-[var(--nv-border)] bg-[var(--nv-soft)] p-2.5">
      <p className="text-xs font-bold text-[var(--nv-muted)]">{label}</p>
      <p className={`mt-1.5 text-sm font-black ${danger ? 'text-[var(--nv-danger)]' : 'text-[var(--nv-text)]'}`}>
        {Math.round(toNumber(value)).toLocaleString('fa-IR')} / ۱۰۰
      </p>
    </div>
  );
}

function Level({ Icon, label, value, danger = false }: { Icon: typeof Target; label: string; value: string; danger?: boolean }) {
  return (
    <div className="nv-surface-raised rounded-xl p-3">
      <p className="flex items-center gap-1.5 text-xs font-bold text-[var(--nv-muted)]">
        <Icon className={`h-3.5 w-3.5 ${danger ? 'text-[var(--nv-danger)]' : 'text-[var(--nv-accent)]'}`} /> {label}
      </p>
      <p dir="ltr" className="nv-number mt-2 text-right text-sm font-bold leading-6 text-[var(--nv-text-soft)]">
        {value}
      </p>
    </div>
  );
}
