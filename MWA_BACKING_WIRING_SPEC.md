# MWA BACKING FLOW + YIELD ROUTING — FULL WIRING SPEC
## Status: MOCK — needs dedicated joint backend + mobile session
## Priority: IMMEDIATE — blocks testnet readiness checklist
## Repos needed: MAGMA-BACKEND + MAGMA-APP open simultaneously

---

## WORKING RULES FOR THE IMPLEMENTING AGENT
- git pull before ANY work on either repo
- Get-Content + read files before touching them -- never assume
- npx tsc --noEmit after every TypeScript change
- git diff + git status before every commit
- Never commit .env or src/config.ts
- Never git add -A -- always explicit filenames
- Commit and push after each logical unit of work -- not at the end
- PowerShell heredoc @'...'@ for all scripts
- Node.js scripts for all file writes with emoji/Unicode
- If something is unclear -- Get-Content the file first, ask second
- Do not destroy existing logic -- read it, understand it, extend it

---

## CURRENT STATE (confirmed April 3 2026)

LaunchScreen.tsx line 245-249:
  const txResponse = await axios.post(API_BASE_URL + '/v1/narratives/prepare-mint', ...);
  signedTransaction: 'MOCK_SIGNED_TX'  // MWA signing completely skipped

Backend prepare-mint (narratives.ts line 218):
  Returns fake base64 transaction -- no real instruction built

kamino.ts:
  depositToKamino() returns mock receipt -- no real Kamino SDK call

yieldRouter.ts:
  All yield routes mocked -- no real SDK calls for any protocol

RESULT: No Anchor program called. No yield earned. Narrative stored in Supabase only.

---

## READ THIS FIRST BEFORE WRITING ANY CODE

Read the Anchor IDL:
  C:\PROJECTS\MAGMA-CONTRACTS\target\idl\magma_backing_vault.json

This file has exact instruction names, account names, PDA seeds, and argument types.
Do not guess -- read the IDL. The program is live at:
  ExNf7ktskoFCKwneF4239WKt3JsrYYTPDszgJSitc2Vb

---

## STEP 1 -- BACKEND: build real transaction in prepare-mint

Install on MAGMA-BACKEND:
  npm install @coral-xyz/anchor @solana/web3.js

In narratives.ts prepare-mint route:
  1. Parse narrative_id from body
  2. Parse backer_wallet from body
  3. Parse amount_lamports from body
  4. Parse deadline_timestamp from body
  5. Load IDL from C:/PROJECTS/MAGMA-CONTRACTS/target/idl/magma_backing_vault.json
  6. Create AnchorProvider with devnet RPC (use HELIUS_RPC_URL env var if available)
  7. Derive PDAs:
     const narrativeIdBytes = Buffer.from(narrativeId.replace(/-/g, ''), 'hex'); // 16 bytes
     const [narrativeState] = PublicKey.findProgramAddressSync(
       [Buffer.from("state"), narrativeIdBytes], programId
     );
     const [vault] = PublicKey.findProgramAddressSync(
       [Buffer.from("vault"), narrativeIdBytes], programId
     );
     const [backingRecord] = PublicKey.findProgramAddressSync(
       [Buffer.from("backing"), narrativeIdBytes, backerPubkey.toBytes()], programId
     );
  8. Build instruction via program.methods.backNarrative(narrativeIdBytes, amountLamports, deadline)
  9. Get recent blockhash from devnet RPC
  10. Build Transaction, add instruction, set feePayer to backer wallet
  11. Serialize to base64
  12. Return { transaction: base64, narrativeId }

CRITICAL: Do NOT sign on backend. Transaction goes to mobile unsigned.
narrativeId must be consistent between prepare-mint and publish -- use same UUID.

---

## STEP 2 -- MOBILE: sign via MWA and send

In LaunchScreen.tsx handlePublish, replace MOCK_SIGNED_TX block:

  const txBytes = Buffer.from(txBase64, 'base64');
  const transaction = Transaction.from(txBytes);

  const result = await transact(async (wallet) => {
    await wallet.reauthorize({
      auth_token: account.authToken,
      identity: APP_IDENTITY, // { uri: 'https://magmaprotocol.xyz', icon: 'favicon.ico', name: 'MAGMA Protocol' }
    });
    const signed = await wallet.signAndSendTransactions({
      transactions: [transaction],
    });
    return signed;
  });

  const signature = result[0];
  // Send to publish endpoint
  await axios.post(API_BASE_URL + '/v1/narratives/publish', {
    narrativeId,
    signature,
    thesis,
    walletAddress: account.address,
    deadline_days: selectedDeadline.days,
  });

account.authToken is available from useWallet() hook.
APP_IDENTITY is in WalletContext.tsx -- import or duplicate.

---

## STEP 3 -- BACKEND publish: verify signature

In narratives.ts publish route:
  1. Receive signature from body
  2. Call devnet RPC getTransaction(signature) to verify it landed
  3. If confirmed: proceed with Supabase narrative creation
  4. If not found: return 400
  5. Check for duplicate narrativeId in Supabase before inserting

---

## YIELD ROUTING -- ALL PROTOCOLS NEED WIRING IN THIS SESSION

The prepare-mint backend route must route backed capital to the correct yield protocol
based on token type. All routes in yieldRouter.ts are currently mocked.
Wire real SDK calls in this same session.

### SOL -- Kamino Lend (primary)
  npm install @kamino-finance/klend-sdk
  Call real deposit instruction.
  Store kSOL receipt token address in narrative_backings.kamino_receipt.
  On resolution: call withdraw instruction to redeem receipt + yield.

### SOL -- Jito Staking (fallback)
  npm install @jito-foundation/stake-pool-sdk
  Stake SOL via Jito stake pool program.
  User receives jitoSOL (mint: J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn).
  Store jitoSOL amount in narrative_backings.jito_receipt.
  On resolution: call unstake. NOTE: Jito has 1-2 epoch cooldown (~2-4 days).
  Handle: if cooldown active, return principal immediately, yield paid when cooldown ends.
  Store pending_yield in narrative_backings for cooldown tracking.

### SOL -- Marinade Staking (additional)
  npm install @marinade.finance/marinade-ts-sdk
  Stake SOL via Marinade liquid staking.
  User receives mSOL (mint: mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So).
  Store mSOL amount in narrative_backings.marinade_receipt.
  On resolution: use immediate unstake path (0.3% fee, instant) -- NOT delayed.
  Delayed unstake blocks payouts. Always use immediate for narrative resolution.

### USDC/JUP/PYTH -- Jupiter Lend (Fluid)
  Install Jupiter Lend SDK when available or use their REST API.
  Deposit to Fluid lending pool. Store receipt. Withdraw on resolution.

### USDC/SOL -- Save Finance
  Use Save Finance SDK or direct program CPI.
  Deposit to Save lending market. Store receipt. Withdraw on resolution.

### BONK/RAY/WIF/MET/KMNO -- Meteora DLMM
  npm install @meteora-ag/dlmm-sdk
  Add liquidity to relevant DLMM pool.
  Store LP position receipt. Remove liquidity on resolution.

### SKR -- Guardian Staking
  Seeker-native. Wire when Guardian staking program address is confirmed.
  Store staking receipt. ALWAYS 0% deposit fee -- hardcoded, never change.
  Skip until Guardian program deployed on devnet.

Implementation order:
  1. Kamino first -- highest TVL token (SOL/USDC)
  2. Marinade second -- immediate unstake, no cooldown complexity
  3. Jito third -- add cooldown handling after Marinade working
  4. Save Finance fourth
  5. Jupiter Lend fifth
  6. Meteora sixth
  7. SKR Guardian last -- depends on collection deploy

On resolution: yieldRouter.ts routeWithdrawal() must call correct SDK withdraw for each
receipt type. Match receipt token type to withdrawal SDK.
Return principal + yield to vault. Vault distributes to backers per multipliers.

Do NOT mock any of these. If SDK not available or not deployed on devnet:
add clear TODO comment and skip that token -- return error, not fake receipt.

---

## JITO + MARINADE -- FRONTEND UI REQUIRED IN ADDITION TO BACKEND

Unlike Kamino/Save (lending -- silent background), Jito/Marinade are liquid staking.
They require additional mobile UI treatment.

### Jito -- Mobile UI
  DeFiTabsScreen: add Jito protocol card showing jitoSOL APY (~8-9%), live from API.
  PortfolioScreen: when user has Jito position via narrative backing, show:
    - jitoSOL balance
    - Current SOL value (Pyth price feed for jitoSOL/SOL)
    - Accrued staking yield
    - Unstaking cooldown status if pending ("Yield pending -- unstaking in progress")
  Add Jito logo to protocol logos folder.

### Marinade -- Mobile UI
  DeFiTabsScreen: add Marinade protocol card showing mSOL APY (~7-8%), live from API.
  PortfolioScreen: when user has Marinade position:
    - mSOL balance
    - Current SOL value
    - Accrued yield
    - Protocol badge
  Add Marinade logo to protocol logos folder.

### defiMonitorWorker.ts additions
  Currently fetches APY for Kamino, Meteora, Save, Jupiter.
  Add Jito APY fetch from Jito APY endpoint. Cache in Redis 30-min TTL.
  Add Marinade APY fetch from https://api.marinade.finance/msol/apy/1y. Cache same.

### Unstaking cooldown handling
  If narrative resolves during Jito cooldown:
    - Principal returned immediately from vault reserves
    - Yield paid when unstaking completes
    - Show "Yield pending -- unstaking in progress" in portfolio
    - pending_yield field in narrative_backings tracks this

### Implementation order for UI
  1. Both DeFi screen APY cards -- after backend confirmed on devnet
  2. Marinade portfolio card
  3. Jito portfolio card + cooldown UI

---

## TEST SEQUENCE BEFORE COMMITTING ANYTHING

  1. Build Anchor transaction locally, print to console -- verify PDAs correct
  2. Submit test transaction with 0.01 SOL on devnet
  3. Verify transaction appears in Solana Explorer at devnet
  4. Verify NarrativeVaultState account created on-chain
  5. Verify BackingRecord account created on-chain
  6. THEN wire Kamino deposit
  7. THEN verify Kamino receipt stored in Supabase
  8. Only then commit and push

---

## FILES TO READ BEFORE STARTING

  MAGMA-BACKEND:
    src/routes/narratives.ts (prepare-mint + publish routes)
    src/services/kamino.ts (current mock -- replace with real SDK)
    src/services/yieldRouter.ts (all routes -- read fully before touching)
    src/lib/supabase.ts (always use getSupabase() not createClient())

  MAGMA-APP:
    src/screens/LaunchScreen.tsx (handlePublish function around line 227)
    src/context/WalletContext.tsx (transact usage pattern + APP_IDENTITY)
    src/screens/DeFiTabsScreen.tsx (for Jito/Marinade card additions)
    src/screens/PortfolioScreen.tsx (for staking position display)

  MAGMA-CONTRACTS:
    target/idl/magma_backing_vault.json (READ THIS FIRST)
    programs/magma_backing_vault/src/lib.rs (for PDA seed verification)
