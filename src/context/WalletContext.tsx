import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { transact, Web3MobileWallet } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { PublicKey } from '@solana/web3.js';
import { API_URL } from '../config';

export const APP_IDENTITY = {
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

export interface NFTState {
  mlava_tier:             string | null;
  mlava_mint:             string | null;
  genesis_holder:         boolean;
  mlava_yield_multiplier: number;
  total_yield_multiplier: number;
}

const DEFAULT_NFT_STATE: NFTState = {
  mlava_tier:             null,
  mlava_mint:             null,
  genesis_holder:         false,
  mlava_yield_multiplier: 1.0,
  total_yield_multiplier: 1.0,
};

interface WalletContextType {
  account:      AuthorizedAccount | null;
  isConnected:  boolean;
  isConnecting: boolean;
  error:        string | null;
  nftState:     NFTState;
  connect:      () => Promise<void>;
  disconnect:   () => void;
  refreshNFTState: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  account:      null,
  isConnected:  false,
  isConnecting: false,
  error:        null,
  nftState:     DEFAULT_NFT_STATE,
  connect:      async () => {},
  disconnect:   () => {},
  refreshNFTState: async () => {},
});

export const useWallet = () => useContext(WalletContext);
export const useAuthorization = useWallet;

async function fetchNFTState(walletAddress: string): Promise<NFTState> {
  try {
    const res = await fetch(`${API_URL}/v1/conviction/nft/wallet/${walletAddress}`);
    if (!res.ok) return DEFAULT_NFT_STATE;
    return await res.json();
  } catch {
    return DEFAULT_NFT_STATE;
  }
}

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [account,      setAccount]      = useState<AuthorizedAccount | null>(null);
  const [isConnected,  setIsConnected]  = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [nftState,     setNftState]     = useState<NFTState>(DEFAULT_NFT_STATE);

  // Restore wallet session on app launch via stored auth token
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const stored = await AsyncStorage.getItem('magma_wallet');
        if (!stored) return;
        const { authToken, address } = JSON.parse(stored);
        if (!authToken || !address) return;
        setIsConnecting(true);
        await transact(async (wallet) => {
          const reauth = await wallet.reauthorize({ auth_token: authToken, identity: APP_IDENTITY });
          const firstAccount = reauth.accounts[0];
          const addressBytes = typeof firstAccount.address === 'string'
            ? Buffer.from(firstAccount.address, 'base64')
            : firstAccount.address;
          const publicKey = new PublicKey(addressBytes);
          const restoredAddress = publicKey.toBase58();
          await AsyncStorage.setItem('magma_wallet', JSON.stringify({ authToken: reauth.auth_token, address: restoredAddress }));
          setAccount({ address: restoredAddress, publicKey, label: firstAccount.label, authToken: reauth.auth_token });
          setIsConnected(true);
          fetchNFTState(restoredAddress).then(setNftState).catch(() => {});
        });
      } catch (err) {
        console.log('[WalletContext] Session restore failed — clearing storage');
        AsyncStorage.removeItem('magma_wallet').catch(() => {});
        setIsConnected(false);
        setAccount(null);
      } finally {
        setIsConnecting(false);
      }
    };
    restoreSession();
  }, []);

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
        const address = publicKey.toBase58();
        setAccount({
          address,
          publicKey,
          label: firstAccount.label,
          authToken: authResult.auth_token,
        });
        setIsConnected(true);
              AsyncStorage.setItem('magma_wallet', JSON.stringify({ authToken: authResult.auth_token, address })).catch(() => {});
              // Fetch NFT state after successful connect — non-blocking
        fetchNFTState(address).then(setNftState).catch(() => {});
        // Terms check removed -- do not clear local terms on wallet connect

      });
    } catch (err) {
      console.error('[WalletContext] Connect failed:', err);
      setError((err as any)?.message || 'Wallet connection failed');
      setIsConnected(false);
      setAccount(null);
      setNftState(DEFAULT_NFT_STATE);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting]);

  const disconnect = useCallback(() => {
        AsyncStorage.removeItem('magma_wallet').catch(() => {});
        setIsConnected(false);
    setAccount(null);
    setNftState(DEFAULT_NFT_STATE);
    setError(null);
  }, []);

  const refreshNFTState = useCallback(async () => {
    if (!account?.address) return;
    const state = await fetchNFTState(account.address);
    setNftState(state);
  }, [account]);

  return (
    <WalletContext.Provider value={{
      account, isConnected, isConnecting, error,
      nftState, connect, disconnect, refreshNFTState,
    }}>
      {children}
    </WalletContext.Provider>
  );
};
