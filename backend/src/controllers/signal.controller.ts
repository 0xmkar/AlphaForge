import { Request, Response, NextFunction } from 'express';
import { fetchTopMarkets } from '../services/polymarket.service';
import { analyzeMarketsBatch, groqCallLLM, groqExecutionCallLLM, SignalOutput } from '../services/ai.service';
import { runStrategyAgent } from '../strategy-agent';
import { runExecutionAgent, WDKContext } from '../execution-agent';
import { getWallet } from '../utils/wallet';
import logger from '../utils/logger';

export const getSignals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const markets = await fetchTopMarkets(limit);

    const BATCH_SIZE = 5;
    const allSignals: SignalOutput[] = [];

    // Process in batches
    for (let i = 0; i < markets.length; i += BATCH_SIZE) {
      const batch = markets.slice(i, i + BATCH_SIZE);
      logger.info(`Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(markets.length / BATCH_SIZE)}...`);

      const batchSignals = await analyzeMarketsBatch(batch);

      // Filter only relevant signals
      const relevantSignals = batchSignals.filter(signal => signal.is_relevant);
      allSignals.push(...relevantSignals);
    }

    logger.info(`Running Strategy Agent on ${allSignals.length} relevant signals...`);
    const strategy = await runStrategyAgent(allSignals, groqCallLLM);

    logger.info('Running Execution Agent on the strategy decision...');

    const userSeedPhrase = (req as any).user?.seedPhrase;
    const { account } = await getWallet(userSeedPhrase);

    const ctx: WDKContext = {
      evmAccount: account,
      totalPortfolioUSDT: 10,
      swapMaxFee: undefined,
    };

    const execution = await runExecutionAgent(strategy, ctx, groqExecutionCallLLM);

    res.status(200).json({
      status: 'success',
      count: allSignals.length,
      data: allSignals,
      strategy,
      execution,
    });
  } catch (error) {
    next(error);
  }
};
