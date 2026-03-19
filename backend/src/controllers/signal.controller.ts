import { Request, Response, NextFunction } from 'express';
import { fetchTopMarkets } from '../services/polymarket.service';
import { analyzeMarketsBatch, SignalOutput } from '../services/ai.service';
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
      
      // Filter only relevant signals as requested
      const relevantSignals = batchSignals.filter(signal => signal.is_relevant);
      allSignals.push(...relevantSignals);
    }

    res.status(200).json({
      status: 'success',
      count: allSignals.length,
      data: allSignals,
    });
  } catch (error) {
    next(error);
  }
};
