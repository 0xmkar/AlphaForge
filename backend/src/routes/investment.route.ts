import express from 'express';
import { getUserInvestments } from '../controllers/investment.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Investments
 *   description: Investment related routes
 */

/**
 * @swagger
 * /investments:
 *   get:
 *     summary: Get user investments
 *     description: Returns all investments for the logged-in user
 *     tags: [Investments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Investments retrieved successfully
 *       "401":
 *         description: Unauthorized
 *       "500":
 *         description: Internal server error
 */
router.get('/', authenticate, getUserInvestments);

export default router;
