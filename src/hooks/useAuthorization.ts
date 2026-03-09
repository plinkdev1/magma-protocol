import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { PublicKey } from '@solana/web3.js';

// Storage keys
const STORAGE_KEYS = {
  AUTH_TOKEN: 'magma_auth_token',
  ACCOUNT_ADDRESS: 'magma_account_address',
};

// Authorization state interface
interface AuthorizationState {
  account: PublicKey | null;
  authToken: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  setAccount: (address: string | null) => void;
  setAuthToken: (token: string | null) => void;
  clearError: () => void;
}

// Secure storage wrapper
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch (error) {
      console.error(`[useAuthorization] Failed to read ${name}:`, error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch (error) {
      console.error(`[useAuthorization] Failed to write ${name}:`, error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch (error) {
      console.error(`[useAuthorization] Failed to delete ${name}:`, error);
    }
  },
};

// Zustand store with persistence
export const useAuthorizationStore = create<AuthorizationState>()(
  persist(
    (set, get) => ({
      account: null,
      authToken: null,
      isConnected: false,
      isConnecting: false,
      error: null,

      setAccount: (address: string | null) => {
        if (address) {
          secureStorage.setItem(STORAGE_KEYS.ACCOUNT_ADDRESS, address);
        } else {
          secureStorage.removeItem(STORAGE_KEYS.ACCOUNT_ADDRESS);
        }
        set({ account: address ? new PublicKey(address) : null });
      },

      setAuthToken: (token: string | null) => {
        if (token) {
          secureStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        } else {
          secureStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        }
        set({ authToken: token });
      },

      clearError: () => set({ error: null }),

      connect: async () => {
        const state = get();
        if (state.isConnecting) {
          console.warn('[useAuthorization] Connection already in progress');
          return;
        }

        set({ isConnecting: true, error: null });

        try {
          const result = await transact(async (wallet) => {
            // Get account authorization
            const authorization = await wallet.authorize({
              authorizationParams: {
                chainId: 'solana:devnet',
              },
            });

            if (!authorization || !authorization.accounts || authorization.accounts.length === 0) {
              throw new Error('No accounts returned from authorization');
            }

            const accountAddress = authorization.accounts[0].address;
            const authToken = authorization.authToken;

            // Update store with authorized account
            get().setAccount(accountAddress);
            get().setAuthToken(authToken);

            return {
              account: new PublicKey(accountAddress),
              authToken,
            };
          });

          set({
            account: result.account,
            authToken: result.authToken,
            isConnected: true,
            isConnecting: false,
            error: null,
          });

          console.log('[useAuthorization] Wallet connected:', result.account.toBase58());
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
          console.error('[useAuthorization] Connection failed:', error);
          set({
            isConnecting: false,
            error: errorMessage,
            isConnected: false,
          });
          throw error;
        }
      },

      disconnect: async () => {
        try {
          await transact(async (wallet) => {
            const { authToken } = get();
            if (authToken) {
              await wallet.deauthorize({ authToken });
            }
          });
        } catch (error) {
          console.error('[useAuthorization] Deauthorization failed:', error);
        } finally {
          // Always clear local state even if deauth fails
          get().setAccount(null);
          get().setAuthToken(null);
          set({
            account: null,
            authToken: null,
            isConnected: false,
            error: null,
          });
          console.log('[useAuthorization] Wallet disconnected');
        }
      },
    }),
    {
      name: 'magma-authorization',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        account: state.account ? state.account.toBase58() : null,
        authToken: state.authToken,
        isConnected: state.isConnected,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.account && typeof state.account === 'string') {
          state.account = new PublicKey(state.account);
        }
      },
    }
  )
);

// Convenience hook for component usage
export const useAuthorization = () => {
  const store = useAuthorizationStore();
  return {
    account: store.account,
    authToken: store.authToken,
    isConnected: store.isConnected,
    isConnecting: store.isConnecting,
    error: store.error,
    connect: store.connect,
    disconnect: store.disconnect,
    clearError: store.clearError,
  };
};

// Named exports for direct access
export const connect = async () => {
  await useAuthorizationStore.getState().connect();
};

export const disconnect = async () => {
  await useAuthorizationStore.getState().disconnect();
};

export { useAuthorizationStore };
