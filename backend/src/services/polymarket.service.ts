import axios from 'axios';
import logger from '../utils/logger';

export interface PolymarketEvent {
  id: string;
  question: string;
  description: string;
  outcomes: string[];
  outcomePrices: string[];
  volumeNum: number;
}

export const fetchTopMarkets = async (limit: number = 50): Promise<PolymarketEvent[]> => {
  try {
    logger.info(`Fetching top ${limit} markets from Polymarket...`);
    const url = `https://gamma-api.polymarket.com/markets?active=true&closed=false&order=volumeNum&ascending=false&limit=${limit}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    logger.error(`Error fetching Polymarket data: ${error}`);
    throw new Error('Failed to fetch from Polymarket API');
  }
};
