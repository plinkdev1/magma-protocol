/**
 * useBackNarrative — wires the "Back This Narrative" button to the on-chain contract
 *
 * Phase B: SOL backing via magma_backing_vault program
 * Phase D: will add Kamino yield routing on top of this
 *
 * Usage in NarrativeDetailScreen:
 *   const { backNarrative, backing, txSignature, error, reset } = useBackNarrative();
 *
 *   <Button onPress={() => backNarrative(narrative.id, amountSol)} />
 *   {backing && <ActivityIndicator />}
 *   {txSignature && <Text>Backed! TX: {txSignature.slice(0,8)}...</Text>}
 */

import { useState, useCallback } from "react";
import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
} from "@solana/web3.js";
import { useWallet } from "../context/WalletContext";
import {
  MAGMA_PROGRAMS,
  ACTIVE_NETWORK,
  MIN_BACKING_SOL,
  MAX_BACKING_SOL,
  uuidToNarrativeIdBytes,
} from "../constants/programs";
import { API_URL } from "../config";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TokenType = "SOL" | "SKR";

export interface BackNarrativeResult {
  txSignature: string;
  amountSol: number;
  narrativeId: string;
}

export interface UseBackNarrativeReturn {
  backNarrative: (
    narrativeId: string,
    amountSol: number,
    tokenType?: TokenType
  ) => Promise<BackNarrativeResult>;
  backing: boolean;
  txSignature: string | null;
  error: string | null;
  reset: () => void;
}

// ─── PDA Derivation ──────────────────────────────────────────────────────────

/**
 * Derive vault PDA address for a narrative.
 * Seeds: ["vault", narrative_id_bytes]
 * Must match lib.rs PDA derivation exactly.
 */
async function deriveVaultPda(
  narrativeIdBytes: Uint8Array,
  programId: PublicKey
): Promise<PublicKey> {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), Buffer.from(narrativeIdBytes)],
    programId
  );
  return pda;
}

/**
 * Derive backing record PDA.
 * Seeds: ["backing", narrative_id_bytes, backer_pubkey]
 */
async function deriveBackingRecordPda(
  narrativeIdBytes: Uint8Array,
  backerPubkey: PublicKey,
  programId: PublicKey
): Promise<PublicKey> {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("backing"),
      Buffer.from(narrativeIdBytes),
      backerPubkey.toBuffer(),
    ],
    programId
  );
  return pda;
}

/**
 * Derive narrative state PDA.
 * Seeds: ["state", narrative_id_bytes]
 */
async function deriveNarrativeStatePda(
  narrativeIdBytes: Uint8Array,
  programId: PublicKey
): Promise<PublicKey> {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("state"), Buffer.from(narrativeIdBytes)],
    programId
  );
  return pda;
}

// ─── Instruction Builder ─────────────────────────────────────────────────────

/**
 * Build the back_narrative instruction data buffer.
 *
 * Anchor instruction layout:
 *   [0..8]    = discriminator (sha256("global:back_narrative")[0..8])
 *   [8..24]   = narrative_id_bytes ([u8; 16])
 *   [24..32]  = amount_lamports (u64, little-endian)
 *
 * The discriminator is the first 8 bytes of sha256("global:back_narrative").
 * Pre-computed: [75, 53, 44, 206, 68, 168, 58, 124]
 *
 * NOTE: If you regenerate the IDL, re-run this to verify the discriminator:
 *   anchor idl parse --file target/idl/magma_backing_vault.json
 */
function buildBackNarrativeInstruction(
  narrativeIdBytes: Uint8Array, // 16 bytes
  amountLamports: bigint,
  backerPubkey: PublicKey,
  backingRecordPda: PublicKey,
  vaultPda: PublicKey,
  narrativeStatePda: PublicKey,
  programId: PublicKey
): TransactionInstruction {
  // Anchor discriminator for back_narrative
  // Computed as: sha256("global:back_narrative").slice(0, 8)
  // To verify: node -e "const {sha256} = require('@noble/hashes/sha256'); console.log(Buffer.from(sha256('global:back_narrative')).slice(0,8))"
  const DISCRIMINATOR = Buffer.from([75, 87, 9, 26, 36, 72, 2, 16]);

  // Serialize args (Borsh layout matching Anchor)
  const data = Buffer.allocUnsafe(8 + 16 + 8);
  DISCRIMINATOR.copy(data, 0);
  Buffer.from(narrativeIdBytes).copy(data, 8); // [u8; 16]
  data.writeBigUInt64LE(amountLamports, 24); // u64 LE

  return new TransactionInstruction({
    keys: [
      { pubkey: backerPubkey, isSigner: true, isWritable: true },
      { pubkey: backingRecordPda, isSigner: false, isWritable: true },
      { pubkey: vaultPda, isSigner: false, isWritable: true },
      { pubkey: narrativeStatePda, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId,
    data,
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBackNarrative(): UseBackNarrativeReturn {
  const { account } = useWallet();
  const [backing, setBacking] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setTxSignature(null);
    setError(null);
    setBacking(false);
  }, []);

  const backNarrative = useCallback(
    async (
      narrativeId: string,
      amountSol: number,
      tokenType: TokenType = "SOL"
    ): Promise<BackNarrativeResult> => {
      // ── Preflight validation ─────────────────────────────────────────────
      if (!account) {
        throw new Error("No wallet connected. Please connect a wallet first.");
      }

      if (MAGMA_PROGRAMS.BACKING_VAULT === "REPLACE_WITH_PROGRAM_ID_AFTER_DEPLOY") {
        throw new Error(
          "Contract not yet deployed. Run: anchor deploy --provider.cluster devnet"
        );
      }

      if (amountSol < MIN_BACKING_SOL) {
        throw new Error(
          `Minimum backing is ${MIN_BACKING_SOL} SOL. You entered ${amountSol} SOL.`
        );
      }
      if (amountSol > MAX_BACKING_SOL) {
        throw new Error(
          `Maximum backing is ${MAX_BACKING_SOL} SOL. You entered ${amountSol} SOL.`
        );
      }

      setBacking(true);
      setError(null);
      setTxSignature(null);

      try {
        const rpcUrl = process.env.EXPO_PUBLIC_HELIUS_RPC_URL || ACTIVE_NETWORK;
        const connection = new Connection(rpcUrl, "confirmed");
        const programId = new PublicKey(MAGMA_PROGRAMS.BACKING_VAULT);
        console.log("[useBackNarrative] account.address:", JSON.stringify(account.address));
        const backerPubkey = new PublicKey(account.address);
        const amountLamports = BigInt(Math.round(amountSol * LAMPORTS_PER_SOL));

        // ── Derive PDAs ────────────────────────────────────────────────────
        const narrativeIdBytes = uuidToNarrativeIdBytes(narrativeId);
        const [vaultPda, backingRecordPda, narrativeStatePda] =
          await Promise.all([
            deriveVaultPda(narrativeIdBytes, programId),
            deriveBackingRecordPda(narrativeIdBytes, backerPubkey, programId),
            deriveNarrativeStatePda(narrativeIdBytes, programId),
          ]);

        console.log("[useBackNarrative] PDAs derived:", {
          vault: vaultPda.toBase58(),
          backingRecord: backingRecordPda.toBase58(),
          state: narrativeStatePda.toBase58(),
        });

        // ── Build + sign transaction via MWA ───────────────────────────────
        const sig = await transact(async (wallet) => {
          // Authorize (re-auth if needed — handles expired sessions)
          const authResult = await wallet.authorize({
            cluster: "devnet",
            identity: {
              name: "MAGMA Protocol",
              uri: "https://magmaprotocol.xyz",
              icon: "/icon.png",
            },
          });

          const authorizedPubkey = new PublicKey(
            authResult.accounts[0].address
          );

          // Fetch fresh blockhash
          const { blockhash, lastValidBlockHeight } =
            await connection.getLatestBlockhash();
          const minSlot = await connection.getSlot();

          // Build transaction
          const transaction = new Transaction({
            feePayer: authorizedPubkey,
            recentBlockhash: blockhash,
          });

          // Add back_narrative instruction
          const backIx = buildBackNarrativeInstruction(
            narrativeIdBytes,
            amountLamports,
            authorizedPubkey,
            backingRecordPda,
            vaultPda,
            narrativeStatePda,
            programId
          );
          transaction.add(backIx);

          // Sign and send via MWA (wallet handles signing + broadcast)
          const [txSig] = await wallet.signAndSendTransactions({
            transactions: [transaction],
            minContextSlot: minSlot,
          });

          console.log("[useBackNarrative] TX signed and sent:", txSig);
          return txSig;
        });

        // MWA already confirms on-chain;

        // Record in backend (non-fatal)
        fetch(`${API_URL}/v1/narratives/${narrativeId}/back`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wallet_address: account.address,
            amount_sol: amountSol,
            amount_skr: 0,
            tx_signature: sig,
            token_type: tokenType,
          }),
        }).catch(e => console.warn("[useBackNarrative] Backend non-fatal:", e));
        
        setTxSignature(sig);

        const result: BackNarrativeResult = {
          txSignature: sig,
          amountSol,
          narrativeId,
        };

        return result;
      } catch (err: any) {
        // ── Handle known error types ───────────────────────────────────────
        let userFacingError: string;

        if (err?.message?.includes("User rejected")) {
          userFacingError = "Transaction cancelled.";
        } else if (err?.message?.includes("0x1")) {
          // Anchor error code 0x1 = InsufficientFunds
          userFacingError = "Insufficient SOL in your wallet.";
        } else if (err?.message?.includes("NarrativeAlreadyResolved")) {
          userFacingError = "This narrative has already been resolved.";
        } else if (err?.message?.includes("AmountTooSmall")) {
          userFacingError = `Minimum backing is ${MIN_BACKING_SOL} SOL.`;
        } else if (err?.message?.includes("AmountTooLarge")) {
          userFacingError = `Maximum backing is ${MAX_BACKING_SOL} SOL.`;
        } else if (err?.message?.includes("not found")) {
          userFacingError =
            "Wallet not found. Is Phantom/Solflare installed?";
        } else {
          userFacingError = err?.message ?? "Transaction failed. Please try again.";
        }

        console.error("[useBackNarrative] Error:", err);
        setError(userFacingError);
        throw new Error(userFacingError);
      } finally {
        setBacking(false);
      }
    },
    [account]
  );

  return { backNarrative, backing, txSignature, error, reset };
}
