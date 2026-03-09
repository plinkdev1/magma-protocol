import { useCallback } from 'react';
import { Alert } from 'react-native';
import {
  PublicKey,
  Transaction,
  VersionedTransaction,
  Connection,
  TransactionInstruction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import * as Haptics from 'expo-haptics';
import axios from 'axios';

import { useAuthorization } from './useAuthorization';

// Design tokens
const COLORS = {
  success: '#00ff88',
  error: '#ff3355',
};

// Configuration
const SOLANA_DEVNET_RPC = 'https://api.devnet.solana.com';
const SOLANA_MAINNET_RPC = 'https://api.mainnet-beta.solana.com';
const JUPITER_API_URL = 'https://quote-api.jup.ag/v6';
const MAGMA_TOKEN_MINT = 'MAGMA_TOKEN_MINT_ADDRESS'; // Replace with actual mint

const connection = new Connection(SOLANA_DEVNET_RPC, 'confirmed');

// Transaction result interface
interface TransactionResult {
  signature: string;
  success: boolean;
  error?: string;
}

// Toast notification helper
const showToast = (message: string, type: 'success' | 'error') => {
  Alert.alert(
    type === 'success' ? '✅ Success' : '❌ Error',
    message,
    [{ text: 'OK', style: type === 'success' ? 'default' : 'cancel' }],
    { cancelable: true }
  );
};

// Haptic feedback helper
const triggerHaptic = async (type: 'success' | 'error' | 'loading') => {
  try {
    switch (type) {
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'loading':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
    }
  } catch (error) {
    console.error('[useMagmaTransactions] Haptic feedback failed:', error);
  }
};

// Hook for minting narrative cNFT
export const useMintNarrative = () => {
  const { isConnected, account } = useAuthorization();

  const mintNarrative = useCallback(
    async (narrativeId: string, metadata: { name: string; uri: string }): Promise<TransactionResult> => {
      if (!isConnected || !account) {
        const error = 'Wallet not connected';
        showToast(error, 'error');
        await triggerHaptic('error');
        return { signature: '', success: false, error };
      }

      try {
        await triggerHaptic('loading');

        const result = await transact(async (wallet) => {
          // Get authorization
          const authorization = await wallet.authorize({
            authorizationParams: {
              chainId: 'solana:devnet',
            },
          });

          // Fetch mint instruction from backend
          const response = await axios.post('http://localhost:3000/v1/narratives/mint-cnft', {
            narrativeId,
            metadata,
            ownerAddress: account.toBase58(),
          });

          const { instructions: instructionData } = response.data;

          // Deserialize instructions
          const instructions: TransactionInstruction[] = instructionData.map(
            (ix: any) =>
              new TransactionInstruction({
                programId: new PublicKey(ix.programId),
                keys: ix.keys.map((key: any) => ({
                  pubkey: new PublicKey(key.pubkey),
                  isSigner: key.isSigner,
                  isWritable: key.isWritable,
                })),
                data: Buffer.from(ix.data, 'base64'),
              })
          );

          // Create and sign transaction
          const transaction = new Transaction().add(...instructions);
          const { feePayer, recentBlockhash } = await connection.getLatestBlockhash();
          transaction.feePayer = account;
          transaction.recentBlockhash = recentBlockhash;

          const signed = await wallet.signTransactions({
            transactions: [transaction],
            authToken: authorization.authToken,
          });

          const signedTx = signed.signedTransactions[0];

          // Send transaction
          const signature = await connection.sendRawTransaction(signedTx.serialize());

          // Confirm transaction
          const confirmation = await connection.confirmTransaction({
            signature,
            blockhash: recentBlockhash,
            lastValidBlockHeight: await connection.getBlockHeight(),
          });

          if (confirmation.value.err) {
            throw new Error('Transaction failed');
          }

          return { signature, success: true };
        });

        await triggerHaptic('success');
        showToast(`cNFT minted! ${result.signature.slice(0, 8)}...${result.signature.slice(-8)}`, 'success');

        return result;
      } catch (error) {
        console.error('[useMagmaTransactions] Mint narrative failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to mint cNFT';
        await triggerHaptic('error');
        showToast(errorMessage, 'error');
        return { signature: '', success: false, error: errorMessage };
      }
    },
    [isConnected, account]
  );

  return { mintNarrative };
};

// Hook for staking on narrative
export const useStakeOnNarrative = () => {
  const { isConnected, account } = useAuthorization();

  const stakeOnNarrative = useCallback(
    async (narrativeId: string, amountSol: number): Promise<TransactionResult> => {
      if (!isConnected || !account) {
        const error = 'Wallet not connected';
        showToast(error, 'error');
        await triggerHaptic('error');
        return { signature: '', success: false, error };
      }

      if (amountSol <= 0) {
        const error = 'Invalid stake amount';
        showToast(error, 'error');
        await triggerHaptic('error');
        return { signature: '', success: false, error };
      }

      try {
        await triggerHaptic('loading');

        const result = await transact(async (wallet) => {
          // Get authorization
          const authorization = await wallet.authorize({
            authorizationParams: {
              chainId: 'solana:devnet',
            },
          });

          // Fetch stake instruction from backend
          const response = await axios.post('http://localhost:3000/v1/narratives/stake', {
            narrativeId,
            amountLamports: Math.floor(amountSol * LAMPORTS_PER_SOL),
            stakerAddress: account.toBase58(),
          });

          const { instructions: instructionData } = response.data;

          // Deserialize instructions
          const instructions: TransactionInstruction[] = instructionData.map(
            (ix: any) =>
              new TransactionInstruction({
                programId: new PublicKey(ix.programId),
                keys: ix.keys.map((key: any) => ({
                  pubkey: new PublicKey(key.pubkey),
                  isSigner: key.isSigner,
                  isWritable: key.isWritable,
                })),
                data: Buffer.from(ix.data, 'base64'),
              })
          );

          // Create and sign transaction
          const transaction = new Transaction().add(...instructions);
          const { feePayer, recentBlockhash } = await connection.getLatestBlockhash();
          transaction.feePayer = account;
          transaction.recentBlockhash = recentBlockhash;

          const signed = await wallet.signTransactions({
            transactions: [transaction],
            authToken: authorization.authToken,
          });

          const signedTx = signed.signedTransactions[0];

          // Send transaction
          const signature = await connection.sendRawTransaction(signedTx.serialize());

          // Confirm transaction
          const confirmation = await connection.confirmTransaction({
            signature,
            blockhash: recentBlockhash,
            lastValidBlockHeight: await connection.getBlockHeight(),
          });

          if (confirmation.value.err) {
            throw new Error('Transaction failed');
          }

          return { signature, success: true };
        });

        await triggerHaptic('success');
        showToast(`Staked ${amountSol} SOL! ${result.signature.slice(0, 8)}...${result.signature.slice(-8)}`, 'success');

        return result;
      } catch (error) {
        console.error('[useMagmaTransactions] Stake on narrative failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to stake';
        await triggerHaptic('error');
        showToast(errorMessage, 'error');
        return { signature: '', success: false, error: errorMessage };
      }
    },
    [isConnected, account]
  );

  return { stakeOnNarrative };
};

// Hook for community vote
export const useCommunityVote = () => {
  const { isConnected, account } = useAuthorization();

  const submitVote = useCallback(
    async (narrativeId: string, vote: 'up' | 'down'): Promise<TransactionResult> => {
      if (!isConnected || !account) {
        const error = 'Wallet not connected';
        showToast(error, 'error');
        await triggerHaptic('error');
        return { signature: '', success: false, error };
      }

      try {
        await triggerHaptic('loading');

        const result = await transact(async (wallet) => {
          // Get authorization
          const authorization = await wallet.authorize({
            authorizationParams: {
              chainId: 'solana:devnet',
            },
          });

          // Fetch vote instruction from backend
          const response = await axios.post('http://localhost:3000/v1/narratives/vote', {
            narrativeId,
            vote,
            voterAddress: account.toBase58(),
          });

          const { instructions: instructionData } = response.data;

          // Deserialize instructions
          const instructions: TransactionInstruction[] = instructionData.map(
            (ix: any) =>
              new TransactionInstruction({
                programId: new PublicKey(ix.programId),
                keys: ix.keys.map((key: any) => ({
                  pubkey: new PublicKey(key.pubkey),
                  isSigner: key.isSigner,
                  isWritable: key.isWritable,
                })),
                data: Buffer.from(ix.data, 'base64'),
              })
          );

          // Create and sign transaction
          const transaction = new Transaction().add(...instructions);
          const { feePayer, recentBlockhash } = await connection.getLatestBlockhash();
          transaction.feePayer = account;
          transaction.recentBlockhash = recentBlockhash;

          const signed = await wallet.signTransactions({
            transactions: [transaction],
            authToken: authorization.authToken,
          });

          const signedTx = signed.signedTransactions[0];

          // Send transaction
          const signature = await connection.sendRawTransaction(signedTx.serialize());

          // Confirm transaction
          const confirmation = await connection.confirmTransaction({
            signature,
            blockhash: recentBlockhash,
            lastValidBlockHeight: await connection.getBlockHeight(),
          });

          if (confirmation.value.err) {
            throw new Error('Transaction failed');
          }

          return { signature, success: true };
        });

        await triggerHaptic('success');
        showToast(`Vote submitted! ${result.signature.slice(0, 8)}...${result.signature.slice(-8)}`, 'success');

        return result;
      } catch (error) {
        console.error('[useMagmaTransactions] Community vote failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to submit vote';
        await triggerHaptic('error');
        showToast(errorMessage, 'error');
        return { signature: '', success: false, error: errorMessage };
      }
    },
    [isConnected, account]
  );

  return { submitVote };
};

// Hook for Jupiter swap
export const useJupiterSwap = () => {
  const { isConnected, account } = useAuthorization();

  const swap = useCallback(
    async (amountSol: number, slippageBps: number = 50): Promise<TransactionResult> => {
      if (!isConnected || !account) {
        const error = 'Wallet not connected';
        showToast(error, 'error');
        await triggerHaptic('error');
        return { signature: '', success: false, error };
      }

      if (amountSol <= 0) {
        const error = 'Invalid swap amount';
        showToast(error, 'error');
        await triggerHaptic('error');
        return { signature: '', success: false, error };
      }

      try {
        await triggerHaptic('loading');

        const result = await transact(async (wallet) => {
          // Get authorization
          const authorization = await wallet.authorize({
            authorizationParams: {
              chainId: 'solana:devnet',
            },
          });

          // Get quote from Jupiter
          const quoteResponse = await axios.get(`${JUPITER_API_URL}/quote`, {
            params: {
              inputMint: 'So11111111111111111111111111111111111111112', // SOL
              outputMint: MAGMA_TOKEN_MINT,
              amount: Math.floor(amountSol * LAMPORTS_PER_SOL),
              slippageBps,
              onlyDirectRoutes: false,
            },
          });

          // Get swap transaction
          const swapResponse = await axios.post(`${JUPITER_API_URL}/swap`, {
            quoteResponse: quoteResponse.data,
            userPublicKey: account.toBase58(),
            wrapAndUnwrapSol: true,
            dynamicComputeUnitLimit: true,
            prioritizationFeeLamports: 'auto',
          });

          // Deserialize swap transaction
          const swapTransactionBuf = Buffer.from(swapResponse.data.swapTransaction, 'base64');
          const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

          // Sign transaction with MWA
          const signed = await wallet.signTransactions({
            transactions: [transaction],
            authToken: authorization.authToken,
          });

          const signedTx = signed.signedTransactions[0] as VersionedTransaction;

          // Send transaction
          const signature = await connection.sendRawTransaction(signedTx.serialize(), {
            skipPreflight: false,
            preflightCommitment: 'confirmed',
          });

          // Confirm transaction
          const confirmation = await connection.confirmTransaction({
            signature,
            blockhash: transaction.message.recentBlockhash,
            lastValidBlockHeight: await connection.getBlockHeight(),
          });

          if (confirmation.value.err) {
            throw new Error('Transaction failed');
          }

          return { signature, success: true };
        });

        await triggerHaptic('success');
        showToast(`Swapped ${amountSol} SOL to $MAGMA! ${result.signature.slice(0, 8)}...${result.signature.slice(-8)}`, 'success');

        return result;
      } catch (error) {
        console.error('[useMagmaTransactions] Jupiter swap failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to swap';
        await triggerHaptic('error');
        showToast(errorMessage, 'error');
        return { signature: '', success: false, error: errorMessage };
      }
    },
    [isConnected, account]
  );

  return { swap };
};

// Combined hook for all transaction types
export const useMagmaTransactions = () => {
  const { mintNarrative } = useMintNarrative();
  const { stakeOnNarrative } = useStakeOnNarrative();
  const { submitVote } = useCommunityVote();
  const { swap } = useJupiterSwap();

  return {
    mintNarrative,
    stakeOnNarrative,
    submitVote,
    swap,
  };
};

export default useMagmaTransactions;
