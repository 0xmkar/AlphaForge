import express from 'express';
import * as signalController from '../controllers/signal.controller';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Signals
 *   description: AI-driven macro signals from Polymarket
 */

/**
 * @swagger
 * /signals:
 *   get:
 *     summary: Get relevant crypto signals from Polymarket
 *     description: Fetches top generic Polymarket events, batches them 5 by 5 to an AI agent, and returns the filtered relevant signals. Be aware that this endpoint might take some time to respond due to multiple LLM calls.
 *     tags: [Signals]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of top markets to fetch from Polymarket
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       market:
 *                         type: string
 *                       is_relevant:
 *                         type: boolean
 *                       categories:
 *                         type: object
 *                       impact_direction:
 *                         type: string
 *                       affected_assets:
 *                         type: array
 *                         items:
 *                           type: string
 *                       time_horizon:
 *                         type: string
 *                       reasoning:
 *                         type: string
 *                       confidence:
 *                         type: number
 */
router.get('/', signalController.getSignals);

export default router;
