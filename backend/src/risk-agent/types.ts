export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type RiskGuardrails = {
  concentrationRisk: boolean;   // any single action > 60% of portfolio
  lowConfidence: boolean;       // overall_confidence < 0.5
  tooManyActions: boolean;      // more than 5 actions planned
  highTotalExposure: boolean;   // sum of portfolioPct across all actions > 90%
};

export type RiskAssessment = {
  riskScore: number;            // 0–100 composite score (higher = riskier)
  riskLevel: RiskLevel;
  approved: boolean;            // false means the strategy is blocked
  guardrails: RiskGuardrails;
  warnings: string[];           // non-blocking advisory notes
  blockedReasons: string[];     // reasons why approved is false (empty when approved)
  assessedAt: number;           // Unix ms timestamp
};
