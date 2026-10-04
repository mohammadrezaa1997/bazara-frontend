'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';

import { ProfessionalMarketChart } from '@/features/charts/components/professional-market-chart';
import type { ChartCandle } from '@/features/charts/utils/chart-indicators';

type CryptoTimeframe = '4h' | '1day';

interface CryptoHistoryResponse {
  symbol: string;
  timeframe: CryptoTimeframe;
  source: string;
  approximation: string;
  candles: ChartCandle[];
}

const names: Record<string, string> = {
  BTC: 'Bitcoin (BTC)',
  ETH: 'Ethereum (ETH)',
  SOL: 'Solana (SOL)',
};

async function fetchCryptoHistory(
  symbol: string,
  timeframe: CryptoTimeframe,
): Promise<CryptoHistoryResponse> {
  const response = await fetch(
    `/api/crypto/history?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}`,
    { cache: 'no-store' },
  );
  if (!response.ok) throw new Error(`history_http_${response.status}`);
  return response.json() as Promise<CryptoHistoryResponse>;
}

export function CryptoProfessionalChart({ symbol }: { symbol: 'BTC' | 'ETH' | 'SOL' }) {
  const [timeframe, setTimeframe] = useState<CryptoTimeframe>('4h');
  const historyQuery = useQuery({
    queryKey: ['crypto-chart-history', symbol, timeframe],
    queryFn: () => fetchCryptoHistory(symbol, timeframe),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  return (
    <section>
      <div className="mb-3 flex justify-end">
        <div className="nv-toolbar flex rounded-xl p-1">
          {([
            ['4h', '۴ ساعته'],
            ['1day', 'روزانه'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTimeframe(value)}
              className={`rounded-lg px-3 py-2 text-xs font-bold ${
                timeframe === value
                  ? 'border border-[var(--nv-accent-border)] bg-[var(--nv-accent-soft)] text-[var(--nv-accent)]'
                  : 'text-[var(--nv-muted)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {historyQuery.isError ? (
        <div className="nv-status-warning mb-3 flex items-start gap-2 rounded-2xl p-4 text-xs leading-6">
          <AlertTriangle className="mt-1 h-4 w-4 shrink-0" />
          تاریخچه واقعی رمزارز دریافت نشد. نمودار ساختگی نمایش داده نمی‌شود؛ اتصال
          CoinGecko یا CRYPTO_HISTORY_UPSTREAM_PROXY_URL را بررسی کنید.
        </div>
      ) : null}

      <ProfessionalMarketChart
        market="crypto"
        symbol={symbol}
        instrumentName={names[symbol] ?? symbol}
        timeframe={timeframe}
        candles={historyQuery.data?.candles ?? []}
        isLoading={historyQuery.isLoading || historyQuery.isFetching}
        chartType="candlestick"
        priceDigits={symbol === 'SOL' ? 3 : 2}
        priceSuffix="USD"
        dataNote={historyQuery.data?.approximation}
      />
    </section>
  );
}
