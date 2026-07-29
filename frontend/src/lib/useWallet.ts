import { useAccount } from "wagmi";

export const STUDIONET_CHAIN_ID = 61999;

export interface WalletState {
  address?: `0x${string}`;
  isConnected: boolean;
  chainId?: number;
  wrongChain: boolean;
  // Resolve the connected wallet's raw EIP-1193 provider (MetaMask/Rabby/…).
  // genlayer-js routes eth_sendTransaction through this so the wallet signs.
  getProvider: () => Promise<unknown>;
}

export function useWallet(): WalletState {
  const { address, isConnected, connector, chainId } = useAccount();
  return {
    address,
    isConnected,
    chainId,
    wrongChain: isConnected && chainId !== STUDIONET_CHAIN_ID,
    getProvider: async () => (connector ? await connector.getProvider() : undefined),
  };
}
