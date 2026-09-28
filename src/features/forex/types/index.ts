export type DecimalValue = number | string;

export type ForexTimeframe = "1h" | "4h" | "1day";
export type ForexDecision = "buy" | "sell" | "watch" | "no_trade";

export type ForexTrend =
  | "strong_bullish"
  | "bullish"
  | "neutral"
  | "bearish"
  | "strong_bearish"
  | "unknown";

export interface ForexOverview {
  market_open: boolean;
  active_pairs: number;
  portfolio_eligible_pairs: number;
  latest_candle_at: string | null;
  timeframes: ForexTimeframe[];
  execution_enabled: boolean;
  leverage_recommendations_enabled: boolean;
}

export interface ForexPair {
  id: number;
  symbol: string;
  display_symbol: string;
  base_currency: string;
  quote_currency: string;
  name_fa: string;
  name_en: string;
  provider: string;
  provider_display: string;
  provider_symbol: string;
  pip_size: DecimalValue;
  is_active: boolean;
  is_portfolio_eligible: boolean;
  display_order: number;
  metadata: Record<string, unknown>;
}

export interface ForexCandle {
  timestamp: string;
  timeframe: ForexTimeframe;
  open_price: DecimalValue;
  high_price: DecimalValue;
  low_price: DecimalValue;
  close_price: DecimalValue;
  volume: DecimalValue | null;
  provider: string;
}

export interface ForexHistoryResponse {
  pair: ForexPair;
  timeframe: ForexTimeframe;
  count: number;
  results: ForexCandle[];
}

export interface ForexTimeframeIndicators {
  close?: number;
  ema20?: number;
  ema50?: number;
  ema200?: number;
  rsi14?: number;
  macd_histogram?: number;
  atr14?: number;
  adx14?: number;
  support20?: number;
  resistance20?: number;
  trend?: ForexTrend;
  candles?: number;
}
export type ForexAIAdviceStatus =
  | 'ready'
  | 'unavailable';

export type ForexAIAdviceStance =
  | 'confirm'
  | 'cautious'
  | 'avoid';

export interface ForexAIAdvice {
  status: ForexAIAdviceStatus;
  stance: ForexAIAdviceStance | null;
  summary: string;
  key_risks: string[];
  confirmation_conditions: string[];
  invalidation_note: string;
  confidence_comment: string;
  model: string;
  generated_at: string | null;
  reused: boolean;
}

export interface ForexAnalysis {
  id: number;

  pair: Pick<
    ForexPair,
    | "id"
    | "symbol"
    | "display_symbol"
    | "base_currency"
    | "quote_currency"
    | "name_fa"
    | "name_en"
    | "pip_size"
  >;

  status: string;
  status_display: string;

  decision: ForexDecision;
  decision_display: string;

  d1_trend: ForexTrend;
  d1_trend_display: string;

  h4_trend: ForexTrend;
  h4_trend_display: string;

  h1_trend: ForexTrend;
  h1_trend_display: string;

  technical_score: number;
  data_quality_score: number;
  risk_score: number;
  confidence_score: number;

  entry_min: DecimalValue | null;
  entry_max: DecimalValue | null;
  stop_loss: DecimalValue | null;
  targets: DecimalValue[];
  risk_reward_ratio: DecimalValue | null;

  indicators: {
    score_components?: Record<string, number>;
    quality_components?: Record<string, number>;
    market_open?: boolean;
    atr_percent_h4?: number;

    timeframes?: Partial<
      Record<ForexTimeframe, ForexTimeframeIndicators>
    >;
  };

  reasons: string[];
  blocking_reasons: string[];

  summary: string;
  ai_summary: string;
  ai_model: string;
  ai_advice: ForexAIAdvice | null;
  analyzed_at: string;
  valid_until: string | null;
  source_candle_at: string | null;

  is_valid: boolean;
  is_trade_ready: boolean;
}

export interface ForexHistoryParams {
  symbol: string;
  timeframe: ForexTimeframe;
  limit?: number;
}