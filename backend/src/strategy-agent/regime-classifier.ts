// FILE: src/strategy-agent/regime-classifier.ts

import { SignalOutput, MacroRegime, SignalBreakdown } from './types';

export type ClassifyResult = {
  regime: MacroRegime;
  aggregateConfidence: number; // volume-weighted across all relevant signals
  breakdown: SignalBreakdown;
};

/**
 * Computes aggregate statistics across all relevant signals.
 * "Relevant" here means is_relevant=true AND confidence > 0.55.
 */
function computeBreakdown(all: SignalOutput[], filtered: SignalOutput[]): SignalBreakdown {
  const totalVolume = filtered.reduce((s, sig) => s + sig.volume, 0);

  const avgConfidence =
    filtered.length === 0
      ? 0
      : totalVolume > 0
        ? filtered.reduce((s, sig) => s + sig.confidence * sig.volume, 0) / totalVolume
        : filtered.reduce((s, sig) => s + sig.confidence, 0) / filtered.length;

  const assetsSet = new Set<string>();
  for (const sig of filtered) {
    for (const asset of sig.affected_assets) {
      assetsSet.add(asset);
    }
  }

  const categoryCounts = { crypto_direct: 0, macro: 0, political: 0, sentiment: 0, second_order: 0 };
  let bullish = 0, bearish = 0, neutral = 0, uncertain = 0;

  for (const sig of filtered) {
    switch (sig.impact_direction) {
      case 'bullish':   bullish++;   break;
      case 'bearish':   bearish++;   break;
      case 'neutral':   neutral++;   break;
      case 'uncertain': uncertain++; break;
    }
    if (sig.categories.crypto_direct) categoryCounts.crypto_direct++;
    if (sig.categories.macro)         categoryCounts.macro++;
    if (sig.categories.political)     categoryCounts.political++;
    if (sig.categories.sentiment)     categoryCounts.sentiment++;
    if (sig.categories.second_order)  categoryCounts.second_order++;
  }

  return {
    total: all.length,
    relevant: filtered.length,
    ignored: all.length - filtered.length,
    bullish,
    bearish,
    neutral,
    uncertain,
    avgConfidence,
    totalVolume,
    affectedAssets: [...assetsSet],
    categoryCounts,
  };
}

/**
 * Classifies the macro regime from a batch of signals.
 * Pure function — no LLM, no WDK, no side effects.
 *
 * Pre-filter: is_relevant=true AND confidence > 0.55
 * Sorting:    confidence × volume descending (highest conviction first)
 *
 * Priority order (applied to the top-conviction signal):
 *   1. gold_hedge  → political AND macro both true, direction === 'uncertain'
 *   2. risk_off    → bearish, crypto_direct OR macro true, confidence > 0.65
 *   3. risk_on     → bullish, confidence > 0.60, volume > 5,000
 *   4. neutral     → fallback (aggregateConfidence penalised ×0.7)
 */
export function classifyRegime(signals: SignalOutput[]): ClassifyResult {
  const filtered = signals
    .filter((s) => s.is_relevant && s.confidence > 0.55)
    .sort((a, b) => b.confidence * b.volume - a.confidence * a.volume);

  const breakdown = computeBreakdown(signals, filtered);

  if (filtered.length === 0) {
    return { regime: 'neutral', aggregateConfidence: 0, breakdown };
  }

  // Regime is determined by the highest-conviction signal (deterministic rule engine).
  // We do NOT expose that signal externally — only the classified regime and aggregate stats.
  const top = filtered[0];

  if (top.categories.political && top.categories.macro && top.impact_direction === 'uncertain') {
    return { regime: 'gold_hedge', aggregateConfidence: breakdown.avgConfidence, breakdown };
  }

  if (
    top.impact_direction === 'bearish' &&
    (top.categories.crypto_direct || top.categories.macro) &&
    top.confidence > 0.65
  ) {
    return { regime: 'risk_off', aggregateConfidence: breakdown.avgConfidence, breakdown };
  }

  if (top.impact_direction === 'bullish' && top.confidence > 0.60 && top.volume > 5000) {
    return { regime: 'risk_on', aggregateConfidence: breakdown.avgConfidence, breakdown };
  }

  // Neutral fallback — penalise confidence to reflect low conviction
  return { regime: 'neutral', aggregateConfidence: breakdown.avgConfidence * 0.7, breakdown };
}
