// FILE: src/strategy-agent/action-mapper.ts
//
// Legacy single-regime action mapper kept for reference.
// The live code path now uses portfolio-blender.ts + multi-thesis strategy-agent.ts.

import { MacroRegime, WDKAction } from './types';

/**
 * Maps a classified MacroRegime to an ordered set of WDK actions.
 * Pure function — no LLM, no WDK, no side effects.
 */
export function getProposedActions(regime: MacroRegime): WDKAction[] {
  switch (regime) {
    case 'risk_on':
      return [
        { type: 'withdraw_lend', asset: 'USDT', portfolioPct: 50, protocol: 'aave-evm', reason: 'Free liquidity for ETH rotation' },
        { type: 'swap', from: 'USDT', to: 'ETH', portfolioPct: 40, reason: 'Rotate into primary risk-on asset' },
      ];

    case 'risk_off':
      return [
        { type: 'swap', from: 'ETH', to: 'USDT', portfolioPct: 80, reason: 'Exit ETH exposure into stable base' },
        { type: 'lend', asset: 'USDT', portfolioPct: 70, protocol: 'aave-evm', reason: 'Park USDT in Aave for yield' },
      ];

    case 'gold_hedge':
      return [
        { type: 'swap', from: 'USDT', to: 'XAUT', portfolioPct: 30, reason: 'Rotate into gold hedge via XAUT' },
        { type: 'lend', asset: 'USDT', portfolioPct: 40, protocol: 'aave-evm', reason: 'Lend remaining USDT on Aave' },
      ];

    case 'yield_farm':
      return [
        { type: 'lend', asset: 'USDT', portfolioPct: 75, protocol: 'aave-evm', reason: 'Max Aave yield — neutral macro, low conviction on risk assets' },
      ];

    case 'neutral':
    default:
      return [{ type: 'hold', asset: 'USDT', portfolioPct: 100, reason: 'Insufficient signal conviction' }];
  }
}
