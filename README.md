# 🌋 MAGMA Protocol

**Narrative Capital Markets on Solana**

> Submit a thesis. AI builds your kit. Mint on-chain. Community backs with SOL. Best narratives earn.

[![Solana](https://img.shields.io/badge/Solana-Mobile-9945FF?style=flat&logo=solana)](https://solanamobile.com)
[![Anchor](https://img.shields.io/badge/Anchor-0.30-FF6B35?style=flat)](https://anchor-lang.com)
[![Expo](https://img.shields.io/badge/Expo-SDK%2055-000020?style=flat&logo=expo)](https://expo.dev)
[![Claude](https://img.shields.io/badge/Claude-Sonnet%204-FF6B35?style=flat)](https://anthropic.com)

---

## What is MAGMA?

MAGMA is the first **narrative capital markets protocol on Solana**. Ideas have always driven crypto prices — now they have a market.

1. **Submit** a thesis (text or voice input)
2. **AI Pipeline** — 7 Claude agents generate a full narrative kit (article, hooks, imagery brief, distribution plan) in ~55 seconds
3. **Mint** — kit uploaded to IPFS, Metaplex cNFT minted on Solana (0.001 SOL)
4. **Back** — community stakes SOL on narratives they believe in
5. **Score** — Pyth-validated oracle scores each narrative over 7 days
6. **Earn** — top narratives graduate; creators + backers earn SOL yield boosted by Meteora + Kamino DeFi treasury

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Anchor 0.30 · Rust · Solana |
| Token | SPL Token-2022 + TransferHook |
| NFT | Metaplex Bubblegum cNFT |
| DeFi | Meteora DLMM · Kamino · Jupiter · Orca |
| Oracle | Pyth Network (SOL/USD · Entropy) |
| Mobile | React Native · Expo SDK 55 · MWA |
| Backend | Node.js 20 · Fastify · Supabase · Redis |
| AI | Anthropic Claude Sonnet 4 · Haiku 4-5 |
| Storage | IPFS via Pinata |
| Search | Tavily · Pinecone |

---

## Repository Structure

```
magma-protocol/
├── android/                  # Android build output
├── src/
│   ├── screens/              # React Native screens
│   │   ├── FeedScreen.tsx    # Narrative feed + filtering
│   │   ├── LaunchScreen.tsx  # Thesis input + AI pipeline
│   │   ├── DeFiScreen.tsx    # Treasury yield + Jupiter swap
│   │   ├── PortfolioScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── components/           # Shared components
│   ├── hooks/                # usePythPriceFeed, useMagmaTransactions
│   ├── stores/               # Zustand state
│   └── types/                # TypeScript types
├── programs/                 # Anchor smart contracts (Rust)
│   ├── magma_token/          # SPL Token-2022 mint
│   ├── magma_registry/       # Narrative NFT registry
│   ├── magma_score/          # Pyth-validated scoring oracle
│   └── magma_vault/          # DeFi treasury + staking
├── shims/                    # React Native polyfills
├── backend/                  # Node.js API (separate repo)
├── docs/
│   ├── magma_tech_spec.md
│   ├── magma_dev_plan.md
│   └── magma_strategy.md
├── App.tsx
├── index.ts
├── metro.config.js
├── babel.config.js
└── app.json
```

---

## Smart Contracts

### `magma_token` — SPL Token-2022
- 1B $MAGMA supply with TransferHook extension
- Staking side effects on transfer
- Freeze authority revoked post-TGE

### `magma_registry` — Narrative NFT Program
- `register_narrative()` — submit thesis + IPFS CID, mint cNFT
- `cast_vote()` — community voting with PDA per voter
- `update_status()` — oracle-triggered graduation/slash

### `magma_score` — Pyth Oracle Program
- `write_score()` — composite score (originality + community + novelty + clarity + timeliness + potential)
- Pyth SOL/USD freshness validation (30s max staleness)
- Graduation threshold: ≥60 · Slash threshold: ≤30

### `magma_vault` — DeFi Treasury
- `stake_on_narrative()` — SOL staking with 7-day window
- `unstake()` — principal + yield return
- `credit_yield()` — 2% protocol fee on DeFi yield
- Integrations: Meteora DLMM · Kamino Whirlpool · Save Finance

---

## Getting Started

### Prerequisites
- Node.js 20+
- Expo CLI
- Android Studio + emulator (API 33+)
- Rust + Anchor CLI (for smart contract development)
- Solana CLI

### Mobile App

```bash
git clone https://github.com/YOURUSERNAME/magma-protocol.git
cd magma-protocol
npm install
npx expo start --tunnel
```

### Backend

```bash
cd magma-backend
npm install
# Configure .env (see .env.example)
npm run dev
```

### Smart Contracts (Devnet)

```bash
cd programs
anchor build
anchor deploy --provider.cluster devnet
```

---

## AI Agent Pipeline

| Agent | Role | Model |
|---|---|---|
| S-00 | Solana Context Check | Haiku 4-5 |
| S-01 | Thesis Architect | Sonnet 4 |
| S-02 | Hook Engineer | Sonnet 4 |
| S-03 | Article Writer | Sonnet 4 |
| S-04 | Imagery Brief | Haiku 4-5 |
| S-05 | Distribution Planner | Haiku 4-5 |
| S-06 | Score Predictor | Sonnet 4 |
| S-07 | Fact Checker | Sonnet 4 + Tavily |

Total pipeline: ~55 seconds · Target: <3% hallucination rate

---

## Payout Distribution

```
On cycle close (7 days):
  Creator        60% of narrative payout
  Backers        30% (pro-rata × early multiplier)
  $MAGMA stakers 10%

Early backer bonus: 1.5× multiplier (first 48h)
DeFi yield: Meteora DLMM + Kamino auto-compound
```

---

## Hackathon

Built for **Monolith** — Solana Mobile Hackathon · March 2026

- ✅ Android APK (side-loadable)
- ✅ Solana Mobile Wallet Adapter
- ✅ Devnet smart contracts
- ✅ Full AI pipeline
- ✅ DeFi treasury architecture

---

## Roadmap

| Phase | Timeline | Milestone |
|---|---|---|
| Phase 1 | Month 1–2 | Devnet programs + AI pipeline + 25 alpha wallets |
| Phase 2 | Month 3–4 | DeFi treasury live + 250 beta wallets + first SOL payout |
| Phase 3 | Month 5–6 | Jupiter + Orca + security audit + first graduation |
| Phase 4 | Month 7–8 | Mainnet launch + dApp Store + Vibestarter raise |

---

## License

MIT

---

*MAGMA Protocol · Narrative Capital Markets · Built on Solana · March 2026*
