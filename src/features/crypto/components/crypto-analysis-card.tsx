import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Eye,
  ShieldAlert,
  Target,
  TrendingDown,
} from 'lucide-react';

import type { CryptoMarketCard } from '../types';

interface CryptoAnalysisCardProps {
  card: CryptoMarketCard;
  rank: number;
  isFresh: boolean;
}

const blockerLabels: Record<string, string> = {
  action_not_new_entry: 'فعلاً سیگنال ورود جدید صادر نشده است.',
  high_risk_excluded: 'ریسک دارایی برای سبد ترکیبی بیش از حد مجاز است.',
  data_quality_below_minimum: 'کیفیت داده برای تخصیص سرمایه کافی نیست.',
  trade_plan_incomplete: 'سطوح ورود و حد ضرر هنوز کامل نیست.',
  invalid_entry_zone: 'محدوده ورود معتبر نیست.',
  invalid_stop_loss: 'حد ضرر با محدوده ورود سازگار نیست.',
  current_price_below_entry_zone: 'قیمت هنوز به محدوده ورود نرسیده است.',
  current_price_above_entry_zone: 'قیمت از محدوده ورود عبور کرده است.',
  not_selected_by_portfolio_policy: 'در رتبه‌بندی فعلی وارد سبد ترکیبی نشده است.',
};

function actionMeta(actionValue: string) {
  const action = actionValue.toUpperCase();
  if (action === 'BUY' || action === 'ACCUMULATE') {
    return {
      label: 'فرصت خرید مشروط',
      Icon: CheckCircle2,
      tone: 'nv-status-success',
    };
  }
  if (action === 'SELL') {
    return {
      label: 'کاهش موقعیت',
      Icon: TrendingDown,
      tone: 'nv-status-danger',
    };
  }
  if (action === 'AVOID') {
    return {
      label: 'عدم ورود',
      Icon: ShieldAlert,
      tone: 'nv-status-warning',
    };
  }
  if (action === 'HOLD') {
    return {
      label: 'نگهداری',
      Icon: Clock3,
      tone: 'nv-status-info',
    };
  }
  return {
    label: 'زیر نظر',
    Icon: Eye,
    tone: 'border-[var(--nv-border-strong)] bg-[var(--nv-soft-strong)] text-[var(--nv-text-soft)]',
  };
}

function formatUsd(value?: number | null) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const digits = value >= 100 ? 2 : value >= 1 ? 4 : 8;
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: digits })}`;
}

function score(value?: number) {
  if (value === undefined || !Number.isFinite(value)) return '—';
  return Math.round(value).toLocaleString('fa-IR');
}

export function CryptoAnalysisCard({ card, rank, isFresh }: CryptoAnalysisCardProps) {
  const meta = actionMeta(isFresh ? card.action || 'WATCH' : 'WATCH');
  const ActionIcon = meta.Icon;
  const targets = card.take_profit_targets ?? [];
  const blocker = card.portfolio_block_reason
    ? blockerLabels[card.portfolio_block_reason] ?? card.portfolio_block_reason
    : '';

  return (
    <article className="nv-card-interactive min-w-0 overflow-hidden rounded-2xl">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-black text-[var(--nv-text)]">
                <span dir="ltr">{card.symbol}</span>
              </h3>
              <span className="rounded-lg border border-[var(--nv-border)] bg-[var(--nv-soft)] px-2.5 py-1 text-xs font-extrabold text-[var(--nv-muted)]">
                رتبه تحلیل {rank.toLocaleString('fa-IR')}
              </span>
            </div>
            <p className="mt-1 truncate text-sm font-medium text-[var(--nv-muted)]">{card.name}</p>
          </div>

          <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-black sm:text-sm ${meta.tone}`}>
            <ActionIcon className="h-3.5 w-3.5" />
            {isFresh ? meta.label : 'تحلیل منقضی'}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric label="قیمت فعلی" value={formatUsd(card.current_price)} />
          <Metric label="امتیاز تحلیل" value={`${score(card.total_score)} / ۱۰۰`} />
          <Metric label="ریسک" value={`${score(card.risk_score)} / ۱۰۰`} danger={(card.risk_score ?? 0) >= 70} />
          <Metric label="کیفیت داده" value={`${score(card.data_quality_score)} / ۱۰۰`} />
        </div>

        {isFresh ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <Level
              Icon={Target}
              label="محدوده ورود"
              value={card.entry_price_min && card.entry_price_max ? `${formatUsd(card.entry_price_min)} تا ${formatUsd(card.entry_price_max)}` : 'فعلاً صادر نشده'}
            />
            <Level Icon={ShieldAlert} label="حد ضرر" value={formatUsd(card.stop_loss)} danger />
            <Level
              Icon={BarChart3}
              label="اهداف"
              value={targets.length ? targets.map(formatUsd).join(' · ') : 'فعلاً صادر نشده'}
            />
          </div>
        ) : (
          <div className="nv-status-warning mt-3 flex items-start gap-2 rounded-xl p-3 text-sm leading-7">
            <AlertTriangle className="mt-1 h-4 w-4 shrink-0" />
            این کارت فقط سابقهٔ تحلیلی است؛ سطوح ورود، حد ضرر و اهداف تا تحلیل تازه پنهان شده‌اند.
          </div>
        )}

        {card.selection_reason ? (
          <p className="mt-4 text-sm leading-7 text-[var(--nv-text-soft)]">
            {card.selection_reason}
          </p>
        ) : null}

        {!isFresh ? null : blocker ? (
          <div className="nv-status-warning mt-4 flex items-start gap-2 rounded-xl p-3 text-sm leading-7">
            <AlertTriangle className="mt-1 h-4 w-4 shrink-0" />
            <span>{blocker} تخصیص سرمایه فقط در صفحه «سبد ترکیبی» نمایش داده می‌شود.</span>
          </div>
        ) : (
          <div className="nv-status-success mt-4 rounded-xl p-3 text-sm leading-7">
            این دارایی از فیلتر اولیه عبور کرده است؛ ورود نهایی آن به سبد ترکیبی به بودجه و پروفایل ریسک وابسته است.
          </div>
        )}
      </div>
    </article>
  );
}

function Metric({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="nv-surface min-w-0 rounded-xl p-3">
      <p className="text-xs font-bold text-[var(--nv-muted)] sm:text-sm">{label}</p>
      <p dir="ltr" className={`nv-number mt-1.5 truncate text-right text-base font-black ${danger ? 'text-[var(--nv-danger)]' : 'text-[var(--nv-text)]'}`}>
        {value}
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
