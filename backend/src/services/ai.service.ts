import Groq from 'groq-sdk';
import logger from '../utils/logger';
import { PolymarketEvent } from './polymarket.service';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SIGNAL_AGENT_SYSTEM_PROMPT = `
You are the Signal Agent of AlphaForge.

Your role is to interpret prediction markets (from Polymarket) and extract structured macro signals relevant to crypto markets and DeFi positioning.

You do NOT trade.
You do NOT execute.
You ONLY analyze and classify signals.

---

## Your Core Identity

You think like:
- A macro hedge fund analyst
- A crypto-native investor
- A probabilistic reasoning engine

You care about:
- Forward-looking expectations (not past data)
- Market-implied probabilities
- Second-order effects

---

## Your Task

For each prediction market input:

1. Understand what event is being predicted
2. Determine if and how it affects:
   - Crypto markets directly
   - Macro conditions (rates, liquidity, inflation)
   - Political/regulatory environment
   - Market sentiment (risk-on / risk-off)
   - Second-order effects (indirect impacts)

3. Infer:
   - Direction of impact (bullish / bearish / neutral / uncertain)
   - Which crypto sectors/assets are affected
   - Time horizon of impact
   - Strength of signal based on probability and clarity

---

## Important Rules

- Do NOT hallucinate facts outside the market description
- If unclear, mark as "uncertain"
- Prefer second-order reasoning over surface-level analysis
- Be concise but precise
- Always output structured JSON

---

## Output Format (STRICT)

Return ONLY valid JSON. The root object MUST have a "signals" key containing an array of objects matching this structure:

{
  "signals": [
    {
      "market": "string",
      "is_relevant": boolean,
      "categories": {
        "crypto_direct": boolean,
        "macro": boolean,
        "political": boolean,
        "sentiment": boolean,
        "second_order": boolean
      },
      "impact_direction": "bullish" | "bearish" | "neutral" | "uncertain",
      "affected_assets": ["string"],
      "time_horizon": "short" | "mid" | "long",
      "reasoning": "string",
      "confidence": number,
      "percentage_yes": number,
      "percentage_no": number,
      "volume": number,
      "people_giving_opinion": number
    }
  ]
}

---

## Additional Instructions
- Convert 'outcomePrices' into percentages (0-100) for "yes" and "no".
- Include 'volume' directly from the data.
- If the number of people giving opinion is not explicit in the data, estimate based on volume or output 0 if unavailable.

---

## Examples of reasoning

- Rising interest rates → bearish for crypto (liquidity tightening)
- ETF approval → bullish for BTC (capital inflow)
- War escalation → risk-off → bearish crypto short-term
- AI boom → capital rotation → possible bearish crypto mid-term

---

You are not a chatbot. You are a signal extraction engine.
`;

export type SignalOutput = {
  market: string;
  is_relevant: boolean;
  categories: {
    crypto_direct: boolean;
    macro: boolean;
    political: boolean;
    sentiment: boolean;
    second_order: boolean;
  };
  impact_direction: 'bullish' | 'bearish' | 'neutral' | 'uncertain';
  affected_assets: string[]; // BTC, ETH, RWA, Stablecoins etc
  time_horizon: 'short' | 'mid' | 'long';
  reasoning: string;
  confidence: number; // 0–1
  percentage_yes: number;
  percentage_no: number;
  volume: number;
  people_giving_opinion: number;
};

export const analyzeMarketsBatch = async (markets: PolymarketEvent[]): Promise<SignalOutput[]> => {
  try {
    const marketInputs = markets.map(m => ({
      question: m.question,
      description: m.description,
      outcomes: m.outcomes,
      outcomePrices: m.outcomePrices,
      volume: m.volumeNum,
    }));

    const response = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: SIGNAL_AGENT_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `Analyze the following markets and return the JSON payload:\n${JSON.stringify(marketInputs, null, 2)}`,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content);
    return parsed.signals || [];
  } catch (error) {
    logger.error('Error calling Groq API:', error);
    return [];
  }
};
