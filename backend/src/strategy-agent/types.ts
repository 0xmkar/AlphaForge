// ─── Core Signal Types ────────────────────────────────────────────────────────

export type SignalOutput = {
  market: string;
  is_relevant: boolean;
  categories: {
    crypto_direct: boolean;
    macro: boolean;
    political: boolean;
    sentiment: boolean;
    second_order: boolean;
  };
  impact_direction: 'bullish' | 'bearish' | 'neutral' | 'uncertain';
  affected_assets: string[];
  time_horizon: 'short' | 'mid' | 'long';
  reasoning: string;
  confidence: number;
  percentage_yes: number;
  percentage_no: number;
  volume: number;
  people_giving_opinion: number;
};

// ─── Strategy Layer ───────────────────────────────────────────────────────────

export type MacroRegime =
  | 'risk_on'
  | 'risk_off'
  | 'gold_hedge'
  | 'yield_farm'
  | 'neutral';

/**
 * A single strategy thesis backed by a cluster of signals.
 * Multiple of these can coexist with different weights.
 */
export type StrategyThesis = {
  id: string;
  regime: MacroRegime;
  label: string;
  weight: number;                // 0–1, sums to 1.0 across all theses
  supporting_signals: string[];  // market names that back this thesis
  ignored_signals: string[];     // market names explicitly discarded for this thesis
  confidence: number;
  reasoning: string;             // LLM-generated rationale for THIS thesis
  time_horizon: 'short' | 'mid' | 'long';
};

// ─── Execution Layer ──────────────────────────────────────────────────────────

export type WDKAsset = 'USDT' | 'ETH' | 'BTC' | 'XAUT';

export type WDKAction =
  | { type: 'swap'; from: WDKAsset; to: WDKAsset; portfolioPct: number; reason: string }
  | { type: 'lend'; asset: 'USDT'; portfolioPct: number; protocol: 'aave-evm'; reason: string }
  | { type: 'withdraw_lend'; asset: 'USDT'; portfolioPct: number; protocol: 'aave-evm'; reason: string }
  | { type: 'hold'; asset: WDKAsset; portfolioPct: number; reason: string };

/**
 * Final blended portfolio allocation — what actually goes to the Execution Agent.
 * Each asset slot shows its target % of total portfolio.
 */
export type PortfolioAllocation = {
  USDT: number;
  USDT_lent: number;
  ETH: number;
  BTC: number;
  XAUT: number;
};

// ─── Aggregate Signal Stats ───────────────────────────────────────────────────

export type SignalBreakdown = {
  total: number;
  relevant: number;
  ignored: number;
  bullish: number;
  bearish: number;
  neutral: number;
  uncertain: number;
  avgConfidence: number;
  totalVolume: number;
  affectedAssets: string[];
  categoryCounts: {
    crypto_direct: number;
    macro: number;
    political: number;
    sentiment: number;
    second_order: number;
  };
};

// ─── Final Output ─────────────────────────────────────────────────────────────

export type StrategyDecision = {
  theses: StrategyThesis[];
  dominant_regime: MacroRegime;
  portfolio_allocation: PortfolioAllocation;

  actions: WDKAction[];

  overall_confidence: number;
  time_horizon: 'short' | 'mid' | 'long';
  signal_summary: string;
  signal_breakdown: SignalBreakdown;
  ignored_signal_reasons: Record<string, string>;
  created_at: number;
};
