import express from 'express';
import { signup, login, getProfile } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication routes
 */

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user with email, password, and wallet.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - wallet
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: securepassword123
 *               name:
 *                 type: string
 *                 example: John Doe
 *     responses:
 *       "201":
 *         description: User created successfully
 *       "400":
 *         description: Bad request (missing fields or user exists)
 *       "500":
 *         description: Internal server error
 */
router.post('/signup', signup);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticates a user and returns a JWT token.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: securepassword123
 *     responses:
 *       "200":
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     wallet:
 *                       type: string
 *                     name:
 *                       type: string
 *       "401":
 *         description: Invalid credentials
 *       "500":
 *         description: Internal server error
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get user profile and balances
 *     description: Returns the logged-in user's details and real on-chain token balances.
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   example:
 *                     id: "123"
 *                     email: "user@example.com"
 *                 balances:
 *                   type: object
 *                   example:
 *                     USDT: "100.5"
 *                     ETH: "0.2"
 *       "401":
 *         description: Unauthorized - Missing or invalid token
 *       "500":
 *         description: Internal server error
 */
router.get('/profile', authenticate, getProfile);

export default router;
