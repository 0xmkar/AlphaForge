// ─── Execution Agent — public surface ────────────────────────────────────────
//
// Import from this barrel to use the execution agent.
// All implementation details live in the files it re-exports.

// ── Main loop ─────────────────────────────────────────────────────────────────
export { runExecutionAgent }    from './execution-agent';
export type { Message }         from './execution-agent';

// ── WDK context & runner ──────────────────────────────────────────────────────
export type { WDKContext }      from './wdk-tool-runner';

// ── Types ─────────────────────────────────────────────────────────────────────
export type {
  ToolName,
  ToolCall,
  ToolResult,
  ExecutionStep,
  ExecutionSummary,
  ExecutionResult,
} from './types';

export { TOKEN_ADDRESSES }      from './types';

// ── Prompt builders (useful for testing / debugging the prompt) ───────────────
export {
  EXECUTION_SYSTEM_PROMPT,
  buildExecutionUserMessage,
  buildToolResultMessage,
} from './prompt';
