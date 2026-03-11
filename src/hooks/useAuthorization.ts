import { useState, useCallback } from 'react';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { PublicKey } from '@solana/web3.js';
import { toUint8Array } from 'js-base64';

const APP_IDENTITY = {
  name: 'MAGMA Protocol',
  uri: 'https://magmaprotocol.xyz',
  icon: 'favicon.ico',
};

const CLUSTER = 'devnet';

export interface AuthorizedAccount {
  address: string;
  publicKey: PublicKey;
  label?: string;
  walletUriBase?: string;
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
      await transact(async (wallet) => {
        const authResult = await wallet.authorize({
          cluster: CLUSTER,
          identity: APP_IDENTITY,
        });
        const { accounts, auth_token } = authResult;
        if (!accounts || accounts.length === 0) {
          throw new Error('No accounts returned from wallet');
        }
        const firstAccount = accounts[0];
        const publicKey = new PublicKey(toUint8Array(firstAccount.address));
        setAccount({
          address: publicKey.toBase58(),
          publicKey,
          label: firstAccount.label,
          walletUriBase: authResult.wallet_uri_base,
        });
        setIsConnected(true);
      });
    } catch (err: any) {
      console.error('[useAuthorization] Connect failed:', err);
      if (err?.message?.includes('User rejected')) {
        setError('Connection rejected by user');
      } else if (err?.message?.includes('No wallet')) {
        setError('No wallet app found. Install Phantom, Backpack or Solflare.');
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
