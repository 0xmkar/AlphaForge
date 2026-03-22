// ─── Portfolio Blender ────────────────────────────────────────────────────────
//
// Takes a set of weighted strategy theses (from the LLM) and blends them
// into a single concrete PortfolioAllocation + WDKAction[].
//
// This is purely deterministic math — the LLM sets the weights and writes
// the reasoning, but the actual % numbers come from here.

import { MacroRegime, PortfolioAllocation, StrategyThesis, WDKAction, WDKAsset } from './types';

// ─── Regime → Base Target Allocation ─────────────────────────────────────────

type BaseAllocation = {
  USDT: number;
  USDT_lent: number;
  ETH: number;
  BTC: number;
  XAUT: number;
};

const REGIME_BASE_ALLOCATIONS: Record<MacroRegime, BaseAllocation> = {
  risk_on: {
    USDT: 10,
    USDT_lent: 10,
    ETH: 45,
    BTC: 30,
    XAUT: 5,
  },
  risk_off: {
    USDT: 20,
    USDT_lent: 60,
    ETH: 10,
    BTC: 5,
    XAUT: 5,
  },
  gold_hedge: {
    USDT: 15,
    USDT_lent: 30,
    ETH: 10,
    BTC: 5,
    XAUT: 40,
  },
  yield_farm: {
    USDT: 10,
    USDT_lent: 75,
    ETH: 10,
    BTC: 5,
    XAUT: 0,
  },
  neutral: {
    USDT: 30,
    USDT_lent: 40,
    ETH: 15,
    BTC: 10,
    XAUT: 5,
  },
};

// ─── Blending ─────────────────────────────────────────────────────────────────

/**
 * Blend multiple regime allocations by thesis weight.
 * Weights are normalised here so floating-point drift from the LLM doesn't matter.
 */
export function blendAllocations(theses: StrategyThesis[]): PortfolioAllocation {
  const totalWeight = theses.reduce((s, t) => s + t.weight, 0);
  if (totalWeight === 0) return { ...REGIME_BASE_ALLOCATIONS.neutral };

  const blended: BaseAllocation = { USDT: 0, USDT_lent: 0, ETH: 0, BTC: 0, XAUT: 0 };

  for (const thesis of theses) {
    const w = thesis.weight / totalWeight;
    const base = REGIME_BASE_ALLOCATIONS[thesis.regime];
    blended.USDT      += base.USDT      * w;
    blended.USDT_lent += base.USDT_lent * w;
    blended.ETH       += base.ETH       * w;
    blended.BTC       += base.BTC       * w;
    blended.XAUT      += base.XAUT      * w;
  }

  const rounded: PortfolioAllocation = {
    USDT:      Math.round(blended.USDT),
    USDT_lent: Math.round(blended.USDT_lent),
    ETH:       Math.round(blended.ETH),
    BTC:       Math.round(blended.BTC),
    XAUT:      Math.round(blended.XAUT),
  };

  // Absorb rounding drift into the most flexible bucket
  const sum = Object.values(rounded).reduce((s, v) => s + v, 0);
  if (sum !== 100) {
    rounded.USDT_lent += 100 - sum;
  }

  return rounded;
}

// ─── Action Generation ────────────────────────────────────────────────────────

/**
 * Given a target PortfolioAllocation and current holdings (expressed as portfolio %),
 * generate the ordered WDKAction[] the Execution Agent should run.
 *
 * Assumes a starting state of 100% USDT for demo purposes.
 */
export function generateActions(
  target: PortfolioAllocation,
  theses: StrategyThesis[],
  current: PortfolioAllocation = { USDT: 100, USDT_lent: 0, ETH: 0, BTC: 0, XAUT: 0 },
): WDKAction[] {
  const actions: WDKAction[] = [];

  const topThesis = [...theses].sort((a, b) => b.weight - a.weight)[0];
  const thesisReason = (asset: string): string =>
    `${topThesis.label} (weight ${(topThesis.weight * 100).toFixed(0)}%) drives ${asset} allocation`;

  // 1. Withdraw lent USDT first if swaps need liquidity
  const needsLiquidity =
    target.ETH > current.ETH ||
    target.BTC > current.BTC ||
    target.XAUT > current.XAUT;

  if (needsLiquidity && current.USDT_lent > target.USDT_lent) {
    const withdrawPct = Math.min(current.USDT_lent - target.USDT_lent, current.USDT_lent);
    if (withdrawPct > 1) {
      actions.push({
        type: 'withdraw_lend',
        asset: 'USDT',
        portfolioPct: withdrawPct,
        protocol: 'aave-evm',
        reason: 'Free up USDT liquidity for swap rebalancing',
      });
    }
  }

  // 2. Reduce oversized risk positions → convert to USDT first
  const riskAssets: Array<{ key: keyof PortfolioAllocation; asset: WDKAsset }> = [
    { key: 'ETH',  asset: 'ETH'  },
    { key: 'BTC',  asset: 'BTC'  },
    { key: 'XAUT', asset: 'XAUT' },
  ];

  for (const { key, asset } of riskAssets) {
    const delta = (current[key] as number) - target[key];
    if (delta > 2) {
      actions.push({
        type: 'swap',
        from: asset,
        to: 'USDT',
        portfolioPct: delta,
        reason: `Reduce ${asset} from ${current[key]}% → ${target[key]}% per blended regime target`,
      });
    }
  }

  // 3. Buy into underweight risk positions
  for (const { key, asset } of riskAssets) {
    const delta = target[key] - (current[key] as number);
    if (delta > 2) {
      actions.push({
        type: 'swap',
        from: 'USDT',
        to: asset,
        portfolioPct: delta,
        reason: thesisReason(asset),
      });
    }
  }

  // 4. Lend residual USDT on Aave
  const lendDelta = target.USDT_lent - current.USDT_lent;
  if (lendDelta > 2) {
    const yieldThesis = theses.find((t) => t.regime === 'risk_off' || t.regime === 'yield_farm');
    actions.push({
      type: 'lend',
      asset: 'USDT',
      portfolioPct: lendDelta,
      protocol: 'aave-evm',
      reason: `Deploy idle USDT to Aave v3 for yield — ${yieldThesis?.label ?? 'stable yield component'}`,
    });
  } else if (lendDelta < -2) {
    actions.push({
      type: 'withdraw_lend',
      asset: 'USDT',
      portfolioPct: Math.abs(lendDelta),
      protocol: 'aave-evm',
      reason: `Rebalance Aave position down to ${target.USDT_lent}% target`,
    });
  }

  // 5. If no meaningful actions, emit a hold
  if (actions.length === 0) {
    actions.push({
      type: 'hold',
      asset: 'USDT',
      portfolioPct: 100,
      reason: 'Current allocation already matches blended target — no rebalancing needed',
    });
  }

  return actions;
}
