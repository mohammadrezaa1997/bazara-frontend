'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BrainCircuit,
  CalendarClock,
  Coins,
  Landmark,
  Loader2,
  PieChart,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';
import { toast } from 'sonner';

import { FreshnessNotice } from '@/components/data/freshness-notice';
import { AppHeader } from '@/components/layout/app-header';
import { useAuthStore } from '@/lib/store';
import { resolveFreshness } from '@/lib/freshness';
import { AllocationChart } from './allocation-chart';
import { PortfolioItemCard } from './portfolio-item-card';
import { RiskComparisonChart } from './risk-comparison-chart';
import {
  useCurrentSmartPortfolio,
  useGenerateSmartPortfolio,
} from '../hooks/use-smart-portfolio';
import type { MarketAllocation, SmartPortfolio } from '../types';
import {
  formatDate,
  formatNumericInput,
  formatPercent,
  formatToman,
  toNumber,
} from '../utils/formatters';

function allocationsFor(portfolio: SmartPortfolio): MarketAllocation[] {
  if (portfolio.market_allocations?.length) return portfolio.market_allocations;
  return [
    {
      market: 'cash',
      type: 'capital',
      allocation_percent: portfolio.cash_reserve_percent,
      amount_toman: portfolio.cash_reserve_amount_toman,
    },
  ];
}

export function SmartPortfolioDashboard() {
  const storedBudget = useAuthStore((state) => state.budget);
  const [budgetInput, setBudgetInput] = useState(() =>
    formatNumericInput(storedBudget >= 1_000_000 ? storedBudget : 100_000_000),
  );
  const currentQuery = useCurrentSmartPortfolio();
  const generateMutation = useGenerateSmartPortfolio();
  const storedPortfolio = currentQuery.data?.portfolio;
  const portfolioFreshness = storedPortfolio
    ? resolveFreshness({
        isValid: storedPortfolio.is_valid,
        validUntil: storedPortfolio.valid_until,
      })
    : null;
  const portfolio = portfolioFreshness?.isFresh ? storedPortfolio : undefined;

  useEffect(() => {
    if (generateMutation.isSuccess) {
      toast.success(
        generateMutation.data.reused
          ? 'سبد ترکیبی معتبر قبلی نمایش داده شد.'
          : 'سبد ترکیبی جدید ساخته شد.',
      );
    }
    if (generateMutation.isError) {
      toast.error('ساخت سبد ترکیبی انجام نشد؛ پروفایل و داده‌های بازار را بررسی کنید.');
    }
  }, [generateMutation.data, generateMutation.isError, generateMutation.isSuccess]);

  const handleGenerate = (event: FormEvent) => {
    event.preventDefault();
    const budget = Number(budgetInput.replace(/,/g, ''));
    if (!Number.isFinite(budget) || budget <= 0) {
      toast.error('بودجه را به‌صورت عدد مثبت و بر حسب تومان وارد کنید.');
      return;
    }
    generateMutation.mutate(budget);
  };

  const items = portfolio?.items ?? [];
  const capitalItems = items.filter((item) => item.allocation_type === 'capital');
  const forexItems = items.filter((item) => item.allocation_type === 'risk_budget');
  const iranItems = capitalItems.filter((item) => item.market === 'iran');
  const cryptoItems = capitalItems.filter((item) => item.market === 'crypto');
  const allocations = useMemo(
    () => (portfolio ? allocationsFor(portfolio) : []),
    [portfolio],
  );

  const refreshPage = () => currentQuery.refetch();

  return (
    <div dir="rtl" className="nv-page nv-mobile-safe">
      <AppHeader
        active="portfolio"
        badge="SMART ALLOCATION"
        subtitle="سبد ترکیبی متناسب با ریسک"
        onRefresh={refreshPage}
        isRefreshing={currentQuery.isFetching}
      />

      <main className="mx-auto max-w-[1500px] space-y-6 px-3 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-stretch">
          <div className="nv-card relative overflow-hidden rounded-2xl p-5 sm:p-8">
            <div className="relative">
              <div className="nv-kicker flex items-center gap-2">
                <BrainCircuit className="h-4 w-4" /> پیشنهاد تخصیص سرمایه BAZARA
              </div>
              <h1 className="mt-4 max-w-3xl text-2xl font-black leading-[1.6] text-[var(--nv-text)] sm:text-4xl">
                سبد سرمایه‌گذاری ترکیبی، متناسب با ریسک شما
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-8 text-[var(--nv-muted)] sm:text-base">
                سرمایه قابل‌تخصیص بین بازار ایران، رمزارز و وجه نقد تقسیم می‌شود.
                سناریوهای فارکس جداگانه نمایش داده می‌شوند و فقط سقف زیان مجاز
                آن‌ها محاسبه می‌شود، نه مبلغ خرید یا اندازه موقعیت.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-[var(--nv-text-soft)]">
                {['حذف خودکار ریسک ۷۰ به بالا', 'بدون فراخوانی AI خارجی', 'هماهنگ با پروفایل روان‌شناختی'].map((label) => (
                  <span key={label} className="rounded-lg border border-[var(--nv-border)] bg-[var(--nv-soft)] px-3 py-2">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <form
            onSubmit={handleGenerate}
            className="nv-card flex flex-col justify-between rounded-2xl p-5 sm:p-6"
          >
            <div>
              <label htmlFor="portfolio-budget" className="text-sm font-black text-[var(--nv-text)]">
                بودجه کل سبد
              </label>
              <p className="mt-1 text-xs leading-6 text-[var(--nv-muted)]">
                مبلغ را فقط به تومان وارد کنید.
              </p>
              <div className="relative mt-4">
                <input
                  id="portfolio-budget"
                  inputMode="numeric"
                  value={budgetInput}
                  onChange={(event) => setBudgetInput(formatNumericInput(event.target.value))}
                  className="nv-field h-14 w-full rounded-2xl px-4 pl-20 text-left text-lg font-black"
                  dir="ltr"
                  aria-describedby="budget-unit"
                />
                <span id="budget-unit" className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-[var(--nv-muted)]">
                  تومان
                </span>
              </div>
            </div>
            <button
              type="submit"
              disabled={generateMutation.isPending}
              className="nv-button-primary mt-5 min-h-13 w-full disabled:cursor-wait disabled:opacity-60"
            >
              {generateMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <PieChart className="h-5 w-5" />}
              ساخت یا به‌روزرسانی سبد ترکیبی
            </button>
          </form>
        </section>

        {currentQuery.isLoading ? (
          <div className="nv-card flex min-h-64 items-center justify-center gap-3 rounded-2xl text-sm text-[var(--nv-muted)]">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--nv-accent)]" /> دریافت سبد ترکیبی معتبر...
          </div>
        ) : currentQuery.isError ? (
          <div className="nv-status-danger rounded-2xl p-8 text-center text-sm leading-7">
            ارتباط با سرویس سبد ترکیبی برقرار نشد. مهاجرت دیتابیس، بک‌اند و توکن ورود را بررسی کنید.
          </div>
        ) : !portfolio ? (
          <section className="nv-card rounded-2xl p-8 text-center sm:p-12">
            <WalletCards className="mx-auto h-10 w-10 text-[var(--nv-accent)]" />
            <h2 className="mt-4 text-xl font-black text-[var(--nv-text)]">هنوز سبد ترکیبی معتبری وجود ندارد</h2>
            {storedPortfolio && portfolioFreshness ? (
              <div className="mx-auto mt-4 max-w-2xl text-right">
                <FreshnessNotice
                  freshness={portfolioFreshness}
                  analyzedAt={storedPortfolio.generated_at}
                />
              </div>
            ) : null}
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-8 text-[var(--nv-muted)]">
              بودجه را وارد کنید و دکمه ساخت سبد را بزنید. اگر فرصت امنی وجود نداشته باشد، سیستم به‌جای پیشنهاد اجباری، بودجه را نقد نگه می‌دارد.
            </p>
          </section>
        ) : (
          <>
            <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              <Kpi Icon={WalletCards} label="کل بودجه" value={formatToman(portfolio.budget_toman)} />
              <Kpi Icon={PieChart} label="سرمایه تخصیص‌یافته" value={formatToman(portfolio.invested_amount_toman)} note={formatPercent(portfolio.invested_percent)} />
              <Kpi Icon={Coins} label="ذخیره نقد" value={formatToman(portfolio.cash_reserve_amount_toman)} note={formatPercent(portfolio.cash_reserve_percent)} />
              <Kpi Icon={ShieldCheck} label="ریسک کل سبد" value={`${Math.round(toNumber(portfolio.overall_risk_score)).toLocaleString('fa-IR')} / ۱۰۰`} />
            </section>

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              <AllocationChart allocations={allocations} />
              <div className="nv-card rounded-2xl p-5 sm:p-6">
                <p className="text-xs font-black text-[var(--nv-accent)]">پروفایل سرمایه‌گذار</p>
                <h2 className="mt-1 text-lg font-black text-[var(--nv-text)]">
                  {portfolio.profile_summary.archetype?.title || 'تناسب ریسک و افق زمانی'}
                </h2>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <ProfileMetric label="سطح ریسک" value={portfolio.risk_profile_label} />
                  <ProfileMetric label="ریسک مؤثر" value={`${Math.round(toNumber(portfolio.profile_summary.effective_risk_score ?? portfolio.psychological_risk_score)).toLocaleString('fa-IR')} / ۱۰۰`} />
                  <ProfileMetric label="کنترل رفتاری" value={portfolio.profile_summary.behavioral_score == null ? '—' : `${Math.round(toNumber(portfolio.profile_summary.behavioral_score)).toLocaleString('fa-IR')} / ۱۰۰`} />
                  <ProfileMetric label="سازگاری پاسخ‌ها" value={portfolio.profile_summary.consistency_score == null ? '—' : `${Math.round(toNumber(portfolio.profile_summary.consistency_score)).toLocaleString('fa-IR')}٪`} />
                  <ProfileMetric label="سقف افت پیشنهادی" value={portfolio.profile_summary.max_drawdown_percent == null ? '—' : formatPercent(portfolio.profile_summary.max_drawdown_percent)} />
                  <ProfileMetric label="افق سرمایه‌گذاری" value={portfolio.investment_horizon || '—'} />
                </div>
                <div className="mt-5 rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-soft)] p-4 text-sm leading-7 text-[var(--nv-text-soft)]">
                  {portfolio.summary}
                </div>
                <Link
                  href="/onboarding"
                  className="nv-button-secondary mt-4 w-full"
                >
                  ویرایش پروفایل روان‌شناختی <ArrowLeft className="h-4 w-4" />
                </Link>
              </div>
            </section>

            <RiskComparisonChart items={items} />

            <PortfolioGroup
              title="تخصیص بازار ایران"
              subtitle="مبلغ و درصد از کل بودجه بر حسب تومان"
              Icon={Landmark}
              items={iranItems}
            />
            <PortfolioGroup
              title="تخصیص رمزارز"
              subtitle="تبدیل ارزش دلاری به مبلغ قابل تخصیص بر حسب تومان"
              Icon={Coins}
              items={cryptoItems}
            />

            <section className="nv-card rounded-2xl p-4 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="nv-kicker">فارکس · بودجه ریسک</p>
                  <h2 className="mt-1 text-xl font-black text-[var(--nv-text)]">سقف زیان مجاز، نه تخصیص سرمایه</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--nv-muted)]">
                    حجم لات به قرارداد بروکر، ارزش پیپ و نرخ تبدیل وابسته است؛ بنابراین سیستم فقط حداکثر زیان مجاز را مشخص می‌کند.
                  </p>
                </div>
                <div className="nv-surface shrink-0 rounded-xl p-4 text-center">
                  <p className="text-xs text-[var(--nv-muted)]">مجموع سقف ریسک</p>
                  <p className="mt-1 text-lg font-black text-[var(--nv-text)]">{formatToman(portfolio.forex_risk_amount_toman)}</p>
                  <p className="mt-1 text-xs font-black text-[var(--nv-accent)]">{formatPercent(portfolio.forex_risk_percent)}</p>
                </div>
              </div>
              {forexItems.length ? (
                <div className="mt-5 grid gap-4 xl:grid-cols-2">
                  {forexItems.map((item) => <PortfolioItemCard key={item.id} item={item} />)}
                </div>
              ) : (
                <p className="mt-5 rounded-2xl bg-[var(--nv-panel)] p-5 text-center text-sm text-[var(--nv-muted)]">در حال حاضر سناریوی فارکس سازگار با محدودیت ریسک وجود ندارد.</p>
              )}
            </section>

            <footer className="flex flex-col gap-2 border-t border-[var(--nv-border)] pt-5 text-xs leading-6 text-[var(--nv-muted)] sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-center gap-2"><CalendarClock className="h-4 w-4" /> تولید: {formatDate(portfolio.generated_at)}</span>
              <span>نسخه موتور: {portfolio.generation_version}</span>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}

function Kpi({ Icon, label, value, note }: { Icon: typeof WalletCards; label: string; value: string; note?: string }) {
  return (
    <article className="nv-card min-w-0 rounded-2xl p-3.5 sm:p-5">
      <Icon className="h-4 w-4 text-[var(--nv-accent)]" />
      <p className="mt-3 text-xs font-bold text-[var(--nv-muted)] sm:text-sm">{label}</p>
      <p className="mt-1 break-words text-sm font-black text-[var(--nv-text)] sm:text-lg">{value}</p>
      {note ? <p className="mt-1 text-xs font-black text-[var(--nv-accent)] sm:text-sm">{note}</p> : null}
    </article>
  );
}

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-soft)] p-3.5">
      <p className="text-xs font-bold text-[var(--nv-muted)] sm:text-sm">{label}</p>
      <p className="mt-1 break-words text-sm font-black leading-6 text-[var(--nv-text)]">{value}</p>
    </div>
  );
}

function PortfolioGroup({
  title,
  subtitle,
  Icon,
  items,
}: {
  title: string;
  subtitle: string;
  Icon: typeof Coins;
  items: SmartPortfolio['items'];
}) {
  return (
    <section>
      <div className="mb-4 flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--nv-accent-border)] bg-[var(--nv-accent-soft)] text-[var(--nv-accent)]">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-black text-[var(--nv-text)]">{title}</h2>
          <p className="mt-1 text-sm text-[var(--nv-muted)]">{subtitle}</p>
        </div>
      </div>
      {items.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {items.map((item) => <PortfolioItemCard key={item.id} item={item} />)}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--nv-border-strong)] bg-[var(--nv-soft)] p-6 text-center text-sm leading-7 text-[var(--nv-muted)]">
          در شرایط فعلی فرصت امن و سازگار با پروفایل برای این بازار انتخاب نشده است.
        </div>
      )}
    </section>
  );
}
