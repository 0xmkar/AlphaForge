import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { getInvestmentsByUser } from '../services/investment.service';

export const getUserInvestments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const investments = await getInvestmentsByUser(userId);
    res.status(200).json({ investments });
  } catch (error) {
    console.error('Error fetching user investments:', error);
    res.status(500).json({ message: 'Internal server error while fetching investments' });
  }
};
