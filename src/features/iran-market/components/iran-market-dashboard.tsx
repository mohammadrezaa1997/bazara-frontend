'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, BrainCircuit, Loader2, Radar } from 'lucide-react';

import { iranMarketApi } from '../api/client';
import {
  useIranMarketAssets,
  useIranMarketOverview,
  useIranMarketPriceHistory,
} from '../hooks/use-iran-market';
import { iranMarketKeys } from '../api/query-keys';
import { MarketChart } from './market-chart';
import { MarketHeader } from './market-header';
import { MarketTicker } from './market-ticker';
import { MarketAnalysisCard } from './market-analysis-card';
import { StockOpportunityCard } from './stock-opportunity-card';
import { OverviewCards } from './overview-cards';
import { useCurrentSmartPortfolio } from '@/features/smart-portfolio/hooks/use-smart-portfolio';

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
  const smartPortfolioQuery = useCurrentSmartPortfolio();
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
  const featuredAnalysisQueries = useQueries({
    queries: FEATURED_SYMBOLS.map((symbol) => ({
      queryKey: iranMarketKeys.analysis(symbol),
      queryFn: () => iranMarketApi.getCompositeAnalysis(symbol),
      staleTime: 5 * 60_000,
      retry: false,
    })),
  });
  const historyQuery = useIranMarketPriceHistory({
    symbol: selectedSymbol,
    limit: 100,
  });

  const assets = useMemo(() => assetsQuery.data ?? [], [assetsQuery.data]);
  const featuredAssets = featuredAssetQueries.flatMap((query) =>
    query.data ? [query.data] : [],
  );
  const selectedAsset =
    featuredAssets.find((asset) => asset.symbol === selectedSymbol) ??
    assets.find((asset) => asset.symbol === selectedSymbol);
  const selectedAnalysis = featuredAnalysisQueries.find(
    (_, index) => FEATURED_SYMBOLS[index] === selectedSymbol,
  )?.data;
  const suggestedStocks = (smartPortfolioQuery.data?.portfolio?.items ?? []).filter(
    (item) =>
      item.market === 'iran' &&
      item.allocation_type === 'capital' &&
      item.symbol.startsWith('IR_TSE_'),
  );
  const hasFeaturedAnalysis = featuredAnalysisQueries.some(
    (query) => Boolean(query.data) || query.isLoading,
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: iranMarketKeys.all });
    } finally {
      setIsRefreshing(false);
    }
  };

  const featuredLoading = featuredAssetQueries.some((query) => query.isLoading);
  const initialLoading =
    (assetsQuery.isLoading && !assetsQuery.data) || featuredLoading;
  const hasPageError = assetsQuery.isError && !assetsQuery.data;

  return (
    <div dir="rtl" className="nv-page nv-mobile-safe">
      <MarketHeader isRefreshing={isRefreshing} onRefresh={handleRefresh} />

      {initialLoading ? (
        <div className="relative flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-9 w-9 animate-spin text-[var(--nv-accent)]" />
            <p className="mt-4 text-sm text-[var(--nv-muted)]">در حال دریافت وضعیت بازار ایران...</p>
          </div>
        </div>
      ) : hasPageError ? (
        <main className="relative mx-auto max-w-xl px-3 py-20 text-center sm:px-6 sm:py-24">
          <div className="nv-status-danger rounded-2xl p-8">
            <AlertTriangle className="mx-auto h-9 w-9" />
            <h2 className="mt-4 font-black text-[var(--nv-text)]">ارتباط با بازار ایران برقرار نشد</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--nv-muted)]">
              بک‌اند Django، توکن ورود و مقدار NEXT_PUBLIC_API_URL را بررسی کنید.
            </p>
            <button
              type="button"
              onClick={handleRefresh}
              className="nv-button-primary mt-6"
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
                <div className="nv-kicker flex items-center gap-2">
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
                className="nv-button-primary w-full sm:w-auto"
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
              <div className="nv-status-warning mt-4 rounded-xl px-4 py-3 text-sm leading-7">
                اطلاعات overview دریافت نشد؛ قیمت‌ها و نمودار همچنان قابل استفاده‌اند.
              </div>
            ) : null}

            <div className="mt-5">
              <MarketChart
                asset={selectedAsset}
                prices={historyQuery.data ?? []}
                analysis={selectedAnalysis}
                isLoading={historyQuery.isLoading || historyQuery.isFetching}
              />
            </div>

            {hasFeaturedAnalysis ? (
            <section className="mt-7">
              <div className="mb-4">
                <h2 className="text-xl font-black text-[var(--nv-text)]">
                  وضعیت تحلیلی دارایی‌های اصلی
                </h2>
                <p className="mt-1 max-w-3xl text-sm leading-7 text-[var(--nv-muted)]">
                  فقط دارایی‌هایی نمایش داده می‌شوند که تحلیل آن‌ها از بک‌اند
                  دریافت شده باشد. این بخش درصد تخصیص سرمایه نشان نمی‌دهد.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {FEATURED_SYMBOLS.flatMap((symbol, index) => {
                  const analysisQuery = featuredAnalysisQueries[index];
                  if (!analysisQuery?.data && !analysisQuery?.isLoading) return [];
                  return [
                    <MarketAnalysisCard
                      key={symbol}
                      asset={featuredAssetQueries[index]?.data}
                      analysis={analysisQuery.data}
                      isLoading={analysisQuery.isLoading}
                      selected={selectedSymbol === symbol}
                      onSelect={setSelectedSymbol}
                    />,
                  ];
                })}
              </div>
            </section>
            ) : null}

            {suggestedStocks.length ? (
              <section className="mt-8">
                <div className="mb-4">
                  <h2 className="text-xl font-black text-[var(--nv-text)]">
                    سهام منتخب برای بررسی
                  </h2>
                  <p className="mt-1 max-w-3xl text-sm leading-7 text-[var(--nv-muted)]">
                    هر سهمی که از فیلتر تحلیل و ریسک سبد ترکیبی عبور کند، اینجا
                    نیز به‌صورت کارت تحلیلی و بدون درصد تخصیص نمایش داده می‌شود.
                  </p>
                </div>
                <div className="grid gap-4 xl:grid-cols-2">
                  {suggestedStocks.map((item) => (
                    <StockOpportunityCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            ) : null}
          </main>
        </>
      )}
    </div>
  );
}
