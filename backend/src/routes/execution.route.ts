import express from 'express';
import * as executionController from '../controllers/execution.controller';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Execution
 *   description: Test Execution Agent easily
 */

/**
 * @swagger
 * /execution/test:
 *   get:
 *     summary: Test the execution agent with mock scenarios
 *     description: Provides a dummy StrategyDecision to the execution agent to test its ability to call tools.
 *     tags: [Execution]
 *     parameters:
 *       - in: query
 *         name: scenario
 *         schema:
 *           type: string
 *           enum: [lend, hedge, risk_on, withdraw]
 *           default: lend
 *         description: The scenario to simulate against the execution agent
 *     responses:
 *       "200":
 *         description: OK
 */
router.get('/test', executionController.testExecution);

export default router;
