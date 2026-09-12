import { NextResponse } from "next/server";

interface NobitexResponse {
  lastTradePrice?: string | number;
}

interface WallexResponse {
  result?: {
    symbols?: {
      USDTTMN?: { stats?: { lastPrice?: string | number } };
    };
  };
}

interface BitpinMarket {
  code?: string;
  price?: string | number;
}

interface BitpinResponse {
  results?: BitpinMarket[];
}

interface ExchangeSource {
  name: string;
  url: string;
  getPrice: (data: unknown) => number | null;
}

interface PricePayload {
  crypto: unknown;
  usdt: { lastTradePrice: number } | null;
  updatedAt: string;
  sources: { crypto: string | null; usdt: string | null };
}

const FRESH_CACHE_MS = 60_000;
const REQUEST_TIMEOUT_MS = 6_000;
let lastGood: PricePayload | null = null;

async function fetchJson(url: string, headers: HeadersInit = {}) {
  const response = await fetch(url, {
    cache: "no-store",
    headers,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`upstream_http_${response.status}`);
  return response.json() as Promise<unknown>;
}

function isFresh(payload: PricePayload) {
  return Date.now() - Date.parse(payload.updatedAt) < FRESH_CACHE_MS;
}

function positiveNumber(value: unknown) {
  const result = Number(value);
  return Number.isFinite(result) && result > 0 ? result : null;
}

async function fetchAuthorizedRelay(): Promise<PricePayload | null> {
  const url = process.env.PRICE_UPSTREAM_PROXY_URL?.trim();
  if (!url) return null;
  try {
    const payload = (await fetchJson(url, {
      Authorization: process.env.PRICE_UPSTREAM_PROXY_TOKEN
        ? `Bearer ${process.env.PRICE_UPSTREAM_PROXY_TOKEN}`
        : "",
    })) as Partial<PricePayload>;
    if (!payload.crypto && !payload.usdt) return null;
    return {
      crypto: payload.crypto ?? null,
      usdt: payload.usdt ?? null,
      updatedAt: payload.updatedAt ?? new Date().toISOString(),
      sources: payload.sources ?? {
        crypto: "authorized-relay",
        usdt: "authorized-relay",
      },
    };
  } catch {
    return null;
  }
}

export async function GET() {
  if (lastGood && isFresh(lastGood)) {
    return NextResponse.json({
      success: true,
      ...lastGood,
      stale: false,
      cache: "memory",
    });
  }

  const relay = await fetchAuthorizedRelay();
  if (relay) {
    lastGood = relay;
    return NextResponse.json({
      success: true,
      ...relay,
      stale: false,
      cache: "relay",
    });
  }

  const coinGeckoKey = process.env.COINGECKO_API_KEY?.trim();
  const coinGeckoPro = process.env.COINGECKO_API_KEY_TYPE === "pro";
  const coinGeckoBase = coinGeckoPro
    ? "https://pro-api.coingecko.com/api/v3"
    : "https://api.coingecko.com/api/v3";
  const coinGeckoHeaders: HeadersInit = coinGeckoKey
    ? {
        [coinGeckoPro ? "x-cg-pro-api-key" : "x-cg-demo-api-key"]:
          coinGeckoKey,
      }
    : {};

  const exchanges: ExchangeSource[] = [
    {
      name: "Nobitex",
      url: "https://api.nobitex.ir/v2/orderbook/USDTIRT",
      getPrice: (data) => {
        const price = positiveNumber((data as NobitexResponse).lastTradePrice);
        return price ? Math.round(price / 10) : null;
      },
    },
    {
      name: "Wallex",
      url: "https://api.wallex.ir/v1/markets",
      getPrice: (data) =>
        positiveNumber(
          (data as WallexResponse).result?.symbols?.USDTTMN?.stats?.lastPrice,
        ),
    },
    {
      name: "Bitpin",
      url: "https://api.bitpin.ir/v1/mkt/markets/",
      getPrice: (data) => {
        const market = (data as BitpinResponse).results?.find(
          (item) => item.code === "USDT_IRT",
        );
        const price = positiveNumber(market?.price);
        return price ? Math.round(price / 10) : null;
      },
    },
  ];

  const [cryptoResult, ...exchangeResults] = await Promise.allSettled([
    fetchJson(
      `${coinGeckoBase}/simple/price?ids=bitcoin,ethereum,solana,pax-gold&vs_currencies=usd&include_24hr_change=true`,
      coinGeckoHeaders,
    ),
    ...exchanges.map((exchange) =>
      fetchJson(exchange.url, {
        Accept: "application/json",
        "User-Agent": "NeuroVest-Price-Service/2.0",
      }),
    ),
  ]);

  const crypto =
    cryptoResult.status === "fulfilled"
      ? cryptoResult.value
      : lastGood?.crypto ?? null;
  let usdtToman: number | null = null;
  let usdtSource: string | null = null;
  for (const [index, result] of exchangeResults.entries()) {
    if (result.status !== "fulfilled") continue;
    const price = exchanges[index].getPrice(result.value);
    if (price) {
      usdtToman = price;
      usdtSource = exchanges[index].name;
      break;
    }
  }

  const payload: PricePayload = {
    crypto,
    usdt: usdtToman
      ? { lastTradePrice: usdtToman * 10 }
      : lastGood?.usdt ?? null,
    updatedAt: new Date().toISOString(),
    sources: {
      crypto:
        cryptoResult.status === "fulfilled"
          ? coinGeckoPro
            ? "CoinGecko Pro"
            : "CoinGecko"
          : lastGood?.sources.crypto ?? null,
      usdt: usdtSource ?? lastGood?.sources.usdt ?? null,
    },
  };

  const hasFreshData =
    cryptoResult.status === "fulfilled" || usdtToman !== null;
  if (hasFreshData) lastGood = payload;

  if (!payload.crypto && !payload.usdt) {
    return NextResponse.json(
      {
        success: false,
        error: "all_price_sources_unreachable",
        message: "هیچ منبع قیمت یا relay مجازی از این سرور قابل دسترس نیست.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    success: true,
    ...payload,
    stale: !hasFreshData,
    cache: hasFreshData ? "upstream" : "last-good",
  });
}
