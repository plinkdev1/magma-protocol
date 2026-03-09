# MAGMA Protocol — Technical Specification
## Narrative Capital Markets on Solana
**Version 0.1 · March 2026**

---

## 1. Overview

MAGMA is the Solana implementation of the Intellectual Capital Markets (ICM) stack. It shares its AI pipeline, scoring model, and ORIGIN bridge architecture with CYPHER (Base) but is built with Solana-native primitives throughout: Anchor framework, SPL Token-2022, Metaplex Compressed NFTs, Mobile Wallet Adapter, and Pyth Network oracles.

---

## 2. Smart Contract Architecture (Anchor / Rust)

### 2.1 `magma_registry` — Narrative NFT Program
```rust
// Key accounts
#[account]
pub struct NarrativeAccount {
    pub creator: Pubkey,
    pub token_id: u64,
    pub content_hash: [u8; 32],   // keccak256 of full kit
    pub ipfs_cid: String,          // IPFS Pinata CID
    pub title: String,
    pub stage: NarrativeStage,
    pub mint_time: i64,
    pub scoring_open: bool,
    pub cycle_id: u64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum NarrativeStage {
    Pending,
    Seeding,
    BackingOpen,
    Active,
    Graduated,
    Slashed,
    Closed,
}
```

**Instructions:**
- `submit_narrative(title, ipfs_cid, content_hash)` — creator pays 0.001 SOL lamports
- `open_scoring(narrative_id)` — called by keeper after AI pipeline completes
- `transition_stage(narrative_id, new_stage)` — score oracle only
- `close_cycle(cycle_id)` — weekly crank, distributes payouts

**Metaplex cNFT minting:**
```rust
// Uses Metaplex Bubblegum program for compressed NFTs
// Stores narrative metadata URI on IPFS
// Token account: creator wallet, non-transferable until graduation
use mpl_bubblegum::instructions::MintToCollectionV1Cpi;
```

---

### 2.2 `magma_vault` — Treasury & Escrow Program
```rust
#[account]
pub struct CycleVault {
    pub cycle_id: u64,
    pub total_sol_locked: u64,          // lamports
    pub yield_earned: u64,              // lamports from DeFi
    pub narrative_count: u32,
    pub open_time: i64,
    pub close_time: i64,
    pub meteora_position: Option<Pubkey>,
    pub kamino_position: Option<Pubkey>,
    pub save_position: Option<Pubkey>,
    pub bump: u8,
}

#[account]
pub struct BackerPosition {
    pub backer: Pubkey,
    pub narrative_id: u64,
    pub sol_amount: u64,               // lamports
    pub magma_staked: u64,             // $MAGMA tokens
    pub is_early: bool,                // first 48h flag
    pub multiplier: u16,               // 100 = 1.0×, 150 = 1.5×
    pub timestamp: i64,
    pub bump: u8,
}
```

**DeFi Integrations:**
```rust
// Meteora DLMM integration
use dlmm::cpi::add_liquidity;

// Kamino Whirlpool strategy
use kamino::cpi::deposit;

// Save.Finance (Solend fork) lending
use save_finance::cpi::deposit_reserve_liquidity;
```

**Payout distribution (on cycle close):**
```
For each narrative with score ≥ 45:
  narrative_payout = (narrative_score / total_top_score) × cycle_pool
  creator_share    = narrative_payout × 0.60
  backer_share     = narrative_payout × 0.30 (distributed pro-rata × multiplier)
  staker_share     = narrative_payout × 0.10 (to $MAGMA staking pool)
```

---

### 2.3 `magma_score` — Oracle & Scoring Program
```rust
#[account]
pub struct ScoreRecord {
    pub narrative_id: u64,
    pub composite_score: u8,             // 0–100
    pub factual_density: u8,
    pub engagement_trajectory: u8,
    pub originality_index: u8,
    pub community_vote: u8,
    pub pyth_sol_price: i64,             // at time of score write
    pub last_updated: i64,
    pub update_count: u32,
    pub bump: u8,
}
```

**Pyth integration:**
```rust
use pyth_sdk_solana::load_price_feed_from_account_info;

pub fn update_score(ctx: Context<UpdateScore>, new_score: u8) -> Result<()> {
    // Validate Pyth price is fresh (< 60s)
    let sol_price_feed = load_price_feed_from_account_info(
        &ctx.accounts.pyth_sol_usd
    )?;
    let sol_price = sol_price_feed.get_price_no_older_than(60)?;
    
    // Write score + Pyth price snapshot
    ctx.accounts.score_record.composite_score = new_score;
    ctx.accounts.score_record.pyth_sol_price = sol_price.price;
    ctx.accounts.score_record.last_updated = Clock::get()?.unix_timestamp;
    Ok(())
}
```

---

### 2.4 `magma_token` — $MAGMA SPL Program
```
Token standard: Token-2022 (SPL with extensions)
Extensions used:
  - TransferHook: triggers staking side effects on transfer
  - NonTransferable: for Genesis NFT soulbound variants
  - MetadataPointer: on-chain token metadata
  
Mint authority: magma_token program PDA (controlled by governance)
Freeze authority: None (token is permissionless after TGE)
```

---

## 3. AI Agent Pipeline

Identical to CYPHER (claude-sonnet-4-6 for complex agents, claude-haiku-4-5 for batch tasks) with one Solana-specific addition:

**Agent S-00: SOLANA_CONTEXT_AGENT** (pre-run)
- Checks if thesis is relevant to current Solana ecosystem developments
- Flags topics with high Solana community interest (DeFi, gaming, mobile, DePIN)
- Adds Solana-specific engagement prediction bonus to pre-score

Total pipeline time target: **~55 seconds** (vs ~90s on CYPHER, due to lighter queue pressure on Solana infrastructure).

---

## 4. Mobile App Architecture

### Tech Stack
```
Framework:        React Native (Expo SDK 52)
Language:         TypeScript
Navigation:       React Navigation v6
State:            Zustand
Blockchain:       @solana/web3.js + @coral-xyz/anchor
Wallet:           @solana-mobile/mobile-wallet-adapter-protocol
NFT:              @metaplex-foundation/js
Oracle:           @pythnetwork/client
Voice:            @react-native-voice/voice
Notifications:    expo-notifications
Camera:           expo-camera
Gestures:         react-native-gesture-handler
Animations:       react-native-reanimated
```

### Key Screen Architecture
```
App.tsx
├── BottomTabNavigator
│   ├── FeedScreen          (narrative list, filters, real-time scores)
│   ├── LaunchScreen        (thesis input → kit generation → mint)
│   ├── PortfolioScreen     (my narratives, earnings, positions)
│   ├── DeFiScreen          (treasury yield, Jupiter swap, Pyth prices)
│   └── ProfileScreen       (wallet, $MAGMA balance, tier, history)
└── ModalNavigator
    ├── NarrativeDetailModal
    ├── StakeModal
    ├── KitPreviewModal
    └── WalletConnectModal
```

### Solana Mobile Stack (MWA)
```typescript
// Transaction signing flow
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';

async function signAndSendTransaction(tx: Transaction) {
  return await transact(async (wallet) => {
    await wallet.authorize({ cluster: 'mainnet-beta', identity: { name: 'MAGMA' } });
    const { signatures } = await wallet.signAndSendTransactions({
      transactions: [tx],
    });
    return signatures[0];
  });
}
```

---

## 5. Backend API

```
Runtime:     Node.js 20+ / Fastify
Language:    TypeScript
Database:    PostgreSQL (Supabase)
Cache:       Redis (Upstash)
Queue:       BullMQ (AI agent jobs)
Storage:     IPFS via Pinata
AI:          Anthropic Claude API
Search:      Tavily (A-07 fact check)
Vectors:     Pinecone (originality check)
Analytics:   PostHog
```

**Core endpoints:**
```
POST /v1/narratives/generate     AI pipeline trigger
POST /v1/narratives/mint         Solana mint after review
GET  /v1/narratives              Feed (paginated)
GET  /v1/narratives/:id          Single narrative + kit
GET  /v1/narratives/:id/score    Current score
POST /v1/narratives/:id/back     Stake SOL on narrative
GET  /v1/treasury/yield          Current DeFi APYs
GET  /v1/prices/pyth             Latest Pyth price feeds
```

---

## 6. Pyth Network Integration

### Price Feeds (mainnet)
| Feed | Account | Update freq |
|---|---|---|
| SOL/USD | `H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG` | ~400ms |
| USDC/USD | `Gnt27xtC473ZT2Mw5u8wZ68Z3gULkSTb5DuxJy7eJotD` | ~400ms |
| $MAGMA/USD | TBD (post-listing) | ~400ms |

### Pyth Entropy
- **Genesis NFT tier assignment:** requestWithCallback → resolve on-chain
- **Score tiebreaker:** VRF-style resolution for equal-score narratives at cycle close
- **Treasury rebalance trigger:** price delta > 5% triggers auto-rebalance

---

## 7. Security

| Concern | Mitigation |
|---|---|
| Oracle manipulation | Pyth 400ms feeds + confidence interval check |
| Sybil backing attacks | Min 100 $MAGMA to back, wallet age check |
| AI hallucination | A-07 Fact Checker, slash penalty for misinformation |
| Rug pull (team tokens) | 12mo cliff + 36mo vest, Gnosis-equivalent multisig on Solana |
| Program exploits | Anchor framework + Sherlock audit pre-mainnet |
| DeFi vault risk | Position size caps: max 40% in any single protocol |

---

*MAGMA Protocol · Technical Specification v0.1 · March 2026*
