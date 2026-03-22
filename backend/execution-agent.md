# Execution Agent — Walkthrough

## What Was Built

A new `src/execution-agent/` module — the third and final stage of the AlphaForge pipeline.

```
src/execution-agent/
├── types.ts            ← TOKEN_ADDRESSES, ToolCall, ToolResult, ExecutionResult
├── prompt.ts           ← EXECUTION_SYSTEM_PROMPT + message builders
├── wdk-tool-runner.ts  ← ONLY file that calls WDK SDKs
├── execution-agent.ts  ← tool-call loop logic
└── index.ts            ← re-exports only (mirrors strategy-agent/index.ts)
```

## Key Design Decisions (From User Feedback)

| Decision | Implementation |
|---|---|
| Logic / re-exports separated | [execution-agent.ts](file:///home/fatguy/Desktop/codes/hackathons/26/tether/backend/src/execution-agent/execution-agent.ts) = loop, [index.ts](file:///home/fatguy/Desktop/codes/hackathons/26/tether/backend/src/index.ts) = barrel |
| Aave stub returns **success**, not error | `aave_supply`/`aave_withdraw` catch SDK errors and return synthetic success shape + stub hash |
| `get_wallet_balances` returns real starting USDT | Returns `ctx.totalPortfolioUSDT` (not zeros) so the LLM sees a meaningful starting portfolio |
| `callLLM` takes `Message[]` | Full conversation history passed each turn, not a plain prompt string |

## The `callLLM` Interface

[execution-agent.ts](file:///home/fatguy/Desktop/codes/hackathons/26/tether/backend/src/execution-agent/execution-agent.ts) exports the [Message](file:///home/fatguy/Desktop/codes/hackathons/26/tether/backend/src/execution-agent/execution-agent.ts#49-50) type and documents the adapter pattern at the top of the file. When you wire the orchestrator, you need a Groq adapter like:

```typescript
import { ChatGroq } from '@langchain/groq';
import { SystemMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import type { Message } from './execution-agent';

const model = new ChatGroq({ model: 'llama-3.3-70b-versatile', temperature: 0.1 });

const callLLM = async (messages: Message[]): Promise<string> => {
  const lc = messages.map(m => {
    if (m.role === 'system')    return new SystemMessage(m.content);
    if (m.role === 'assistant') return new AIMessage(m.content);
    return new HumanMessage(m.content);
  });
  const res = await model.invoke(lc);
  return typeof res.content === 'string' ? res.content : '';
};
```

## Verification

```
npx tsc --noEmit -p tsconfig.json
```

**Result:** 0 errors from `src/execution-agent/`. The only failure is a pre-existing `src/utils/prisma.ts` error (`PrismaClient` not exported — fix with `pnpm prisma generate`).

## Package Added

`@tetherto/wdk-protocol-lending-aave-evm` installed successfully via `pnpm add`.
