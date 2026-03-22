import type { StrategyDecision } from '../strategy-agent/types';
import type { RiskAssessment, RiskGuardrails, RiskLevel } from './types';

// ─── Thresholds ───────────────────────────────────────────────────────────────

const CONCENTRATION_LIMIT_PCT = 60;   // single action above this triggers flag
const MIN_CONFIDENCE = 0.5;           // below this is considered low confidence
const MAX_ACTIONS = 5;                // more than this is considered excessive
const MAX_TOTAL_EXPOSURE_PCT = 90;    // sum of all portfolioPct above this triggers flag

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreFromGuardrails(guardrails: RiskGuardrails, confidence: number): number {
  let score = 0;

  if (guardrails.concentrationRisk) score += 35;
  if (guardrails.lowConfidence)     score += 25;
  if (guardrails.tooManyActions)    score += 20;
  if (guardrails.highTotalExposure) score += 20;

  // Adjust score based on how far confidence is from the minimum
  const confidencePenalty = Math.max(0, (MIN_CONFIDENCE - confidence) * 40);
  score += confidencePenalty;

  return Math.min(100, Math.round(score));
}

function levelFromScore(score: number): RiskLevel {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}

// ─── Main ─────────────────────────────────────────────────────────────────────

/**
 * Runs deterministic safety checks against a StrategyDecision.
 * No LLM calls — purely rule-based guardrails.
 */
export function runRiskAgent(strategy: StrategyDecision): RiskAssessment {
  const { actions, overall_confidence } = strategy;

  const warnings: string[] = [];
  const blockedReasons: string[] = [];

  // ── Guardrail checks ──────────────────────────────────────────────────────

  const maxSinglePct = actions.reduce((max, a) => Math.max(max, a.portfolioPct), 0);
  const totalExposurePct = actions.reduce((sum, a) => sum + a.portfolioPct, 0);

  const guardrails: RiskGuardrails = {
    concentrationRisk: maxSinglePct > CONCENTRATION_LIMIT_PCT,
    lowConfidence:     overall_confidence < MIN_CONFIDENCE,
    tooManyActions:    actions.length > MAX_ACTIONS,
    highTotalExposure: totalExposurePct > MAX_TOTAL_EXPOSURE_PCT,
  };

  // ── Populate warnings / blocked reasons ───────────────────────────────────

  if (guardrails.concentrationRisk) {
    const msg = `Single action allocates ${maxSinglePct}% of portfolio (limit: ${CONCENTRATION_LIMIT_PCT}%)`;
    blockedReasons.push(msg);
  }

  if (guardrails.lowConfidence) {
    const msg = `Overall confidence ${overall_confidence.toFixed(2)} is below minimum threshold of ${MIN_CONFIDENCE}`;
    blockedReasons.push(msg);
  }

  if (guardrails.tooManyActions) {
    const msg = `Strategy contains ${actions.length} actions (limit: ${MAX_ACTIONS})`;
    warnings.push(msg);
  }

  if (guardrails.highTotalExposure) {
    const msg = `Total portfolio exposure is ${totalExposurePct}% (limit: ${MAX_TOTAL_EXPOSURE_PCT}%)`;
    warnings.push(msg);
  }

  // Advisory warnings that don't block
  if (overall_confidence < 0.7 && overall_confidence >= MIN_CONFIDENCE) {
    warnings.push(`Confidence is moderate (${overall_confidence.toFixed(2)}). Consider reviewing signals.`);
  }

  if (strategy.dominant_regime === 'risk_on' && totalExposurePct > 70) {
    warnings.push('Risk-on regime with high total exposure — ensure downside protection is considered.');
  }

  // ── Score & level ─────────────────────────────────────────────────────────

  const riskScore = scoreFromGuardrails(guardrails, overall_confidence);
  const riskLevel = levelFromScore(riskScore);

  // Strategy is blocked only on hard guardrail failures (concentration or low confidence)
  const approved = !guardrails.concentrationRisk && !guardrails.lowConfidence;

  return {
    riskScore,
    riskLevel,
    approved,
    guardrails,
    warnings,
    blockedReasons,
    assessedAt: Date.now(),
  };
}
