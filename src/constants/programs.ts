// ─── MAGMA Protocol — On-chain Program Constants ────────────────────────────
//
// BACKING_VAULT: Update this after running `anchor deploy` in Phase B
// ORACLE:        Will be set after Phase C deployment
//
// How to get the Program ID after deploy:
//   anchor deploy --provider.cluster devnet
//   → "Program Id: <YOUR_PROGRAM_ID>"
//   Then paste it below and replace the placeholder.

export const MAGMA_PROGRAMS = {
  /**
   * magma_backing_vault — handles narrative backing, resolution, payout
   * Deploy: C:\PROJECTS\MAGMA-CONTRACTS → anchor deploy --provider.cluster devnet
   * Update this after every redeploy.
   */
  BACKING_VAULT: "ExNf7ktskoFCKwneF4239WKt3JsrYYTPDszgJSitc2Vb" as string,

  /**
   * magma_scoring_oracle — Phase C, not yet deployed
   */
  ORACLE: "" as string,
} as const;

export const SOLANA_NETWORKS = {
  DEVNET: "https://api.devnet.solana.com",
  MAINNET: "https://api.mainnet-beta.solana.com",
} as const;

export const ACTIVE_NETWORK = SOLANA_NETWORKS.DEVNET;

/** Minimum backing amount in SOL */
export const MIN_BACKING_SOL = 0.001;

/** Maximum backing amount in SOL */
export const MAX_BACKING_SOL = 10;

/**
 * Convert a Supabase UUID to 16-byte Uint8Array for on-chain seeds.
 *
 * UUID format:  "550e8400-e29b-41d4-a716-446655440000"
 * Strip hyphens: "550e8400e29b41d4a716446655440000"  (32 hex chars = 16 bytes)
 *
 * This must match the [u8; 16] type used in the Anchor contract.
 */
export function uuidToNarrativeIdBytes(uuid: string): Uint8Array {
  const hex = uuid.replace(/-/g, "");
  if (hex.length !== 32) {
    throw new Error(`Invalid UUID: expected 32 hex chars, got ${hex.length}`);
  }
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
