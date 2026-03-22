import express from 'express';
import * as strategyController from '../controllers/strategy.controller';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Strategy
 *   description: Strategy Agent — converts SignalOutput[] into a StrategyDecision
 */

/**
 * @swagger
 * /strategy:
 *   post:
 *     summary: Run the Strategy Agent on a set of signals
 *     description: >
 *       Accepts an array of SignalOutput objects (as produced by the Signal Agent)
 *       and returns a fully-resolved StrategyDecision including the classified macro
 *       regime, proposed WDK actions, and an LLM-generated reasoning string.
 *     tags: [Strategy]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - signals
 *             properties:
 *               signals:
 *                 type: array
 *                 description: Array of SignalOutput objects from the Signal Agent
 *                 items:
 *                   type: object
 *                   properties:
 *                     market:
 *                       type: string
 *                     is_relevant:
 *                       type: boolean
 *                     categories:
 *                       type: object
 *                     impact_direction:
 *                       type: string
 *                       enum: [bullish, bearish, neutral, uncertain]
 *                     affected_assets:
 *                       type: array
 *                       items:
 *                         type: string
 *                     time_horizon:
 *                       type: string
 *                       enum: [short, mid, long]
 *                     reasoning:
 *                       type: string
 *                     confidence:
 *                       type: number
 *                     percentage_yes:
 *                       type: number
 *                     percentage_no:
 *                       type: number
 *                     volume:
 *                       type: number
 *                     people_giving_opinion:
 *                       type: number
 *     responses:
 *       "200":
 *         description: StrategyDecision
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     regime:
 *                       type: string
 *                       enum: [risk_on, risk_off, gold_hedge, neutral]
 *                     reasoning:
 *                       type: string
 *                     confidence:
 *                       type: number
 *                     actions:
 *                       type: array
 *                       items:
 *                         type: object
 *                     time_horizon:
 *                       type: string
 *                     signal_summary:
 *                       type: string
 *                     created_at:
 *                       type: number
 *       "400":
 *         description: Bad request — missing or invalid `signals` array
 */
router.post('/', strategyController.runStrategy);

export default router;
