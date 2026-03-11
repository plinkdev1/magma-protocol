import { useState, useCallback } from 'react';
import {
  transact,
  Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
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

export const useAuthorization = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<AuthorizedAccount | null>(null);
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
        const publicKey = new PublicKey(firstAccount.address);
        setAccount({
          address: publicKey.toBase58(),
          publicKey,
          label: firstAccount.label,
          authToken: authResult.auth_token,
        });
        setIsConnected(true);
      });
    } catch (err: any) {
      console.error('[useAuthorization] Connect failed:', err);
      if (err?.message?.includes('User rejected') || err?.errorCode === 'USER_DECLINED') {
        setError('Connection rejected');
      } else {
        setError(err?.message || 'Wallet connection failed');
      }
      setIsConnected(false);
      setAccount(null);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting]);

  const disconnect = useCallback(async () => {
    setIsConnected(false);
    setAccount(null);
    setError(null);
  }, []);

  return {
    connect,
    disconnect,
    isConnected,
    isConnecting,
    account,
    error,
  };
};

export default useAuthorization;
