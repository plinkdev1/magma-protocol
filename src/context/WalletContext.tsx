import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { transact, Web3MobileWallet } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { PublicKey } from '@solana/web3.js';

const APP_IDENTITY = {
  name: 'MAGMA Protocol',
  uri: 'https://magmaprotocol.xyz',
  icon: 'favicon.ico',
};

export interface AuthorizedAccount {
  address: string;
  publicKey: PublicKey;
  label?: string;
  authToken?: string;
}

interface WalletContextType {
  account: AuthorizedAccount | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
  account: null,
  isConnected: false,
  isConnecting: false,
  error: null,
  connect: async () => {},
  disconnect: () => {},
});

export const useWallet = () => useContext(WalletContext);
export const useAuthorization = useWallet;

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [account, setAccount] = useState<AuthorizedAccount | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    setError(null);
    try {
      await transact(async (wallet: Web3MobileWallet) => {
        const authResult = await wallet.authorize({
          cluster: 'devnet',
          identity: APP_IDENTITY,
        });
        const firstAccount = authResult.accounts[0];
        const addressBytes = typeof firstAccount.address === 'string'
          ? Buffer.from(firstAccount.address, 'base64')
          : firstAccount.address;
        const publicKey = new PublicKey(addressBytes);
        setAccount({
          address: publicKey.toBase58(),
          publicKey,
          label: firstAccount.label,
          authToken: authResult.auth_token,
        });
        setIsConnected(true);
      });
    } catch (err) {
      console.error('[WalletContext] Connect failed:', err);
      setError(err?.message || 'Wallet connection failed');
      setIsConnected(false);
      setAccount(null);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting]);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setAccount(null);
    setError(null);
  }, []);

  return (
    <WalletContext.Provider value={{ account, isConnected, isConnecting, error, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
};
