import { Request, Response, NextFunction } from 'express';
import { SignalOutput, groqCallLLM } from '../services/ai.service';
import { runStrategyAgent } from '../strategy-agent';

/**
 * POST /v1/strategy
 * Body: { signals: SignalOutput[] }
 *
 * Accepts a pre-computed array of SignalOutput objects (e.g. sample data, or
 * the output of the Signal Agent piped in manually) and returns a StrategyDecision.
 */
export const runStrategy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { signals } = req.body as { signals?: unknown };

    if (!Array.isArray(signals)) {
      res.status(400).json({
        status: 'error',
        message: '`signals` must be an array of SignalOutput objects',
      });
      return;
    }

    const decision = await runStrategyAgent(signals as SignalOutput[], groqCallLLM);

    res.status(200).json({
      status: 'success',
      data: decision,
    });
  } catch (error) {
    next(error);
  }
};
