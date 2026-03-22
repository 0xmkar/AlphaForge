import { isAddress } from 'ethers';
import { TOKEN_ADDRESSES } from './src/execution-agent/types';
console.log("Token:", TOKEN_ADDRESSES?.USDT);
console.log("isAddress:", isAddress(TOKEN_ADDRESSES?.USDT));
