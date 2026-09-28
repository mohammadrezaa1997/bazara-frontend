export interface ChartCandle {
  timestamp: string;
  open: number | string;
  high: number | string;
  low: number | string;
  close: number | string;
  volume?: number | string | null;
}

export interface TechnicalPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema20: number;
  ema50: number;
  ema200: number;
  rsi14: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  atr14: number;
  support20: number | null;
  resistance20: number | null;
}

function finiteNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function ema(values: number[], period: number): number[] {
  if (!values.length) return [];
  const alpha = 2 / (period + 1);
  const result = [values[0]];
  for (let index = 1; index < values.length; index += 1) {
    result.push(alpha * values[index] + (1 - alpha) * result[index - 1]);
  }
  return result;
}

function wilder(values: number[], period: number): number[] {
  if (!values.length) return [];
  const alpha = 1 / period;
  const result = [values[0]];
  for (let index = 1; index < values.length; index += 1) {
    result.push(alpha * values[index] + (1 - alpha) * result[index - 1]);
  }
  return result;
}

function rollingPrior(values: number[], period: number, mode: 'min' | 'max') {
  return values.map((_, index) => {
    const start = index - period;
    if (start < 0) return null;
    const window = values.slice(start, index);
    return mode === 'min' ? Math.min(...window) : Math.max(...window);
  });
}

export function buildTechnicalPoints(candles: ChartCandle[]): TechnicalPoint[] {
  const normalized = candles
    .map((candle) => {
      const open = finiteNumber(candle.open);
      const high = finiteNumber(candle.high);
      const low = finiteNumber(candle.low);
      const close = finiteNumber(candle.close);
      const volume = finiteNumber(candle.volume) ?? 0;
      const timestamp = Date.parse(candle.timestamp);
      if (
        open === null ||
        high === null ||
        low === null ||
        close === null ||
        !Number.isFinite(timestamp)
      ) {
        return null;
      }
      return {
        time: Math.floor(timestamp / 1000),
        open,
        high,
        low,
        close,
        volume,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((first, second) => first.time - second.time)
    .filter((item, index, source) => index === 0 || source[index - 1].time !== item.time);

  if (!normalized.length) return [];

  const closes = normalized.map((item) => item.close);
  const highs = normalized.map((item) => item.high);
  const lows = normalized.map((item) => item.low);
  const ema20 = ema(closes, 20);
  const ema50 = ema(closes, 50);
  const ema200 = ema(closes, 200);
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macd = closes.map((_, index) => ema12[index] - ema26[index]);
  const macdSignal = ema(macd, 9);

  const gains = closes.map((close, index) =>
    index === 0 ? 0 : Math.max(close - closes[index - 1], 0),
  );
  const losses = closes.map((close, index) =>
    index === 0 ? 0 : Math.max(closes[index - 1] - close, 0),
  );
  const averageGains = wilder(gains, 14);
  const averageLosses = wilder(losses, 14);
  const rsi14 = closes.map((_, index) => {
    if (averageLosses[index] === 0) return 50;
    const relativeStrength = averageGains[index] / averageLosses[index];
    return 100 - 100 / (1 + relativeStrength);
  });

  const trueRanges = normalized.map((item, index) => {
    if (index === 0) return item.high - item.low;
    const previousClose = normalized[index - 1].close;
    return Math.max(
      item.high - item.low,
      Math.abs(item.high - previousClose),
      Math.abs(item.low - previousClose),
    );
  });
  const atr14 = wilder(trueRanges, 14);
  const support20 = rollingPrior(lows, 20, 'min');
  const resistance20 = rollingPrior(highs, 20, 'max');

  return normalized.map((item, index) => ({
    ...item,
    ema20: ema20[index],
    ema50: ema50[index],
    ema200: ema200[index],
    rsi14: rsi14[index],
    macd: macd[index],
    macdSignal: macdSignal[index],
    macdHistogram: macd[index] - macdSignal[index],
    atr14: atr14[index],
    support20: support20[index],
    resistance20: resistance20[index],
  }));
}

export function formatChartPrice(value: number | string | null | undefined) {
  const number = finiteNumber(value);
  if (number === null) return '—';
  const digits = Math.abs(number) >= 100 ? 2 : Math.abs(number) >= 10 ? 3 : 5;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(number);
}
