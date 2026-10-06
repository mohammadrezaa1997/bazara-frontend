'use client';

import { useMemo } from 'react';

import {
  ProfessionalMarketChart,
  type OfficialPriceLevel,
} from '@/features/charts/components/professional-market-chart';
import type { ChartCandle } from '@/features/charts/utils/chart-indicators';
import { resolveFreshness } from '@/lib/freshness';

import type {
  IranMarketAnalysis,
  IranMarketAsset,
  IranMarketPrice,
} from '../types';
import { toFiniteNumber } from '../utils/formatters';

interface MarketChartProps {
  asset?: IranMarketAsset;
  prices: IranMarketPrice[];
  analysis?: IranMarketAnalysis;
  isLoading: boolean;
}

function unitLabel(asset?: IranMarketAsset) {
  if (asset?.price_unit === 'TOMAN') return 'تومان';
  if (asset?.price_unit === 'IRR') return 'ریال';
  if (asset?.price_unit === 'POINT') return 'واحد';
  if (asset?.price_unit === 'PERCENT') return '٪';
  return '';
}

export function MarketChart({
  asset,
  prices,
  analysis,
  isLoading,
}: MarketChartProps) {
  const normalized = useMemo(() => {
    const mapped = prices
      .flatMap<{ candle: ChartCandle; hasCompleteOhlc: boolean }>((item) => {
        const close = toFiniteNumber(item.price);
        const timestamp = Date.parse(item.recorded_at);
        if (close === null || !Number.isFinite(timestamp)) return [];
        const open = toFiniteNumber(item.open_price);
        const high = toFiniteNumber(item.high_price);
        const low = toFiniteNumber(item.low_price);
        return [{
          candle: {
            timestamp: new Date(timestamp).toISOString(),
            open: open ?? close,
            high: high ?? close,
            low: low ?? close,
            close,
            volume: null,
          },
          hasCompleteOhlc: open !== null && high !== null && low !== null,
        }];
      })
      .sort(
        (first, second) =>
          Date.parse(first.candle.timestamp) - Date.parse(second.candle.timestamp),
      );
    const candles = mapped.map((item) => item.candle);
    const completeOhlc = mapped.filter((item) => item.hasCompleteOhlc).length;
    return {
      candles,
      chartType:
        candles.length > 0 && completeOhlc / candles.length >= 0.7
          ? ('candlestick' as const)
          : ('line' as const),
    };
  }, [prices]);

  const officialLevels = useMemo<OfficialPriceLevel[]>(() => {
    if (!analysis) return [];
    const freshness = resolveFreshness({
      isValid: analysis.is_valid,
      validUntil: analysis.valid_until,
      freshness: analysis.freshness,
    });
    if (!freshness.isFresh) return [];
    const tradePlan = analysis.indicators?.composite?.trade_plan;
    const entryMin = toFiniteNumber(
      analysis.entry_min ??
        analysis.entry_price_min ??
        tradePlan?.entry_min ??
        tradePlan?.entry_price_min,
    );
    const entryMax = toFiniteNumber(
      analysis.entry_max ??
        analysis.entry_price_max ??
        tradePlan?.entry_max ??
        tradePlan?.entry_price_max,
    );
    const stopLoss = toFiniteNumber(analysis.stop_loss ?? tradePlan?.stop_loss);
    const targets = analysis.targets ?? tradePlan?.targets ?? [];
    return [
      ...(entryMin === null
        ? []
        : [{ price: entryMin, title: 'ورود کمینه', color: '#22d3ee' }]),
      ...(entryMax === null
        ? []
        : [{ price: entryMax, title: 'ورود بیشینه', color: '#06b6d4' }]),
      ...(stopLoss === null
        ? []
        : [{ price: stopLoss, title: 'حد ضرر', color: '#f43f5e' }]),
      ...targets.flatMap((target, index) => {
        const price = toFiniteNumber(target);
        return price === null
          ? []
          : [{ price, title: `هدف ${index + 1}`, color: '#10b981' }];
      }),
    ];
  }, [analysis]);

  return (
    <ProfessionalMarketChart
      market="iran"
      symbol={asset?.symbol ?? 'unknown'}
      instrumentName={asset ? `${asset.name} · ${asset.symbol}` : 'بازار ایران'}
      timeframe="history"
      candles={normalized.candles}
      isLoading={isLoading}
      chartType={normalized.chartType}
      priceDigits={asset?.price_unit === 'PERCENT' ? 2 : 0}
      priceSuffix={unitLabel(asset)}
      officialLevels={officialLevels}
      dataNote={
        normalized.chartType === 'candlestick'
          ? 'کندل‌ها از مقادیر واقعی باز، بیشینه، کمینه و بسته‌شدن ثبت‌شده ساخته شده‌اند.'
          : 'منبع فعلی OHLC کامل ندارد؛ برای جلوگیری از ساخت کندل غیرواقعی، نمودار به‌صورت خط قیمت نمایش داده می‌شود.'
      }
    />
  );
}
