# MAGMA Protocol
**Narrative Capital Markets on Solana**

> Back what you believe. Earn while you wait. Get rewarded for being right early.

[![Solana](https://img.shields.io/badge/Solana-Mobile-9945FF?style=flat&logo=solana)](https://solanamobile.com)
[![Expo](https://img.shields.io/badge/Expo-Managed-000020?style=flat&logo=expo)](https://expo.dev)
[![Fastify](https://img.shields.io/badge/Fastify-Backend-000000?style=flat)](https://fastify.dev)
[![Claude](https://img.shields.io/badge/Claude-AI%20Pipeline-FF6B35?style=flat)](https://anthropic.com)
[![Pyth](https://img.shields.io/badge/Pyth-Oracle-A259FF?style=flat)](https://pyth.network)

---

## What is MAGMA?

MAGMA is a narrative capital markets protocol built for Solana Mobile. Users submit market theses, back them with SOL or SPL tokens, and earn yield on their capital while the oracle resolves each narrative.

- **Submit** a thesis via text or voice input
- **AI pipeline** builds a full narrative kit in ~55 seconds (article, hooks, distribution plan)
- **Back** narratives with SOL, SKR, or 14 other SPL tokens
- **Earn** DeFi yield on backing capital while narratives resolve
- **Get rewarded** for accurate early backing through the Conviction Score system
- **Echo Pool** distributes a share of all resolved capital to top conviction holders monthly

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native + Expo (managed workflow) |
| Wallet | Solana Mobile Wallet Adapter v2 (MWA) |
| Backend | Node.js 20 + Fastify + TypeScript |
| Database | Supabase (PostgreSQL) |
| Cache / Queues | Redis + BullMQ |
| AI Pipeline | Anthropic Claude (Sonnet + Haiku) |
| Oracle | Grok AI + Tavily search + Pyth Network |
| DeFi | Kamino + Meteora DLMM + Save Finance + Jupiter Lend |
| NFT | Metaplex Core |
| Price Feeds | Pyth Hermes (SOL/USD + 15 tokens) |
| Infrastructure | Railway (backend) + Supabase (database) |

---

## Repository Structure

```
magma-protocol/          # React Native mobile app (this repo)
  src/
    screens/             # App screens
    components/          # Shared UI components
    context/             # WalletContext (MWA state)
    hooks/               # usePythPriceFeed, useBackNarrative
    theme/               # Design system tokens (V2)
    utils/               # Helpers
  android/               # Gradle release build output
  App.tsx                # Root navigator
  app.json               # Expo config

magma-backend/           # Separate repo: plinkdev1/magma-backend
  src/
    routes/              # API route handlers
    services/            # Business logic
    workers/             # BullMQ background workers
    lib/                 # Redis, Supabase, queue setup
```

---

## AI Agent Pipeline

MAGMA uses a multi-agent Claude pipeline to process every narrative submission:

| Stage | Function |
|---|---|
| Uncertainty Check | Rejects trivially certain or incoherent theses |
| Resolvability Score | Validates the narrative can be objectively resolved |
| Originality Check | Detects duplicate or near-duplicate narratives |
| Narrative Generator | Produces article, hooks, and distribution kit |
| Oracle Resolution | Grok + Tavily + Pyth validate outcome at deadline |

Pipeline runtime: ~55 seconds per narrative

---

## DeFi Yield Integration

Backing capital never sits idle. Every token backed into a narrative is deployed into a yield protocol while the narrative resolves:

| Token | Yield Source |
|---|---|
| SOL | Kamino Lend |
| SKR | Guardian Staking (0% fee) |
| JUP | Jupiter Lend |
| BONK, RAY, WIF | Kamino Lend |
| KMNO, MET | Meteora DLMM |
| USDC | Kamino Lend / Save Finance |

Principal is always returned 1:1. Yield multipliers apply to earned yield only.

---

## Conviction Score System

Every wallet builds a Conviction Score through accurate narrative backing:

- **Tiers**: Ember → Flare → Magma → Core → Volcanic
- **Multipliers**: yield bonuses applied to earned yield (not principal)
- **Echo Pool**: monthly distribution to high-conviction holders
- **Creator Score**: separate track for narrative submitters

Scores are earned through accuracy over time — not purchasable.

---

## NFT Collections

**Lava Tier Cards (MLAVA)** — 10,000 supply across 5 tiers
Metaplex Core standard. Provide yield multiplier floors for holders.
Mint opens post-mainnet.

**Genesis Origin Cards (MGNSS)** — 100 supply, commemorative
Awarded to founding testnet participants via verifiable raffle.
Provides Echo Pool weight boost.

---

## Getting Started

### Prerequisites
- Node.js 20+
- Expo CLI
- Android device or emulator (API 33+ / Android 13+)
- Phantom or Solflare wallet (Solana Mobile Wallet Adapter)

### Mobile App

```bash
git clone https://github.com/plinkdev1/magma-protocol.git
cd magma-protocol
npm install
npx expo start
```

> Note: MWA wallet signing requires a physical Android device or an emulator with a Solana wallet installed.

### Environment

Create `src/config.ts` with your backend URL:

```typescript
export const API_URL = 'http://YOUR_LOCAL_IP:3000';
```

> `src/config.ts` is excluded from git. Never commit it.

### Backend

```bash
git clone https://github.com/plinkdev1/magma-backend.git
cd magma-backend
npm install
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_ANON_KEY, REDIS_URL, GROK_API_KEY,
# TAVILY_API_KEY, PYTH_ENDPOINT, ANTHROPIC_API_KEY
npm run dev
```

### Release Build (Android)

```bash
node patch-prod.js
cd android
.\gradlew assembleRelease
adb install -r android\app\build\outputs\apk\release\app-release.apk
node patch-dev.js
```

---

## Anti-Sybil

MAGMA uses Gitcoin Passport (Human Passport) for identity verification.
Users with established EVM wallet history receive a Passport score.
Verification is informational — it does not block app access.

Passport: [passport.xyz](https://passport.xyz)

---

## Network

Currently running on **Solana devnet**.
Mainnet deployment follows independent security audit.

---

## Built For

**Monolith** — Solana Mobile Hackathon, March 2026

- Android APK (Gradle release build)
- Solana Mobile Wallet Adapter v2
- Seeker phone + SKR native integration
- Pyth Network price feeds + entropy
- Multi-agent AI pipeline (Anthropic Claude)
- Live DeFi yield (Kamino, Meteora, Jupiter, Save)

---

## License

MIT

---

*MAGMA Protocol · Narrative Capital Markets · Built on Solana · 2026*
