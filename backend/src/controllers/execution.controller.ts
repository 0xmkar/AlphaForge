import { Request, Response, NextFunction } from 'express';
import { runExecutionAgent, WDKContext } from '../execution-agent';
import { getWallet } from '../utils/wallet';
import { groqExecutionCallLLM } from '../services/ai.service';
import type { StrategyDecision, WDKAction } from '../strategy-agent/types';
import logger from '../utils/logger';
import prisma from '../utils/prisma';
import { createInvestment } from '../services/investment.service';
import { runRiskAgent } from '../risk-agent';

export const testExecution = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scenario = req.query.scenario as string || 'lend';

    // Get the 3rd user from the users table
    const thirdUser = await prisma.user.findFirst({
      skip: 2,
    });
    const userSeedPhrase = thirdUser?.seedPhrase || undefined;

    // getWallet returns account, address, and seedPhrase
    const { account, address } = await getWallet(userSeedPhrase);

    // Print the public address
    console.log(`[Execution Controller] Using 3rd user's wallet address: ${address}`);

    let usdtBalanceNum = 0;
    try {
      const ethBalance = await account.getBalance();
      const usdtBalance = await account.getTokenBalance('0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'); // USDT testnet
      usdtBalanceNum = Number(usdtBalance) / 1_000_000;
      console.log(`[Execution Controller] Sepolia ETH Balance: ${ethBalance.toString()}`);
      console.log(`[Execution Controller] USDT Balance: ${usdtBalance.toString()} (${usdtBalanceNum} USDT)`);
    } catch (err) {
      console.error(`[Execution Controller] Failed to fetch balances:`, err);
    }

    const ctx: WDKContext = {
      evmAccount: account,
      totalPortfolioUSDT: usdtBalanceNum || 1000,
      swapMaxFee: undefined,
    };

    let actions: WDKAction[] = [];
    let regime: string = 'neutral';

    switch (scenario) {
      case 'lend':
        regime = 'yield_farm';
        actions = [
          { type: 'lend', asset: 'USDT', portfolioPct: 50, protocol: 'aave-evm', reason: 'Lending 50% of our actual USDT balance on Aave.' }
        ];
        break;
      case 'hedge':
        regime = 'risk_off';
        actions = [
          { type: 'swap', from: 'USDT', to: 'XAUT', portfolioPct: 30, reason: 'Market uncertainty detected. Hedging 30% of portfolio into XAUT.' }
        ];
        break;
      case 'risk_on':
        regime = 'risk_on';
        actions = [
          { type: 'swap', from: 'USDT', to: 'ETH', portfolioPct: 40, reason: 'Bullish market conditions for Ethereum. Swapping 40% USDT to ETH.' },
          { type: 'swap', from: 'USDT', to: 'BTC', portfolioPct: 40, reason: 'Bullish market conditions for Bitcoin. Swapping 40% USDT to BTC.' }
        ];
        break;
      case 'withdraw':
        regime = 'neutral';
        actions = [
          { type: 'withdraw_lend', asset: 'USDT', portfolioPct: 50, protocol: 'aave-evm', reason: 'Yield dropped, withdrawing 50% from Aave.' }
        ];
        break;
      default:
        return res.status(400).json({ error: 'Unknown scenario. Valid options: lend, hedge, risk_on, withdraw' });
    }

    const mockStrategy: StrategyDecision = {
      theses: [],
      dominant_regime: regime as any,
      portfolio_allocation: {
        USDT: 100,
        USDT_lent: 0,
        ETH: 0,
        BTC: 0,
        XAUT: 0,
      },
      actions,
      overall_confidence: 0.9,
      time_horizon: 'short',
      signal_summary: `This is a simulated ${scenario} scenario for testing the execution agent.`,
      signal_breakdown: {
        total: 1,
        relevant: 1,
        ignored: 0,
        bullish: 0,
        bearish: 0,
        neutral: 1,
        uncertain: 0,
        avgConfidence: 0.9,
        totalVolume: 1000000,
        affectedAssets: [],
        categoryCounts: { crypto_direct: 1, macro: 0, political: 0, sentiment: 0, second_order: 0 }
      },
      ignored_signal_reasons: {},
      created_at: Date.now(),
    };

    // ── Risk Agent ─────────────────────────────────────────────────────────
    const riskAssessment = runRiskAgent(mockStrategy);
    logger.info(`[RiskAgent] score=${riskAssessment.riskScore} level=${riskAssessment.riskLevel} approved=${riskAssessment.approved}`);

    if (!riskAssessment.approved) {
      return res.status(422).json({
        status: 'blocked',
        reason: 'Risk agent rejected the strategy',
        riskAssessment,
      });
    }

    logger.info(`Running execution agent for scenario: ${scenario}`);

    const execution = await runExecutionAgent(mockStrategy, ctx, groqExecutionCallLLM);

    // Persist to the investments table if at least one step succeeded
    let investmentId: number | null = null;
    if (thirdUser && execution.summary.succeeded > 0) {
      try {
        const saved = await createInvestment(thirdUser.id, mockStrategy, execution, riskAssessment);
        investmentId = saved.id;
        logger.info(`Investment saved with id=${investmentId}`);
      } catch (err) {
        logger.error('Failed to save investment:', err);
      }
    }

    res.status(200).json({
      status: 'success',
      scenario,
      riskAssessment,
      strategy: mockStrategy,
      execution,
      investmentId,
    });
  } catch (error) {
    next(error);
  }
};
