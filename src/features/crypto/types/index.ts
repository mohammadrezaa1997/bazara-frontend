export type CryptoSignalAction = 'BUY' | 'ACCUMULATE' | 'HOLD' | 'WATCH' | 'AVOID' | 'SELL' | string;

export interface CryptoMarketCard {
  symbol: string;
  name: string;
  coin_id?: string;
  action: CryptoSignalAction;
  card_type?: 'market_analysis' | string;
  included_in_crypto_portfolio?: boolean;
  included_in_smart_portfolio?: boolean;
  portfolio_block_reason?: string;
  current_price?: number | null;
  entry_price_min?: number | null;
  entry_price_max?: number | null;
  stop_loss?: number | null;
  take_profit_targets?: number[];
  total_score?: number;
  technical_score?: number;
  momentum_score?: number;
  liquidity_score?: number;
  news_score?: number;
  psychological_fit_score?: number;
  data_quality_score?: number;
  confidence_score?: number;
  risk_score?: number;
  risk_level?: string;
  rsi?: number | null;
  volatility_percent?: number | null;
  change_24h_percent?: number | null;
  change_7d_percent?: number | null;
  selection_reason?: string;
  psychological_analysis?: string;
  entry_condition?: string;
  invalidation_condition?: string;
}

export interface LegacyCryptoPortfolioItem extends Omit<CryptoMarketCard, 'confidence_score'> {
  recommendation?: string;
  catalyst_reason?: string;
  confidence_score?: number | string;
}

export interface CryptoMarketReport {
  status?: string;
  message?: string;
  task_id?: string;
  market_cards?: CryptoMarketCard[];
  portfolio_analysis?: LegacyCryptoPortfolioItem[];
  positions?: LegacyCryptoPortfolioItem[];
  generated_at?: string;
  disclaimer?: string;
  portfolio?: {
    generated_at?: string;
    valid_until?: string | null;
    investment_horizon?: string;
    market_cards?: CryptoMarketCard[];
    generation_metadata?: {
      market_cards?: CryptoMarketCard[];
    };
  };
  portfolio_meta?: {
    next_review_at?: string | null;
    next_rebalance_at?: string | null;
    data_hold?: { active?: boolean; reason?: string } | null;
  };
}

export interface CryptoPricePoint {
  usd: number;
  usd_24h_change: number;
}

export interface CryptoPriceResponse {
  success: boolean;
  crypto?: Record<string, CryptoPricePoint>;
  usdt?: { lastTradePrice?: string | number };
}
