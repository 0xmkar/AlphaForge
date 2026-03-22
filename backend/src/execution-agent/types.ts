// ─── Execution Agent Types ────────────────────────────────────────────────────
//
// Everything here maps 1:1 to real WDK SDK primitives.
// No abstractions — if it's named here, it exists in the WDK.

import { StrategyDecision, WDKAction, WDKAsset } from '../strategy-agent/types';

// ─── Token addresses (Ethereum mainnet) ──────────────────────────────────────
// These go directly into VeloraProtocolEvm.swap({ tokenIn, tokenOut })

export const TOKEN_ADDRESSES: Record<WDKAsset, string> = {
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  ETH:  '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // native ETH sentinel
  BTC:  '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC on mainnet
  XAUT: '0x68749665FF8D2d112Fa859AA293F07A622782F38',
};

// ─── Tool definitions ─────────────────────────────────────────────────────────
//
// Param names match the actual WDK SDK method signatures exactly.

export type ToolName =
  | 'velora_quote_swap'
  | 'velora_execute_swap'
  | 'aave_supply'
  | 'aave_withdraw'
  | 'get_wallet_balances'
  | 'execution_complete';

export type ToolCall = {
  tool: ToolName;
  params: Record<string, unknown>;
  reason: string; // agent must justify every call
};

export type ToolResult =
  | { tool: 'velora_quote_swap';   ok: true;  fee: string; tokenInAmount: string; tokenOutAmount: string; priceImpactPct: number }
  | { tool: 'velora_execute_swap'; ok: true;  hash: string; fee: string; tokenInAmount: string; tokenOutAmount: string; approveHash?: string }
  | { tool: 'aave_supply';         ok: true;  hash: string; amountSupplied: string; aTokenReceived: string }
  | { tool: 'aave_withdraw';       ok: true;  hash: string; amountWithdrawn: string }
  | { tool: 'get_wallet_balances'; ok: true;  balances: Record<WDKAsset | 'USDT_lent', string> }
  | { tool: 'execution_complete';  ok: true;  summary: ExecutionSummary }
  | { tool: ToolName;              ok: false; error: string; retryable: boolean };

// ─── Execution loop types ─────────────────────────────────────────────────────

export type ExecutionStep = {
  step: number;
  action: WDKAction;               // the WDKAction being executed in this step
  tool_call: ToolCall;
  tool_result: ToolResult;
  status: 'success' | 'failed' | 'skipped';
  skip_reason?: string;
};

export type ExecutionSummary = {
  total_steps: number;
  succeeded: number;
  failed: number;
  skipped: number;
  steps: ExecutionStep[];
  portfolio_before: Record<string, string>;
  portfolio_after: Record<string, string>;
  total_gas_spent_wei: string;
  execution_duration_ms: number;
};

// ─── Full execution agent output ──────────────────────────────────────────────

export type ExecutionResult = {
  strategy_id:        string;   // created_at timestamp of the StrategyDecision
  dominant_regime:    string;
  overall_confidence: number;
  summary:            ExecutionSummary;
  created_at:         number;
};

// Re-export StrategyDecision so callers can import from one place
export type { StrategyDecision, WDKAction, WDKAsset };
