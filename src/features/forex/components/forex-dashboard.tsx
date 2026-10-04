'use client';

import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Clock3,
  Database,
  Loader2,
  Radio,
  ShieldCheck,
} from 'lucide-react';

import { forexKeys } from '../api/query-keys';
import {
  useForexAnalysis,
  useForexHistory,
  useForexOverview,
  useForexPairs,
} from '../hooks/use-forex';
import type { ForexTimeframe } from '../types';
import { AnalysisPanel } from './analysis-panel';
import { ForexHeader } from './forex-header';
import { TechnicalChart } from './technical-chart';
import { AIAdviceCard } from './ai-advice-card';
const timeframes: Array<{
  value: ForexTimeframe;
  label: string;
}> = [
  { value: '1h', label: '۱ ساعته' },
  { value: '4h', label: '۴ ساعته' },
  { value: '1day', label: 'روزانه' },
];

function formatDate(value?: string | null) {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function ForexDashboard() {
  const queryClient = useQueryClient();

  const [selectedSymbol, setSelectedSymbol] =
    useState('EUR_USD');

  const [timeframe, setTimeframe] =
    useState<ForexTimeframe>('1h');

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const overviewQuery = useForexOverview();
  const pairsQuery = useForexPairs();

  const historyQuery = useForexHistory({
    symbol: selectedSymbol,
    timeframe,
    limit: 500,
  });

  const analysisQuery =
    useForexAnalysis(selectedSymbol);

  const pairs = useMemo(
    () => pairsQuery.data ?? [],
    [pairsQuery.data],
  );

  const selectedPair = pairs.find(
    (pair) => pair.symbol === selectedSymbol,
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      await queryClient.invalidateQueries({
        queryKey: forexKeys.all,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const loading =
    pairsQuery.isLoading && !pairsQuery.data;

  const pageError =
    pairsQuery.isError && !pairsQuery.data;

  return (
    <div
      dir="rtl"
      className="nv-page nv-mobile-safe text-[var(--nv-text)]"
    >
      <ForexHeader
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />

      {loading ? (
        <div className="relative flex min-h-[70vh] items-center justify-center gap-3 text-sm text-[var(--nv-accent)]">
          <Loader2 className="h-6 w-6 animate-spin" />
          دریافت بازار فارکس...
        </div>
      ) : pageError ? (
        <main className="relative mx-auto max-w-xl px-4 py-24 text-center">
          <div className="nv-status-danger rounded-2xl p-8">
            <AlertTriangle className="mx-auto h-9 w-9" />

            <h2 className="mt-4 font-black">
              ارتباط با سرویس فارکس برقرار نشد
            </h2>

            <p className="mt-2 text-sm leading-7 text-[var(--nv-muted)]">
              Django، توکن ورود و NEXT_PUBLIC_API_URL را
              بررسی کنید.
            </p>
          </div>
        </main>
      ) : (
        <main className="relative mx-auto max-w-[1500px] px-3 py-6 sm:px-6 lg:px-10 lg:py-10">
          <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="nv-kicker flex items-center gap-2">
                <Radio className="h-4 w-4" />
                مرکز تحلیل تکنیکال فارکس
              </div>

              <h2 className="mt-3 text-2xl font-black sm:text-3xl">
                نمودار، اندیکاتور و برنامه مدیریت ریسک
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-8 text-[var(--nv-muted)] sm:text-base">
                کندل‌ها از پایگاه داده BAZARA خوانده می‌شوند
                و تصمیم نهایی با هم‌راستایی چندتایم‌فریمی
                صادر می‌شود.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <select
                value={selectedSymbol}
                onChange={(event) =>
                  setSelectedSymbol(event.target.value)
                }
                className="nv-field min-h-12 w-full rounded-xl px-4 text-sm font-bold sm:w-auto"
              >
                {pairs.map((pair) => (
                  <option
                    key={pair.symbol}
                    value={pair.symbol}
                  >
                    {pair.display_symbol} — {pair.name_fa}
                  </option>
                ))}
              </select>

              <div className="nv-toolbar grid grid-cols-3 rounded-xl p-1">
                {timeframes.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() =>
                      setTimeframe(item.value)
                    }
                    className={`min-w-max rounded-lg border px-3 py-2.5 text-xs font-extrabold transition ${
                      timeframe === item.value
                        ? 'border-[var(--nv-accent-border)] bg-[var(--nv-accent-soft)] text-[var(--nv-accent)]'
                        : 'border-transparent text-[var(--nv-muted)] hover:bg-[var(--nv-panel)] hover:text-[var(--nv-text)]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              {
                Icon: Database,
                label: 'جفت‌ارز فعال',
                value:
                  overviewQuery.data?.active_pairs ??
                  pairs.length,
              },
              {
                Icon: ShieldCheck,
                label: 'قابل ارزیابی',
                value:
                  overviewQuery.data
                    ?.portfolio_eligible_pairs ?? '—',
              },
              {
                Icon: Radio,
                label: 'وضعیت بازار',
                value: overviewQuery.data?.market_open
                  ? 'باز'
                  : 'بسته',
              },
              {
                Icon: Clock3,
                label: 'آخرین کندل',
                value: formatDate(
                  overviewQuery.data?.latest_candle_at,
                ),
              },
            ].map(
              ({
                Icon: CardIcon,
                label,
                value,
              }) => (
                <div
                  key={label}
                  className="nv-card rounded-2xl p-4"
                >
                  <CardIcon className="h-4 w-4 text-[var(--nv-accent)]" />

                  <p className="mt-3 text-xs text-[var(--nv-muted)]">
                    {label}
                  </p>

                  <p className="mt-1 break-words text-sm font-black text-[var(--nv-text)] sm:text-base">
                    {String(value)}
                  </p>
                </div>
              ),
            )}
          </section>

          <div className="mt-6 grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
            <TechnicalChart
              pair={selectedPair}
              candles={historyQuery.data?.results ?? []}
              analysis={analysisQuery.data}
              timeframe={timeframe}
              isLoading={
                historyQuery.isLoading ||
                historyQuery.isFetching
              }
            />

            <AnalysisPanel
              analysis={analysisQuery.data}
              timeframe={timeframe}
              isLoading={analysisQuery.isLoading}
            />
          </div>
          <div className="mt-5">
            <AIAdviceCard
              advice={analysisQuery.data?.ai_advice}
              pairName={selectedPair?.display_symbol}
              isLoading={analysisQuery.isLoading || analysisQuery.isFetching}
            />
          </div>
        </main>
      )}
    </div>
  );
}
