// ─── Execution Agent ──────────────────────────────────────────────────────────
//
// Runs the tool-call loop:
//   LLM emits ToolCall JSON → wdk-tool-runner.ts executes it → result fed back
//   → repeat until execution_complete or MAX_STEPS
//
// The LLM is stateless between calls. The conversation history IS the state.
//
// ─── callLLM contract ────────────────────────────────────────────────────────
//
// callLLM receives the FULL conversation as a Message[] array (not a single prompt
// string). Each element has role 'system' | 'user' | 'assistant' and a content
// string. The orchestrator / route layer must adapt this to its LLM provider.
//
// Example Groq/LangChain adapter:
//
//   import { ChatGroq } from '@langchain/groq';
//   import { SystemMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
//
//   const model = new ChatGroq({ ... });
//
//   const callLLM = async (messages: Message[]): Promise<string> => {
//     const lc = messages.map(m => {
//       if (m.role === 'system')    return new SystemMessage(m.content);
//       if (m.role === 'assistant') return new AIMessage(m.content);
//       return new HumanMessage(m.content);        // 'user'
//     });
//     const res = await model.invoke(lc);
//     return typeof res.content === 'string' ? res.content : '';
//   };

import { StrategyDecision } from '../strategy-agent/types';
import { ToolCall, ToolResult, ExecutionResult, ExecutionStep } from './types';
import { runTool, WDKContext } from './wdk-tool-runner';
import {
  EXECUTION_SYSTEM_PROMPT,
  buildExecutionUserMessage,
  buildToolResultMessage,
} from './prompt';

// ─── Config ───────────────────────────────────────────────────────────────────

const MAX_STEPS = 20; // hard ceiling — prevents runaway loops

// ─── LLM message types ────────────────────────────────────────────────────────
//
// Exported so the orchestrator can use the same type when constructing callLLM.

export type Message = { role: 'system' | 'user' | 'assistant'; content: string };

// ─── Response parser ──────────────────────────────────────────────────────────

function parseToolCall(raw: string): ToolCall {
  // LLMs (especially smaller ones) often add conversational preamble/postamble.
  // We look for the first '{' and last '}' to extract the JSON payload.
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    throw new Error(`No JSON object found in LLM response: ${raw}`);
  }

  const clean = raw.slice(firstBrace, lastBrace + 1);

  try {
    const parsed = JSON.parse(clean);

    // If reason is missing at top level but in params, lift it up
    if (!parsed.reason && parsed.params?.reason) {
      parsed.reason = parsed.params.reason;
    }

    if (!parsed.tool || !parsed.params) {
      throw new Error(`Invalid tool call shape (missing tool or params): ${clean}`);
    }

    // Default reason if still missing
    if (!parsed.reason) {
      parsed.reason = 'No reason provided';
    }

    return parsed as ToolCall;
  } catch (err) {
    throw new Error(`Failed to parse JSON segment: ${clean}. Error: ${err}`);
  }
}

// ─── Conversation builder helpers ─────────────────────────────────────────────

function appendAssistantCall(messages: Message[], call: ToolCall): Message[] {
  return [...messages, { role: 'assistant', content: JSON.stringify(call) }];
}

function appendToolResult(messages: Message[], call: ToolCall, result: ToolResult): Message[] {
  return [...messages, {
    role: 'user',
    content: buildToolResultMessage(call as any, result as any),
  }];
}

// ─── Main execution loop ──────────────────────────────────────────────────────

/**
 * Run the tool-call loop until the LLM calls execution_complete or MAX_STEPS.
 *
 * @param decision   StrategyDecision from the Strategy Agent
 * @param ctx        WDK context (account, portfolio value, gas options)
 * @param callLLM    Provider-agnostic LLM caller.
 *                   Receives the FULL conversation as Message[] (not a plain prompt).
 *                   Must return the raw string response from the model.
 *                   See the adapter example at the top of this file.
 */
export async function runExecutionAgent(
  decision: StrategyDecision,
  ctx: WDKContext,
  callLLM: (messages: Message[]) => Promise<string>,
): Promise<ExecutionResult> {
  const startTime = Date.now();
  const steps: ExecutionStep[] = [];
  let stepNumber = 0;
  let totalGasWei = 0n;

  // Build initial conversation
  let messages: Message[] = [
    { role: 'system', content: EXECUTION_SYSTEM_PROMPT },
    { role: 'user', content: buildExecutionUserMessage(decision) },
  ];

  // ── Tool-call loop ───────────────────────────────────────────────────────
  for (let i = 0; i < MAX_STEPS; i++) {
    // 1. Ask LLM for next tool call
    const rawResponse = await callLLM(messages);

    // 2. Parse — inject error back into conversation on parse failure
    let toolCall: ToolCall;
    try {
      toolCall = parseToolCall(rawResponse);
    } catch (err) {
      console.error('[ExecutionAgent] Failed to parse tool call:', rawResponse);
      messages = [
        ...messages,
        { role: 'assistant', content: rawResponse },
        {
          role: 'user',
          content: `JSON parse error: ${err}. Output only valid JSON for your next tool call.`,
        },
      ];
      continue;
    }

    // 3. Append assistant call to conversation
    messages = appendAssistantCall(messages, toolCall);

    // 4. Terminal condition
    if (toolCall.tool === 'execution_complete') {
      const summary = (toolCall.params as any)['summary'];
      return {
        strategy_id: String(decision.created_at),
        dominant_regime: decision.dominant_regime,
        overall_confidence: decision.overall_confidence,
        summary: {
          ...summary,
          total_steps: steps.length,
          succeeded: steps.filter((s) => s.status === 'success').length,
          failed: steps.filter((s) => s.status === 'failed').length,
          skipped: steps.filter((s) => s.status === 'skipped').length,
          steps,
          total_gas_spent_wei: totalGasWei.toString(),
          execution_duration_ms: Date.now() - startTime,
        },
        created_at: Date.now(),
      };
    }

    // 5. Execute the tool
    let result: ToolResult = await runTool(toolCall, ctx);

    // 6. One retry on retryable failures
    if (!result.ok && (result as any)['retryable']) {
      console.warn(`[ExecutionAgent] Retrying ${toolCall.tool}...`);
      result = await runTool(toolCall, ctx);
    }

    // 7. Track gas from swap transactions
    if (result.ok && result.tool === 'velora_execute_swap') {
      totalGasWei += BigInt((result as any)['fee'] ?? '0');
    }

    // 8. Record execution step (state-changing actions only)
    if (toolCall.tool !== 'get_wallet_balances' && toolCall.tool !== 'velora_quote_swap') {
      const matchedAction =
        decision.actions.find((a) => {
          if (toolCall.tool === 'velora_execute_swap') return a.type === 'swap';
          if (toolCall.tool === 'aave_supply') return a.type === 'lend';
          if (toolCall.tool === 'aave_withdraw') return a.type === 'withdraw_lend';
          return false;
        }) ?? decision.actions[0];

      steps.push({
        step: ++stepNumber,
        action: matchedAction,
        tool_call: toolCall,
        tool_result: result,
        status: result.ok ? 'success' : 'failed',
      });
    }

    // 9. Append result to conversation
    messages = appendToolResult(messages, toolCall, result);

    // 10. Observability
    const icon = result.ok ? '✓' : '✗';
    console.log(`[ExecutionAgent] ${icon} ${toolCall.tool} — ${toolCall.reason}`);
    if (result.ok && (result as any).hash) {
      console.log(`[ExecutionAgent] Transaction Hash: ${(result as any).hash}`);
    }
    if (!result.ok) {
      console.error(`[ExecutionAgent] Error: ${(result as any)['error']}`);
    }
  }

  // ── MAX_STEPS exceeded — force-close ─────────────────────────────────────
  console.error('[ExecutionAgent] MAX_STEPS reached — forcing execution_complete');
  return {
    strategy_id: String(decision.created_at),
    dominant_regime: decision.dominant_regime,
    overall_confidence: decision.overall_confidence,
    summary: {
      total_steps: steps.length,
      succeeded: steps.filter((s) => s.status === 'success').length,
      failed: steps.filter((s) => s.status === 'failed').length,
      skipped: steps.filter((s) => s.status === 'skipped').length,
      steps,
      portfolio_before: {},
      portfolio_after: {},
      total_gas_spent_wei: totalGasWei.toString(),
      execution_duration_ms: Date.now() - startTime,
    },
    created_at: Date.now(),
  };
}
