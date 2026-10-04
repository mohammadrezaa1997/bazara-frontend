'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  BrainCircuit,
  Database,
  Loader2,
  PieChart,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

import { AppHeader } from '@/components/layout/app-header';
import { FinancialAssistant } from '@/features/financial-assistant/financial-assistant';
import { CryptoProfessionalChart } from './crypto-professional-chart';
import { CryptoAnalysisCard } from './crypto-analysis-card';
import {
  cryptoMarketKeys,
  useCryptoMarketReport,
  useRequestCryptoRefresh,
} from '../hooks/use-crypto-market';
import type { CryptoMarketCard, CryptoPriceResponse } from '../types';

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function normalizeLegacyCards(
  report: ReturnType<typeof useCryptoMarketReport>['data'],
): CryptoMarketCard[] {
  const marketCards =
    report?.market_cards ??
    report?.portfolio?.market_cards ??
    report?.portfolio?.generation_metadata?.market_cards;
  if (marketCards?.length) return marketCards;
  const legacyCards = report?.portfolio_analysis?.length
    ? report.portfolio_analysis
    : report?.positions ?? [];
  return legacyCards.map((item) => ({
    ...item,
    confidence_score: Number(item.confidence_score) || 0,
    action: item.action || item.recommendation || 'WATCH',
    selection_reason: item.selection_reason || item.catalyst_reason || '',
  }));
}

export function CryptoMarketDashboard() {
  const queryClient = useQueryClient();
  const [selectedChartAsset, setSelectedChartAsset] =
    useState<'BTC' | 'ETH' | 'SOL'>('BTC');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const reportQuery = useCryptoMarketReport();
  const refreshMutation = useRequestCryptoRefresh();

  const pricesQuery = useQuery({
    queryKey: cryptoMarketKeys.prices(),
    queryFn: async () => {
      const response = await fetch('/api/prices', { cache: 'no-store' });
      if (!response.ok) throw new Error('Price service unavailable');
      return (await response.json()) as CryptoPriceResponse;
    },
    staleTime: 45_000,
    refetchInterval: 60_000,
  });

  const cards = useMemo(
    () => normalizeLegacyCards(reportQuery.data),
    [reportQuery.data],
  );
  const actionableCount = cards.filter((card) =>
    ['BUY', 'ACCUMULATE'].includes(String(card.action).toUpperCase()),
  ).length;
  const qualityValues = cards
    .map((card) => Number(card.data_quality_score))
    .filter(Number.isFinite);
  const averageQuality = qualityValues.length
    ? Math.round(
        qualityValues.reduce((total, value) => total + value, 0) /
          qualityValues.length,
      )
    : null;

  const usdtToman = useMemo(() => {
    const rial = Number(pricesQuery.data?.usdt?.lastTradePrice);
    return Number.isFinite(rial) ? Math.round(rial / 10) : null;
  }, [pricesQuery.data]);

  useEffect(() => {
    if (refreshMutation.isSuccess) {
      toast.success('درخواست به‌روزرسانی تحلیل ثبت شد.');
    }
    if (refreshMutation.isError) {
      toast.error('ثبت درخواست تحلیل تازه ناموفق بود.');
    }
  }, [refreshMutation.isError, refreshMutation.isSuccess]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: cryptoMarketKeys.report() }),
        queryClient.invalidateQueries({ queryKey: cryptoMarketKeys.prices() }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div dir="rtl" className="nv-page nv-mobile-safe">
      <AppHeader
        active="crypto"
        badge="CRYPTO"
        subtitle="تحلیل مستقل بازار رمزارز"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <section className="nv-scrollbar overflow-x-auto border-b border-[var(--nv-border)] bg-[var(--nv-panel)] px-3 py-3 sm:px-6">
        <div className="mx-auto flex min-w-max max-w-[1500px] items-center gap-3 sm:gap-5">
          <div className="flex items-center gap-2 border-l border-[var(--nv-border)] pl-4 text-xs font-black text-[var(--nv-accent)]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute h-full w-full animate-ping rounded-full bg-[var(--nv-positive)] opacity-50" />
              <span className="relative h-2.5 w-2.5 rounded-full bg-[var(--nv-positive)]" />
            </span>
            بازار زنده
          </div>
          {usdtToman ? (
            <Ticker
              label="تتر"
              value={`${usdtToman.toLocaleString('fa-IR')} تومان`}
            />
          ) : null}
          {[
            ['bitcoin', 'BTC'],
            ['ethereum', 'ETH'],
            ['solana', 'SOL'],
          ].map(([key, symbol]) => {
            const value = pricesQuery.data?.crypto?.[key];
            if (!value) return null;
            return (
              <Ticker
                key={key}
                label={symbol}
                value={`$${value.usd.toLocaleString('en-US')}`}
                change={value.usd_24h_change}
              />
            );
          })}
        </div>
      </section>

      <main className="relative mx-auto max-w-[1500px] space-y-6 px-3 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="nv-kicker flex items-center gap-2">
              <Activity className="h-4 w-4" /> مرکز تحلیل رمزارز
            </div>
            <h1 className="mt-3 text-2xl font-black leading-[1.55] text-[var(--nv-text)] sm:text-3xl">
              نمودار حرفه‌ای و فرصت‌های قابل بررسی
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--nv-muted)] sm:text-base sm:leading-8">
              کارت‌های این صفحه تحلیل بازارند، نه تخصیص سرمایه. درصد و مبلغ
              پیشنهادی فقط پس از اعمال پروفایل ریسک در سبد ترکیبی نمایش داده
              می‌شود.
            </p>
          </div>
          <Link
            href="/smart-portfolio"
            className="nv-button-primary w-full sm:w-auto"
          >
            <PieChart className="h-4 w-4" /> مشاهده سبد ترکیبی
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </section>

        <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <Kpi
            Icon={BarChart3}
            label="کارت تحلیل"
            value={cards.length.toLocaleString('fa-IR')}
          />
          <Kpi
            Icon={TrendingUp}
            label="فرصت خرید مشروط"
            value={actionableCount.toLocaleString('fa-IR')}
          />
          <Kpi
            Icon={Database}
            label="میانگین کیفیت داده"
            value={
              averageQuality === null
                ? '—'
                : `${averageQuality.toLocaleString('fa-IR')} / ۱۰۰`
            }
          />
          <Kpi
            Icon={ShieldCheck}
            label="آخرین تحلیل"
            value={formatDate(
              reportQuery.data?.portfolio?.generated_at ??
                reportQuery.data?.generated_at,
            )}
            compact
          />
        </section>

        <section className="nv-card overflow-hidden rounded-2xl p-3 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="flex items-center gap-2 text-base font-black text-[var(--nv-text)] sm:text-lg">
              <BarChart3 className="h-5 w-5 text-[var(--nv-accent)]" /> نمودار و ابزار تکنیکال
            </h2>
            <div
              dir="ltr"
              className="grid grid-cols-3 rounded-xl border border-[var(--nv-border)] bg-[var(--nv-soft)] p-1"
            >
              {(['BTC', 'ETH', 'SOL'] as const).map((asset) => (
                <button
                  key={asset}
                  type="button"
                  onClick={() => setSelectedChartAsset(asset)}
                  className={`rounded-lg px-3 py-2 text-xs font-black transition sm:px-6 ${
                    selectedChartAsset === asset
                      ? 'border border-[var(--nv-accent-border)] bg-[var(--nv-accent-soft)] text-[var(--nv-accent)]'
                      : 'text-[var(--nv-muted)] hover:text-[var(--nv-text)]'
                  }`}
                >
                  {asset}
                </button>
              ))}
            </div>
          </div>
          <CryptoProfessionalChart symbol={selectedChartAsset} />
        </section>

        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-[var(--nv-text)]">
                کارت‌های تحلیل بازار
              </h2>
              <p className="mt-1 text-sm leading-7 text-[var(--nv-muted)]">
                همه سیگنال‌های خرید، نگهداری، انتظار و عدم ورود دیده می‌شوند؛
                ریسک بالا فقط از سبد ترکیبی حذف می‌شود.
              </p>
            </div>
            <button
              type="button"
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
              className="nv-button-secondary disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshMutation.isPending ? 'animate-spin' : ''
                }`}
              />
              درخواست تحلیل تازه
            </button>
          </div>

          {reportQuery.isLoading ||
          reportQuery.data?.status === 'generating' ? (
            <div className="nv-card flex min-h-48 items-center justify-center gap-3 rounded-2xl p-8 text-sm text-[var(--nv-muted)]">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--nv-accent)]" /> در حال
              آماده‌سازی تحلیل بازار...
            </div>
          ) : reportQuery.isError ? (
            <div className="nv-status-danger rounded-2xl p-8 text-center text-sm leading-7">
              دریافت کارت‌های تحلیل ناموفق بود. اتصال بک‌اند و توکن ورود را
              بررسی کنید.
            </div>
          ) : cards.length ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {cards.map((card, index) => (
                <CryptoAnalysisCard
                  key={`${card.symbol}-${index}`}
                  card={card}
                  rank={index + 1}
                />
              ))}
            </div>
          ) : (
            <div className="nv-card rounded-2xl p-8 text-center sm:p-12">
              <BrainCircuit className="mx-auto h-9 w-9 text-[var(--nv-accent)]" />
              <h3 className="mt-4 font-black text-[var(--nv-text)]">
                هنوز کارت تحلیلی ثبت نشده است
              </h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-[var(--nv-muted)]">
                پاسخ فعلی بک‌اند هنوز فیلد «market_cards» ندارد یا تحلیل امروز
                پیش از نصب نسخه جدید ساخته شده است. پس از به‌روزرسانی بک‌اند،
                تحلیل روزانه را یک‌بار با force اجرا کنید تا همه کارت‌ها، حتی
                وقتی تخصیص سرمایه صفر است، نمایش داده شوند.
              </p>
            </div>
          )}
        </section>

        <FinancialAssistant />
      </main>
    </div>
  );
}

function Ticker({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change?: number;
}) {
  const positive = (change ?? 0) >= 0;
  return (
    <div className="flex items-center gap-2 rounded-full border border-[var(--nv-border)] bg-[var(--nv-soft)] px-3 py-1.5 text-xs">
      <span className="text-[var(--nv-muted)]">{label}</span>
      <span dir="ltr" className="nv-number font-black text-[var(--nv-text)]">
        {value}
      </span>
      {change !== undefined ? (
        <span
          dir="ltr"
          className={`nv-number flex items-center font-bold ${
            positive
              ? 'text-[var(--nv-positive)]'
              : 'text-[var(--nv-danger)]'
          }`}
        >
          {positive ? (
            <TrendingUp className="mr-1 h-3 w-3" />
          ) : (
            <TrendingDown className="mr-1 h-3 w-3" />
          )}
          {change.toFixed(2)}%
        </span>
      ) : null}
    </div>
  );
}

function Kpi({
  Icon,
  label,
  value,
  compact = false,
}: {
  Icon: typeof Activity;
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <article className="nv-card min-w-0 rounded-2xl p-3.5 sm:p-5">
      <Icon className="h-4 w-4 text-[var(--nv-accent)]" />
      <p className="mt-3 text-xs font-bold text-[var(--nv-muted)] sm:text-sm">
        {label}
      </p>
      <p
        className={`mt-1 break-words font-black text-[var(--nv-text)] ${
          compact ? 'text-xs leading-6 sm:text-sm' : 'text-base sm:text-lg'
        }`}
      >
        {value}
      </p>
    </article>
  );
}
