import { NextRequest, NextResponse } from 'next/server';

interface CoinGeckoMarketChart {
  prices?: Array<[number, number]>;
  total_volumes?: Array<[number, number]>;
}

interface CryptoHistoryCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
}

interface CryptoHistoryPayload {
  symbol: string;
  timeframe: '4h' | '1day';
  source: string;
  updated_at: string;
  approximation: string;
  candles: CryptoHistoryCandle[];
}

const SYMBOL_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
};
const CACHE_TTL_MS = 30 * 60_000;
const REQUEST_TIMEOUT_MS = 10_000;
const memoryCache = new Map<
  string,
  { expiresAt: number; payload: CryptoHistoryPayload }
>();

async function fetchJson(url: string, headers: HeadersInit = {}) {
  const response = await fetch(url, {
    headers,
    next: { revalidate: 1800 },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`upstream_http_${response.status}`);
  return response.json() as Promise<unknown>;
}

function aggregateCandles(
  payload: CoinGeckoMarketChart,
  timeframe: '4h' | '1day',
) {
  const bucketMs = timeframe === '4h' ? 4 * 60 * 60_000 : 24 * 60 * 60_000;
  const volumes = new Map(
    (payload.total_volumes ?? []).map(([timestamp, volume]) => [timestamp, volume]),
  );
  const buckets = new Map<
    number,
    { open: number; high: number; low: number; close: number; volume: number | null }
  >();

  for (const [timestamp, price] of payload.prices ?? []) {
    if (!Number.isFinite(timestamp) || !Number.isFinite(price) || price <= 0) continue;
    const bucket = Math.floor(timestamp / bucketMs) * bucketMs;
    const current = buckets.get(bucket);
    if (!current) {
      buckets.set(bucket, {
        open: price,
        high: price,
        low: price,
        close: price,
        volume: volumes.get(timestamp) ?? null,
      });
      continue;
    }
    current.high = Math.max(current.high, price);
    current.low = Math.min(current.low, price);
    current.close = price;
    current.volume = volumes.get(timestamp) ?? current.volume;
  }

  return [...buckets.entries()]
    .sort(([first], [second]) => first - second)
    .slice(-500)
    .map(([timestamp, candle]) => ({
      timestamp: new Date(timestamp).toISOString(),
      ...candle,
    }));
}

async function fetchRelay(
  symbol: string,
  timeframe: '4h' | '1day',
): Promise<CryptoHistoryPayload | null> {
  const relayUrl = process.env.CRYPTO_HISTORY_UPSTREAM_PROXY_URL?.trim();
  if (!relayUrl) return null;
  const url = new URL(relayUrl);
  url.searchParams.set('symbol', symbol);
  url.searchParams.set('timeframe', timeframe);
  try {
    const payload = (await fetchJson(url.toString(), {
      Authorization: process.env.PRICE_UPSTREAM_PROXY_TOKEN
        ? `Bearer ${process.env.PRICE_UPSTREAM_PROXY_TOKEN}`
        : '',
    })) as CryptoHistoryPayload;
    return Array.isArray(payload.candles) ? payload : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const symbol = (request.nextUrl.searchParams.get('symbol') ?? 'BTC').toUpperCase();
  const requestedTimeframe = request.nextUrl.searchParams.get('timeframe');
  const timeframe = requestedTimeframe === '1day' ? '1day' : '4h';
  const coinId = SYMBOL_IDS[symbol];
  if (!coinId) {
    return NextResponse.json({ error: 'unsupported_symbol' }, { status: 400 });
  }

  const cacheKey = `${symbol}:${timeframe}`;
  const cached = memoryCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ ...cached.payload, cache: 'memory' });
  }

  const relay = await fetchRelay(symbol, timeframe);
  if (relay) {
    memoryCache.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      payload: relay,
    });
    return NextResponse.json({ ...relay, cache: 'relay' });
  }

  const apiKey = process.env.COINGECKO_API_KEY?.trim();
  const isPro = process.env.COINGECKO_API_KEY_TYPE === 'pro';
  const baseUrl = isPro
    ? 'https://pro-api.coingecko.com/api/v3'
    : 'https://api.coingecko.com/api/v3';
  const headers: HeadersInit = apiKey
    ? { [isPro ? 'x-cg-pro-api-key' : 'x-cg-demo-api-key']: apiKey }
    : {};

  try {
    const source = (await fetchJson(
      `${baseUrl}/coins/${coinId}/market_chart?vs_currency=usd&days=90&interval=hourly`,
      headers,
    )) as CoinGeckoMarketChart;
    const candles = aggregateCandles(source, timeframe);
    if (candles.length < 2) throw new Error('insufficient_history');
    const payload: CryptoHistoryPayload = {
      symbol,
      timeframe,
      source: isPro ? 'CoinGecko Pro' : 'CoinGecko',
      updated_at: new Date().toISOString(),
      approximation:
        'OHLC از نمونه‌های ساعتی واقعی CoinGecko در بازه انتخابی تجمیع شده است.',
      candles,
    };
    memoryCache.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      payload,
    });
    return NextResponse.json({ ...payload, cache: 'upstream' });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'crypto_history_unavailable',
        message: error instanceof Error ? error.message : 'unknown_error',
      },
      { status: 502 },
    );
  }
}
