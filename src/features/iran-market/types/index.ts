export type DecimalValue = number | string;

export type IranMarketAssetCategory =
  | "currency"
  | "gold"
  | "coin"
  | "stock"
  | "index"
  | "fund";

export type IranMarketPriceUnit = "IRR" | "TOMAN" | "POINT" | "PERCENT";

export type IranMarketTrend =
  | "strong_bullish"
  | "bullish"
  | "neutral"
  | "bearish"
  | "strong_bearish"
  | "unknown";

export type IranMarketRecommendation =
  | "strong_buy"
  | "buy"
  | "hold"
  | "sell"
  | "strong_sell"
  | "wait";

export type AdvisorAction = "buy" | "sell" | "hold" | "avoid" | "watch";
export type RiskProfile = "conservative" | "moderate" | "aggressive";
export type InvestmentHorizon = "1_month" | "3_months" | "6_months" | "1_year";

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface IranMarketPrice {
  id?: number;
  symbol?: string;
  price: DecimalValue;
  open_price?: DecimalValue | null;
  high_price?: DecimalValue | null;
  low_price?: DecimalValue | null;
  change_percent?: DecimalValue | null;
  provider?: string;
  recorded_at: string;
}

export interface IranMarketAsset {
  id: number;
  symbol: string;
  name: string;
  english_name?: string;
  category: IranMarketAssetCategory;
  market_type?: string;
  price_unit: IranMarketPriceUnit;
  provider?: string;
  provider_symbol?: string;
  is_active?: boolean;
  is_featured?: boolean;
  display_order?: number;
  latest_price?: IranMarketPrice | null;
}

export interface TradePlan {
  entry_status?: string;
  entry_reason?: string;
  entry_min?: DecimalValue | null;
  entry_max?: DecimalValue | null;
  entry_price_min?: DecimalValue | null;
  entry_price_max?: DecimalValue | null;
  stop_loss?: DecimalValue | null;
  targets?: DecimalValue[];
  risk_reward_ratio?: DecimalValue | null;
  holding_period?: string;
}

export interface DecisionGuard {
  applied: boolean;
  reason?: string;
}

export interface CompositeDetails {
  final_score?: DecimalValue;
  confidence_score?: number;
  risk_score?: number;
  data_quality_score?: number;
  conflict_score?: number;
  decision_guard?: DecisionGuard;
  trade_plan?: TradePlan;
  components?: Record<string, unknown>;
}

export interface IranMarketAnalysis {
  id: number;
  asset: IranMarketAsset;
  trend: IranMarketTrend;
  recommendation: IranMarketRecommendation;
  risk_score: number;
  confidence_score: number;
  summary: string;
  indicators?: {
    composite?: CompositeDetails;
    [key: string]: unknown;
  };
  entry_min?: DecimalValue | null;
  entry_max?: DecimalValue | null;
  entry_price_min?: DecimalValue | null;
  entry_price_max?: DecimalValue | null;
  stop_loss?: DecimalValue | null;
  targets?: DecimalValue[];
  analyzed_at: string;
  valid_until: string;
  is_valid?: boolean;
  freshness?: {
    state: string;
    is_fresh: boolean;
    requires_refresh: boolean;
    age_seconds: number | null;
    expires_in_seconds: number | null;
  };
}

export interface IranMarketCompositeAnalysisResponse {
  analysis: IranMarketAnalysis;
  components?: Record<string, unknown>;
  decision_guard?: DecisionGuard;
  trade_plan?: TradePlan;
  data_quality_score?: number | null;
  conflict_score?: number | null;
}

export interface AdvisorHoldingInput {
  symbol: string;
  quantity: DecimalValue;
  average_buy_price: DecimalValue;
}

export interface AdvisorComponentEvidence {
  key: string;
  label: string;
  score?: DecimalValue | null;
  confidence?: DecimalValue | null;
  data_quality?: DecimalValue | null;
  sample_count?: number;
  configured_weight?: DecimalValue | null;
  signal_ids?: number[];
  evidence_items?: AdvisorNewsEvidence[];
}

export interface AdvisorNewsEvidence {
  signal_id?: number | null;
  title: string;
  url?: string | null;
  source?: string | null;
  published_at?: string | null;
  source_reliability_score?: number | null;
  direction?: string | null;
  score?: DecimalValue | null;
  impact_score?: number | null;
  confidence_score?: number | null;
  reason?: string | null;
  horizon?: string | null;
  valid_until?: string | null;
}

export interface AdvisorScenarioPlan {
  status?: string;
  scenario_type?: string;
  description?: string;
  current_price?: DecimalValue | null;
  pullback_zone?: {
    low?: DecimalValue | null;
    high?: DecimalValue | null;
  };
  breakout_above?: DecimalValue | null;
  invalidation_below?: DecimalValue | null;
  targets_after_confirmation?: DecimalValue[];
  current_risk_reward?: DecimalValue | null;
  minimum_risk_reward?: DecimalValue | null;
  mathematical_thresholds?: {
    required_entry_max?: DecimalValue | null;
    required_stop_min?: DecimalValue | null;
    note?: string | null;
  };
  requires_reanalysis?: boolean;
}

export interface AdvisorRequest {
  budget: DecimalValue;
  risk_profile: RiskProfile;
  investment_horizon?: InvestmentHorizon;
  holdings?: AdvisorHoldingInput[];
  symbols?: string[];
  max_results?: number;
}

export interface AdvisorItem {
  symbol: string;
  name: string;
  category?: IranMarketAssetCategory;
  price_unit?: IranMarketPriceUnit;
  action?: AdvisorAction;
  recommendation?: string;
  trend?: IranMarketTrend;
  reason_code?: string;
  reason?: string;
  evidence_status?:
    | "waiting_for_fresh_price"
    | "waiting_for_valid_composite"
    | string;
  evidence_note?: string | null;
  analysis_detail?: string | null;
  analysis_engine_note?: string | null;
  decision_explanation?: string | null;
  final_score?: DecimalValue | null;
  component_evidence?: AdvisorComponentEvidence[];
  scenario_plan?: AdvisorScenarioPlan;
  execution_note?: string;
  confidence_score?: number;
  risk_score?: number;
  data_quality_score?: number;
  conflict_score?: number;
  advisor_score?: DecimalValue;
  analysis_id?: number;
  analysis_model?: string;
  analysis_valid_until?: string | null;
  current_price?: DecimalValue | null;
  price_recorded_at?: string;
  price_age_minutes?: number;
  trade_plan?: {
    entry_min?: DecimalValue | null;
    entry_max?: DecimalValue | null;
    stop_loss?: DecimalValue | null;
    targets?: Array<DecimalValue | null>;
    risk_reward_ratio?: DecimalValue | null;
  };
  allocation?: {
    percent?: DecimalValue;
    amount?: DecimalValue;
    estimated_quantity?: DecimalValue;
  };
  position?: {
    quantity?: DecimalValue;
    average_buy_price?: DecimalValue;
    market_value?: DecimalValue;
    unrealized_pnl_percent?: DecimalValue;
  };
  exit_plan?: Record<string, unknown>;
  decision_guard?: DecisionGuard;
  blocking_reasons?: string[];
  watch_trigger?: {
    type?: string;
    description?: string;
    entry_min?: DecimalValue;
    entry_max?: DecimalValue;
    level?: DecimalValue;
  };
}

export interface AdvisorResponse {
  version: string;
  status: "actionable" | "no_actionable_opportunity" | string;
  generated_at: string;
  inputs: {
    budget: DecimalValue;
    risk_profile: RiskProfile;
    investment_horizon: InvestmentHorizon;
    holdings_count: number;
    requested_symbols: string[];
  };
  cycle?: {
    code: InvestmentHorizon;
    label: string;
    review_days: number;
    rebalance_days: number;
    drift_threshold_percent: number;
    generated_at: string;
    next_review_at: string;
    next_rebalance_at: string;
    event_triggers: string[];
    stale_data_policy: "freeze_new_entries" | string;
  };
  summary: {
    buy: number;
    sell: number;
    hold: number;
    avoid: number;
    watch: number;
    cash_reserve_percent: DecimalValue;
    cash_reserve_amount: DecimalValue;
    message: string;
  };
  coverage: {
    evaluated_assets: number;
    unknown_or_inactive_symbols: string[];
    note: string;
  };
  buy_recommendations: AdvisorItem[];
  sell_recommendations: AdvisorItem[];
  hold_recommendations: AdvisorItem[];
  avoid_recommendations: AdvisorItem[];
  watchlist: AdvisorItem[];
  methodology: {
    analysis_required: string;
    minimum_confidence: number;
    minimum_data_quality: number;
    maximum_risk: number;
    minimum_risk_reward: string;
    components: string[];
  };
  disclaimer: string;
}

export interface AdvisorSnapshotSummary {
  id: number;
  generated_at: string;
  expires_at?: string;
  budget: DecimalValue;
  risk_profile: RiskProfile;
  items_count?: number;
  status?: string;
}

export interface AdvisorPerformance {
  total: number;
  pending: number;
  successful: number;
  failed: number;
  expired: number;
  success_rate?: number;
  average_return_percent?: DecimalValue | null;
  by_action?: Record<string, unknown>;
}

export interface IranMarketOverview {
  assets_count?: number;
  priced_assets_count?: number;
  assets_with_price_count?: number;
  categories?: Record<string, number>;
  featured_assets?: IranMarketAsset[];
  market_status?: string;
  latest_recorded_at?: string | null;
  last_price_update?: string | null;
  data_quality_score?: number;
  ready_assets?: number;
  not_ready_assets?: number;
}

export interface IranMarketOpsHealth {
  status: string;
  version?: string;
  database?: string | boolean;
  redis?: string | boolean;
  celery?: string | boolean;
  latest_price_at?: string | null;
  checks?: Record<string, unknown>;
}

export interface AssetListParams {
  category?: IranMarketAssetCategory;
  search?: string;
  provider?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
}

export interface PriceHistoryParams {
  symbol: string;
  limit?: number;
}
