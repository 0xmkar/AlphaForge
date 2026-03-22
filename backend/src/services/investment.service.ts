import prisma from '../utils/prisma';
import type { StrategyDecision } from '../strategy-agent/types';
import type { ExecutionResult } from '../execution-agent/types';
import type { RiskAssessment } from '../risk-agent/types';

/**
 * Persist an executed strategy as an Investment row.
 * Only called when the execution agent has returned successfully.
 */
export async function createInvestment(
  userId: number,
  strategy: StrategyDecision,
  execution: ExecutionResult,
  riskAssessment?: RiskAssessment,
) {
  const { summary } = execution;

  return prisma.investment.create({
    data: {
      userId,

      // Strategy context
      dominantRegime: strategy.dominant_regime,
      overallConfidence: strategy.overall_confidence,
      timeHorizon: strategy.time_horizon,
      signalSummary: strategy.signal_summary,
      actions: strategy.actions as any,

      // Execution summary
      totalSteps: summary.total_steps,
      succeeded: summary.succeeded,
      failed: summary.failed,
      skipped: summary.skipped,
      steps: summary.steps as any,
      totalGasSpentWei: summary.total_gas_spent_wei,
      executionDurationMs: summary.execution_duration_ms,

      // Risk assessment
      riskAssessment: riskAssessment as any ?? null,

      // Timestamps
      strategyCreatedAt: new Date(strategy.created_at),
    },
  });
}

/**
 * Fetch all investments for a given user, newest first.
 */
export async function getInvestmentsByUser(userId: number) {
  return prisma.investment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}
