export type DecimalValue = number | string;
export type PortfolioMarket = 'iran' | 'crypto' | 'forex';
export type AllocationType = 'capital' | 'risk_budget';

export interface MarketAllocation {
  market: PortfolioMarket | 'cash';
  type: AllocationType;
  allocation_percent?: DecimalValue;
  amount_toman?: DecimalValue;
  risk_percent?: DecimalValue;
  risk_amount_toman?: DecimalValue;
}

export interface SmartPortfolioItem {
  id: number;
  rank: number;
  market: PortfolioMarket;
  market_label: string;
  allocation_type: AllocationType;
  allocation_type_label: string;
  symbol: string;
  display_symbol: string;
  name: string;
  action: string;
  allocation_percent: DecimalValue;
  allocated_amount_toman: DecimalValue;
  risk_percent: DecimalValue;
  risk_amount_toman: DecimalValue;
  native_currency: string;
  current_price_native: DecimalValue | null;
  conversion_rate_toman: DecimalValue | null;
  reference_price_toman: DecimalValue | null;
  suggested_quantity: DecimalValue | null;
  entry_min: DecimalValue | null;
  entry_max: DecimalValue | null;
  stop_loss: DecimalValue | null;
  targets: DecimalValue[];
  confidence_score: DecimalValue;
  data_quality_score: DecimalValue;
  risk_score: DecimalValue;
  psychological_fit_score: DecimalValue;
  rationale: string;
  warnings: string[];
  valid_until: string | null;
}

export interface SmartPortfolio {
  id: number;
  status: string;
  is_valid: boolean;
  currency: { code: 'TOMAN'; label: string };
  budget_toman: DecimalValue;
  risk_profile: string;
  risk_profile_label: string;
  psychological_risk_score: DecimalValue;
  investment_horizon: string;
  profile_summary: {
    risk_profile: string;
    risk_profile_label: string;
    risk_score: DecimalValue;
    raw_risk_score?: DecimalValue | null;
    effective_risk_score?: DecimalValue | null;
    behavioral_score?: DecimalValue | null;
    consistency_score?: DecimalValue | null;
    max_drawdown_percent?: DecimalValue | null;
    archetype?: {
      code?: string;
      title?: string;
      summary?: string;
    } | null;
    investment_horizon: string;
  };
  cash_reserve_percent: DecimalValue;
  cash_reserve_amount_toman: DecimalValue;
  invested_percent: DecimalValue;
  invested_amount_toman: DecimalValue;
  forex_risk_percent: DecimalValue;
  forex_risk_amount_toman: DecimalValue;
  overall_risk_score: DecimalValue;
  summary: string;
  market_allocations: MarketAllocation[];
  generation_version: string;
  generated_at: string;
  valid_until: string;
  items: SmartPortfolioItem[];
}

export interface CurrentSmartPortfolioResponse {
  has_portfolio: boolean;
  portfolio?: SmartPortfolio;
  detail?: string;
}

export interface GenerateSmartPortfolioResponse {
  reused: boolean;
  portfolio: SmartPortfolio;
}
