'use client';

import { useMemo } from 'react';
import { BarChart3, Loader2 } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { IranMarketAsset, IranMarketPrice } from '../types';
import { formatCompactPrice, formatDate, formatPrice, toFiniteNumber } from '../utils/formatters';

interface MarketChartProps {
  asset?: IranMarketAsset;
  prices: IranMarketPrice[];
  isLoading: boolean;
}

interface ChartPoint {
  timestamp: string;
  label: string;
  price: number;
}

export function MarketChart({ asset, prices, isLoading }: MarketChartProps) {
  const chartData = useMemo<ChartPoint[]>(
    () =>
      prices
        .map((item) => ({
          timestamp: item.recorded_at,
          label: formatDate(item.recorded_at),
          price: toFiniteNumber(item.price),
        }))
        .filter((item): item is ChartPoint => item.price !== null)
        .sort(
          (first, second) =>
            new Date(first.timestamp).getTime() - new Date(second.timestamp).getTime(),
        ),
    [prices],
  );

  const latest = chartData.at(-1)?.price;

  return (
    <article className="min-h-[380px] overflow-hidden rounded-[24px] border border-[var(--nv-border)] bg-[var(--nv-panel)] p-4 shadow-[var(--nv-shadow)] sm:min-h-[430px] sm:rounded-[30px] sm:p-7">
      <div className="flex flex-col gap-4 min-[390px]:flex-row min-[390px]:items-start min-[390px]:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-300">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-[var(--nv-text)] sm:text-lg">روند قیمت و تاریخچه بازار</h2>
            <p className="mt-1 break-all text-xs text-[var(--nv-muted)]">
              {asset ? `${asset.name} · ${asset.symbol}` : 'یک دارایی انتخاب کنید'}
            </p>
          </div>
        </div>
        <div className="text-right min-[390px]:text-left">
          <p className="text-xs text-[var(--nv-muted)]">آخرین قیمت ثبت‌شده</p>
          <p className="mt-1 text-lg font-black text-[var(--nv-text)]">{formatPrice(latest)}</p>
        </div>
      </div>

      <div className="mt-6 h-[260px] w-full sm:mt-8 sm:h-[310px]">
        {isLoading ? (
          <div className="flex h-full items-center justify-center gap-3 text-sm text-cyan-300">
            <Loader2 className="h-5 w-5 animate-spin" />
            دریافت تاریخچه قیمت...
          </div>
        ) : chartData.length < 2 ? (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--nv-border-strong)] bg-[var(--nv-soft)] px-4 text-center">
            <BarChart3 className="h-8 w-8 text-[var(--nv-faint)]" />
            <p className="mt-3 text-sm font-bold text-[var(--nv-text-soft)]">داده کافی برای رسم نمودار وجود ندارد</p>
            <p className="mt-1 text-xs text-[var(--nv-muted)]">حداقل دو رکورد قیمت لازم است.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 5, left: 5, bottom: 0 }}>
              <defs>
                <linearGradient id="iranMarketPriceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.34} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--nv-chart-grid)" vertical={false} />
              <XAxis
                dataKey="label"
                minTickGap={45}
                tick={{ fill: '#64748b', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={['auto', 'auto']}
                tickFormatter={formatCompactPrice}
                tick={{ fill: '#64748b', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={58}
              />
              <Tooltip
                formatter={(value) => [formatPrice(value as number), 'قیمت']}
                contentStyle={{
                  background: 'var(--nv-chart-tooltip)',
                  border: '1px solid var(--nv-border)',
                  borderRadius: '14px',
                  color: 'var(--nv-text)',
                  direction: 'rtl',
                }}
                labelStyle={{ color: '#94a3b8', marginBottom: 6 }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#22d3ee"
                strokeWidth={2.5}
                fill="url(#iranMarketPriceFill)"
                activeDot={{ r: 5, fill: '#22d3ee', stroke: '#071018', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </article>
  );
}
