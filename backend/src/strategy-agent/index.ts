// FILE: src/strategy-agent/index.ts

export type {
  SignalOutput,
  MacroRegime,
  WDKAsset,
  WDKAction,
  PortfolioAllocation,
  StrategyThesis,
  SignalBreakdown,
  StrategyDecision,
} from './types';

export type { ScoredSignal } from './signal-scorer';
export { scoreSignal, getDiscardReason, scoreAndFilterSignals } from './signal-scorer';

export { blendAllocations, generateActions } from './portfolio-blender';

export { runStrategyAgent } from './strategy-agent';

// Legacy single-regime utilities (kept for backwards compat)
export type { ClassifyResult } from './regime-classifier';
export { classifyRegime } from './regime-classifier';
export { getProposedActions } from './action-mapper';
