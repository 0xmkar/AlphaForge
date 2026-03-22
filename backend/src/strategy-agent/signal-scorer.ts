// ─── Signal Scorer ────────────────────────────────────────────────────────────
//
// Pre-processes raw SignalOutput[] before the LLM sees them.
// Deterministically filters noise, scores quality, and produces a
// clean breakdown. The LLM then reasons *on top of* this — not instead of it.

import { SignalOutput, SignalBreakdown } from './types';

export type ScoredSignal = SignalOutput & {
  score: number;            // composite quality score: confidence × log(volume+1) × respondent_weight
  discard_reason?: string;  // if set, this signal should be ignored
};

// Thresholds for discard decisions
const DISCARD_RULES = {
  minConfidence: 0.45,       // below this → too uncertain
  minVolume: 500,            // below this → thin market, unreliable
  minPeople: 10,             // below this → anecdotal
  maxConflictSpread: 0.08,   // if |yes% - 50%| < 8% → market is a coin flip
  extremeProbabilityEdge: 10, // if yes% < 10% or > 90%, market is NOT uncertain — LLM mislabeled
};

/**
 * Score a single signal for quality. Higher = more trustworthy.
 * Formula: confidence × log10(volume+1) × clamp(people/100, 0.5, 2.0)
 */
export function scoreSignal(s: SignalOutput): number {
  const volumeWeight = Math.log10(s.volume + 1);
  const respondentWeight = Math.min(Math.max(s.people_giving_opinion / 100, 0.5), 2.0);
  return s.confidence * volumeWeight * respondentWeight;
}

/**
 * Check if a signal should be discarded before strategy reasoning.
 * Returns a discard reason string if yes, undefined if the signal is usable.
 */
export function getDiscardReason(s: SignalOutput): string | undefined {
  if (!s.is_relevant) return 'not_relevant: signal agent marked irrelevant';
  if (s.confidence < DISCARD_RULES.minConfidence)
    return `low_confidence: ${(s.confidence * 100).toFixed(0)}% < ${DISCARD_RULES.minConfidence * 100}% threshold`;
  if (s.volume < DISCARD_RULES.minVolume)
    return `thin_market: $${s.volume} volume < $${DISCARD_RULES.minVolume} minimum`;
  if (s.people_giving_opinion < DISCARD_RULES.minPeople)
    return `anecdotal: ${s.people_giving_opinion} respondents < ${DISCARD_RULES.minPeople} minimum`;

  const spread = Math.abs(s.percentage_yes - 50);
  if (spread < DISCARD_RULES.maxConflictSpread * 100)
    return `coin_flip: market is ${s.percentage_yes}%/${s.percentage_no}% — no directional edge`;

  // Catch LLM direction-mismatch: when the market probability is extreme (near-certain YES or
  // near-certain NO), the outcome is NOT uncertain — the signal agent mislabeled it.
  // e.g. percentage_yes=1%, impact_direction="uncertain" → contradiction; discard.
  const isExtremeProb =
    s.percentage_yes < DISCARD_RULES.extremeProbabilityEdge ||
    s.percentage_yes > 100 - DISCARD_RULES.extremeProbabilityEdge;
  if (isExtremeProb && s.impact_direction === 'uncertain')
    return `direction_mismatch: market is ${s.percentage_yes}%/${s.percentage_no}% (near-certain outcome) but LLM labeled uncertain — signal agent misread probability`;

  return undefined;
}

/**
 * Main signal scoring pipeline.
 * Returns scored signals split into usable and discarded buckets, plus a breakdown.
 */
export function scoreAndFilterSignals(signals: SignalOutput[]): {
  usable: ScoredSignal[];
  discarded: ScoredSignal[];
  breakdown: SignalBreakdown;
} {
  const scored: ScoredSignal[] = signals.map((s) => ({
    ...s,
    score: scoreSignal(s),
    discard_reason: getDiscardReason(s),
  }));

  const usable = scored
    .filter((s) => !s.discard_reason)
    .sort((a, b) => b.score - a.score);

  const discarded = scored.filter((s) => !!s.discard_reason);

  const breakdown: SignalBreakdown = {
    total: signals.length,
    relevant: usable.length,
    ignored: discarded.length,
    bullish:   usable.filter((s) => s.impact_direction === 'bullish').length,
    bearish:   usable.filter((s) => s.impact_direction === 'bearish').length,
    neutral:   usable.filter((s) => s.impact_direction === 'neutral').length,
    uncertain: usable.filter((s) => s.impact_direction === 'uncertain').length,
    avgConfidence:
      usable.length > 0
        ? usable.reduce((sum, s) => sum + s.confidence, 0) / usable.length
        : 0,
    totalVolume: usable.reduce((sum, s) => sum + s.volume, 0),
    affectedAssets: [...new Set(usable.flatMap((s) => s.affected_assets))],
    categoryCounts: {
      crypto_direct: usable.filter((s) => s.categories.crypto_direct).length,
      macro:         usable.filter((s) => s.categories.macro).length,
      political:     usable.filter((s) => s.categories.political).length,
      sentiment:     usable.filter((s) => s.categories.sentiment).length,
      second_order:  usable.filter((s) => s.categories.second_order).length,
    },
  };

  return { usable, discarded, breakdown };
}
