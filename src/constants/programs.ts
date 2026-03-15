// src/constants/programs.ts

export const MAGMA_PROGRAMS = {
  BACKING_VAULT:  'ExNf7ktskoFCKwneF4239WKt3JsrYYTPDszgJSitc2Vb',
  PROGRAM_STATE:  'GSnvK5hwek8PeACTv1jJNcU4kDSyYCog6fcx6eBPWNX9',
  SCORING_ORACLE: 'PHASE_C_PROGRAM_ID',
} as const;

export const PROTOCOL_CONSTANTS = {
  PROTOCOL_FEE_BPS:   200,
  YIELD_SPREAD_BPS:   1000,
  SUBMISSION_FEE_SOL: 0.01,
  CHALLENGE_FEE_PCT:  5,
  CHALLENGE_FEE_MIN:  0.05,
  CHALLENGE_FEE_MAX:  2.0,
  MIN_BACKING_SOL:    0.001,
  MAX_BACKING_SOL:    10.0,
} as const;

export const DEADLINE_OPTIONS = [
  { label: '24 hours',  days: 1,   tag: 'FLASH',    color: '#ff4444', seconds: 86_400 },
  { label: '7 days',    days: 7,   tag: 'SHORT',    color: '#ff6b35', seconds: 604_800 },
  { label: '30 days',   days: 30,  tag: 'MEDIUM',   color: '#ffb347', seconds: 2_592_000 },
  { label: '90 days',   days: 90,  tag: 'LONG',     color: '#00c4ff', seconds: 7_776_000 },
  { label: '180 days',  days: 180, tag: 'EXTENDED', color: '#00ff88', seconds: 15_552_000 },
] as const;

export type DeadlineTier = typeof DEADLINE_OPTIONS[number];
export const DEFAULT_DEADLINE = DEADLINE_OPTIONS[1]; // SHORT 7d


export const ACTIVE_NETWORK = process.env.EXPO_PUBLIC_HELIUS_RPC_URL || "https://api.devnet.solana.com";
export const MIN_BACKING_SOL = 0.001;
export const MAX_BACKING_SOL = 10.0;

/**
 * Convert a UUID string to a 16-byte Uint8Array for on-chain use.
 * Pads with zeros if the narrative ID is not a standard UUID.
 */
export function uuidToNarrativeIdBytes(narrativeId: string): Uint8Array {
  const hex = narrativeId.replace(/-/g, "");
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2) || "00", 16);
  }
  return bytes;
}