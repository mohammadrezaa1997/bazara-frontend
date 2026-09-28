'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, BrainCircuit, Loader2, Radar } from 'lucide-react';

import { iranMarketApi } from '../api/client';
import {
  useCompositeAnalysis,
  useIranMarketAssets,
  useIranMarketOverview,
  useIranMarketPriceHistory,
} from '../hooks/use-iran-market';
import { iranMarketKeys } from '../api/query-keys';
import { MarketChart } from './market-chart';
import { MarketHeader } from './market-header';
import { MarketTicker } from './market-ticker';
import { OverviewCards } from './overview-cards';

const FEATURED_SYMBOLS = [
  'IR_USD',
  'IR_EUR',
  'IR_GOLD_18K',
  'IR_COIN_EMAMI',
  'IR_TSE_INDEX',
];

export function IranMarketDashboard() {
  const queryClient = useQueryClient();
  const [selectedSymbol, setSelectedSymbol] = useState('IR_GOLD_18K');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const assetsQuery = useIranMarketAssets({ limit: 100 });
  const overviewQuery = useIranMarketOverview();
  const featuredAssetQueries = useQueries({
    queries: FEATURED_SYMBOLS.map((symbol) => ({
      queryKey: iranMarketKeys.asset(symbol),
      queryFn: () => iranMarketApi.getAsset(symbol),
      staleTime: 60_000,
      refetchInterval: 60_000,
      refetchIntervalInBackground: false,
      retry: 1,
    })),
  });
  const historyQuery = useIranMarketPriceHistory({
    symbol: selectedSymbol,
    limit: 100,
  });
  const analysisQuery = useCompositeAnalysis(selectedSymbol);

  const assets = useMemo(() => assetsQuery.data ?? [], [assetsQuery.data]);
  const featuredAssets = featuredAssetQueries.flatMap((query) =>
    query.data ? [query.data] : [],
  );
  const selectedAsset =
    featuredAssets.find((asset) => asset.symbol === selectedSymbol) ??
    assets.find((asset) => asset.symbol === selectedSymbol);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: iranMarketKeys.assets() }),
        queryClient.invalidateQueries({ queryKey: iranMarketKeys.overview() }),
        queryClient.invalidateQueries({ queryKey: iranMarketKeys.prices() }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const featuredLoading = featuredAssetQueries.some((query) => query.isLoading);
  const initialLoading =
    (assetsQuery.isLoading && !assetsQuery.data) || featuredLoading;
  const hasPageError = assetsQuery.isError && !assetsQuery.data;

  return (
    <div dir="rtl" className="nv-page">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-cyan-500/[0.055] blur-3xl" />
        <div className="absolute -left-44 top-1/3 h-[430px] w-[430px] rounded-full bg-blue-600/[0.045] blur-3xl" />
      </div>

      <MarketHeader isRefreshing={isRefreshing} onRefresh={handleRefresh} />

      {initialLoading ? (
        <div className="relative flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-9 w-9 animate-spin text-cyan-300" />
            <p className="mt-4 text-sm text-[var(--nv-muted)]">در حال دریافت وضعیت بازار ایران...</p>
          </div>
        </div>
      ) : hasPageError ? (
        <main className="relative mx-auto max-w-xl px-3 py-20 text-center sm:px-6 sm:py-24">
          <div className="rounded-3xl border border-rose-400/20 bg-rose-400/[0.06] p-8">
            <AlertTriangle className="mx-auto h-9 w-9 text-rose-300" />
            <h2 className="mt-4 font-black text-[var(--nv-text)]">ارتباط با بازار ایران برقرار نشد</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--nv-muted)]">
              بک‌اند Django، توکن ورود و مقدار NEXT_PUBLIC_API_URL را بررسی کنید.
            </p>
            <button
              type="button"
              onClick={handleRefresh}
              className="mt-6 rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-black text-slate-950"
            >
              تلاش دوباره
            </button>
          </div>
        </main>
      ) : (
        <>
          <MarketTicker
            assets={featuredAssets}
            selectedSymbol={selectedSymbol}
            onSelect={setSelectedSymbol}
          />

          <main className="relative mx-auto max-w-[1440px] px-3 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
            <div className="mb-6 flex flex-col gap-5 sm:mb-7 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-600 dark:text-cyan-300">
                  <Radar className="h-4 w-4" />
                  مرکز پایش بازار ایران
                </div>
                <h2 className="mt-3 text-[1.65rem] font-black leading-[1.6] tracking-tight text-[var(--nv-text)] sm:text-3xl">
                  تصویر زنده بازار
                </h2>
                <p className="mt-2 max-w-2xl text-[15px] leading-8 text-[var(--nv-muted)] sm:text-base">
                  قیمت، تاریخچه و آمادگی داده مستقیماً از سرویس ایران‌مارکت دریافت می‌شود.
                  تصمیم نهایی در مرحله مشاور با تحلیل تکنیکال، اخبار و متغیرهای کلان ترکیب خواهد شد.
                </p>
              </div>
              <Link
                href="/iran-market/advisor"
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-5 py-3 text-sm font-black text-cyan-700 transition hover:bg-cyan-500/15 sm:w-auto dark:text-cyan-200"
              >
                <BrainCircuit className="h-4 w-4" />
                ورود به مشاور هوشمند
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>

            <OverviewCards
              overview={overviewQuery.data}
              displayedAssets={assets.length}
            />

            {overviewQuery.isError ? (
              <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.07] px-4 py-3 text-sm leading-7 text-amber-800 dark:text-amber-200">
                اطلاعات overview دریافت نشد؛ قیمت‌ها و نمودار همچنان قابل استفاده‌اند.
              </div>
            ) : null}

            <div className="mt-5">
              <MarketChart
                asset={selectedAsset}
                prices={historyQuery.data ?? []}
                analysis={analysisQuery.data}
                isLoading={historyQuery.isLoading || historyQuery.isFetching}
              />
            </div>
          </main>
        </>
      )}
    </div>
  );
}
