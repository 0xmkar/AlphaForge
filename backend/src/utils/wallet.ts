import WDK from '@tetherto/wdk';
import WalletManagerEvm from '@tetherto/wdk-wallet-evm';
import { NETWORKS } from './networks';

export const getWallet = async (existingSeedPhrase?: string) => {
  const seedPhrase = existingSeedPhrase || WDK.getRandomSeedPhrase();
  const wdk = new WDK(seedPhrase);

  const sdk = wdk.registerWallet('ethereum', WalletManagerEvm, {
    provider: NETWORKS.sepolia.rpc,
  });

  const account = await sdk.getAccount('ethereum', 0);

  return {
    account,
    address: await account.getAddress(),
    seedPhrase,
  };
};