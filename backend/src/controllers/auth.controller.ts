import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import logger from '../utils/logger';
import { getWallet } from '../utils/wallet';
import { TOKEN_ADDRESSES } from '../execution-agent/types';
import { AuthRequest } from '../middlewares/auth.middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email, password are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new wallet
    const walletInfo = await getWallet();

    // Create the user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        wallet: walletInfo.address,
        seedPhrase: walletInfo.seedPhrase,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      message: 'User created successfully',
      user,
    });
  } catch (error) {
    logger.error(`Signup error: ${error}`);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, wallet: user.wallet },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        wallet: user.wallet,
        name: user.name,
      },
    });
  } catch (error) {
    logger.error(`Login error: ${error}`);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const walletInfo = await getWallet(user.seedPhrase);
    const account = walletInfo.account as any;

    const ethBalance = await account.getBalance();
    const usdtBalance = await account.getTokenBalance(TOKEN_ADDRESSES.USDT);
    const btcBalance = await account.getTokenBalance(TOKEN_ADDRESSES.BTC);
    const xautBalance = await account.getTokenBalance(TOKEN_ADDRESSES.XAUT);

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        wallet: user.wallet,
        name: user.name,
      },
      balances: {
        ETH: ethBalance.toString(),
        USDT: usdtBalance.toString(),
        BTC: btcBalance.toString(),
        XAUT: xautBalance.toString(),
      }
    });

  } catch (error) {
    logger.error(`Get profile error: ${error}`);
    res.status(500).json({ message: 'Internal server error' });
  }
};
