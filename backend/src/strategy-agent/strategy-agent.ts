// ─── Strategy Agent (Multi-Thesis) ───────────────────────────────────────────
//
// Architecture:
//   1. Score & filter signals (deterministic)
//   2. Send clean JSON to LLM → get back N weighted StrategyThesis[]
//      + ignored signal reasons
//   3. Blend theses into PortfolioAllocation (deterministic math)
//   4. Generate WDKAction[] from allocation delta (deterministic)
//
// The LLM does exactly two jobs:
//   a) Decide which signals cluster into which theses and what weights to give
//   b) Write the reasoning for each thesis
//
// Everything else is typed, deterministic code.

import { SignalOutput, StrategyDecision, StrategyThesis, MacroRegime } from './types';
import { scoreAndFilterSignals, ScoredSignal } from './signal-scorer';
import { blendAllocations, generateActions } from './portfolio-blender';

// ─── LLM Schema ───────────────────────────────────────────────────────────────

type LLMStrategyOutput = {
  theses: Array<{
    id: string;
    regime: MacroRegime;
    label: string;
    weight: number;
    supporting_signal_markets: string[];
    ignored_signal_markets: string[];
    confidence: number;
    reasoning: string;
    time_horizon: 'short' | 'mid' | 'long';
  }>;
  ignored_signal_reasons: Record<string, string>;
  overall_summary: string;
};

// ─── Prompt ───────────────────────────────────────────────────────────────────

function buildPrompt(usable: ScoredSignal[], discarded: ScoredSignal[]): string {
  const signalData = usable.map((s) => ({
    market: s.market,
    direction: s.impact_direction,
    confidence: parseFloat(s.confidence.toFixed(3)),
    score: parseFloat(s.score.toFixed(3)),
    horizon: s.time_horizon,
    yes_pct: s.percentage_yes,
    no_pct: s.percentage_no,
    volume_usd: s.volume,
    respondents: s.people_giving_opinion,
    affected_assets: s.affected_assets,
    categories: {
      crypto_direct: s.categories.crypto_direct,
      macro:         s.categories.macro,
      political:     s.categories.political,
      sentiment:     s.categories.sentiment,
      second_order:  s.categories.second_order,
    },
    signal_reasoning: s.reasoning,
  }));

  const discardedData = discarded.map((s) => ({
    market: s.market,
    discard_reason: s.discard_reason,
  }));

  return `You are the Strategy Agent of AlphaForge, a Tether-native autonomous DeFi portfolio system.

## YOUR ROLE
You receive pre-scored, pre-filtered prediction market signals and output a multi-thesis portfolio strategy as strict JSON.
You do NOT touch wallets. You do NOT execute trades. You ONLY reason about what should happen and why.

## ASSET UNIVERSE
- USDT (USD₮): stablecoin base. Can be lent on Aave v3 (wdk-protocol-lending-aave-evm) for yield.
- XAUT (XAU₮): gold-backed Tether token. Geopolitical / inflation hedge.
- ETH: primary risk-on asset. Swapped via Velora DEX (wdk-protocol-swap-velora-evm).
- BTC: secondary risk-on asset. Swapped via Velora DEX.

## VALID REGIMES
- "risk_on"    → rotate into ETH/BTC
- "risk_off"   → rotate into USDT, lend on Aave
- "gold_hedge" → rotate into XAUT, partially lend USDT
- "yield_farm" → park USDT in Aave, minimal risk exposure
- "neutral"    → balanced; partial Aave, partial risk assets

## SIGNALS (pre-scored, sorted by quality score DESC)
The "score" field = confidence × log10(volume+1) × respondent_weight.
Higher score = more trustworthy signal. Use this to weight your theses.

\`\`\`json
${JSON.stringify(signalData, null, 2)}
\`\`\`

## ALREADY DISCARDED (pre-filtered by deterministic rules — do NOT include these in any thesis)
\`\`\`json
${JSON.stringify(discardedData, null, 2)}
\`\`\`

## YOUR TASK
Analyze the signals and produce 1–4 strategy theses. Each thesis:
- Represents a coherent portfolio view backed by a specific cluster of signals
- Has a weight (0–1). All weights MUST sum to exactly 1.0.
- Can deliberately ignore signals it considers noise — explain why in ignored_signal_markets + ignored_signal_reasons
- Must map to one of the 5 valid regimes above

RULES:
- You MAY ignore signals from the usable list if they are contradictory noise, too thin to act on, or irrelevant to any coherent thesis. Add them to ignored_signal_markets and ignored_signal_reasons.
- A single signal can only belong to ONE thesis (or be ignored). No double-counting.
- Weight reflects your conviction. If one thesis dominates, give it 0.7–0.9 weight.
- If signals conflict strongly, split into 2 theses with weights reflecting conviction balance.
- reasoning per thesis: 2–3 sentences, assertive, DeFi-native. Name specific markets. Name specific assets.
- Do NOT hedge ("could", "may", "might"). State the thesis directly.

## OUTPUT FORMAT
Respond with ONLY valid JSON matching this exact schema. No markdown, no explanation outside the JSON.

{
  "theses": [
    {
      "id": "string (snake_case)",
      "regime": "risk_on | risk_off | gold_hedge | yield_farm | neutral",
      "label": "string (short human label e.g. 'Risk-On: ETH/BTC Momentum')",
      "weight": number,
      "supporting_signal_markets": ["market name", ...],
      "ignored_signal_markets": ["market name", ...],
      "confidence": number,
      "reasoning": "string",
      "time_horizon": "short | mid | long"
    }
  ],
  "ignored_signal_reasons": {
    "market name": "why this signal was ignored in any thesis"
  },
  "overall_summary": "1 sentence: what is the macro environment saying overall?"
}`;
}

// ─── LLM Response Parser ──────────────────────────────────────────────────────

function parseLLMResponse(raw: string): LLMStrategyOutput {
  const clean = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  const parsed = JSON.parse(clean) as LLMStrategyOutput;

  // Normalise weights silently rather than crashing on floating-point drift
  const weightSum = parsed.theses.reduce((s, t) => s + t.weight, 0);
  if (Math.abs(weightSum - 1.0) > 0.05) {
    for (const t of parsed.theses) {
      t.weight = t.weight / weightSum;
    }
  }

  return parsed;
}

// ─── Time Horizon Derivation ──────────────────────────────────────────────────

function deriveTimeHorizon(theses: StrategyThesis[]): 'short' | 'mid' | 'long' {
  const scores: Record<'short' | 'mid' | 'long', number> = { short: 0, mid: 0, long: 0 };
  for (const t of theses) {
    scores[t.time_horizon] += t.weight;
  }
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0] as 'short' | 'mid' | 'long';
}

// ─── Main ─────────────────────────────────────────────────────────────────────

/**
 * Run the multi-thesis Strategy Agent.
 *
 * @param signals   Full SignalOutput[] from the Signal Agent
 * @param callLLM   Injected LLM caller — any provider (Groq, Claude, OpenAI…)
 *                  Must return raw string. This function handles JSON parsing.
 */
export async function runStrategyAgent(
  signals: SignalOutput[],
  callLLM: (prompt: string) => Promise<string>,
): Promise<StrategyDecision> {
  // ── Step 1: Score & filter signals deterministically ──────────────────────
  const { usable, discarded, breakdown } = scoreAndFilterSignals(signals);

  // If nothing usable, return a safe neutral hold without calling the LLM
  if (usable.length === 0) {
    const neutralThesis: StrategyThesis = {
      id: 'no_signal_neutral',
      regime: 'neutral',
      label: 'No Signal: Hold & Yield',
      weight: 1.0,
      supporting_signals: [],
      ignored_signals: discarded.map((s) => s.market),
      confidence: 0,
      reasoning: 'No signals cleared quality thresholds. Holding current allocation with idle USDT deployed to Aave.',
      time_horizon: 'short',
    };

    const allocation = blendAllocations([neutralThesis]);
    const actions    = generateActions(allocation, [neutralThesis]);

    return {
      theses: [neutralThesis],
      dominant_regime: 'neutral',
      portfolio_allocation: allocation,
      actions,
      overall_confidence: 0,
      time_horizon: 'short',
      signal_summary: 'No usable signals — all discarded by quality filters',
      signal_breakdown: breakdown,
      ignored_signal_reasons: Object.fromEntries(
        discarded.map((s) => [s.market, s.discard_reason ?? 'unknown']),
      ),
      created_at: Date.now(),
    };
  }

  // ── Step 2: LLM multi-thesis reasoning ───────────────────────────────────
  const prompt      = buildPrompt(usable, discarded);
  const rawResponse = await callLLM(prompt);
  const llmOutput   = parseLLMResponse(rawResponse);

  // ── Step 3: Map LLM output to typed StrategyThesis[] ─────────────────────
  const theses: StrategyThesis[] = llmOutput.theses.map((t) => ({
    id:                t.id,
    regime:            t.regime,
    label:             t.label,
    weight:            t.weight,
    supporting_signals: t.supporting_signal_markets,
    ignored_signals:   t.ignored_signal_markets,
    confidence:        t.confidence,
    reasoning:         t.reasoning,
    time_horizon:      t.time_horizon,
  }));

  // ── Step 4: Blend theses → PortfolioAllocation ────────────────────────────
  const allocation = blendAllocations(theses);

  // ── Step 5: Generate WDKAction[] from allocation delta ────────────────────
  const actions = generateActions(allocation, theses);

  // ── Step 6: Dominant regime = highest-weight thesis ───────────────────────
  const dominantThesis = [...theses].sort((a, b) => b.weight - a.weight)[0];

  // ── Step 7: Merge ignored signal reasons (pre-filter + LLM) ──────────────
  const allIgnoredReasons: Record<string, string> = {
    ...Object.fromEntries(discarded.map((s) => [s.market, s.discard_reason ?? 'unknown'])),
    ...llmOutput.ignored_signal_reasons,
  };

  // ── Step 8: Weight-averaged overall confidence ────────────────────────────
  const overallConfidence = theses.reduce((sum, t) => sum + t.confidence * t.weight, 0);

  return {
    theses,
    dominant_regime:      dominantThesis.regime,
    portfolio_allocation: allocation,
    actions,
    overall_confidence:   overallConfidence,
    time_horizon:         deriveTimeHorizon(theses),
    signal_summary:       llmOutput.overall_summary,
    signal_breakdown:     breakdown,
    ignored_signal_reasons: allIgnoredReasons,
    created_at:           Date.now(),
  };
}
