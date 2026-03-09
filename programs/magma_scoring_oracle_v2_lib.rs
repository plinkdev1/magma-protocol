use anchor_lang::prelude::*;
use pyth_sdk_solana::state::PriceAccount;

declare_id!("11111111111111111111111111111111");

pub const PYTH_SOL_USD_FEED: &str = "H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG";
pub const MAX_PYTH_STALENESS_SECS: i64 = 30;
pub const MAX_SCORE: u8 = 100;
pub const GRADUATION_THRESHOLD: u8 = 60;
pub const SLASH_THRESHOLD: u8 = 30;

#[program]
pub mod magma_scoring_oracle {
    use super::*;

    /// Initialize the oracle
    pub fn initialize_oracle(ctx: Context<InitializeOracle>) -> Result<()> {
        let oracle = &mut ctx.accounts.oracle;
        oracle.authority = ctx.accounts.authority.key();
        oracle.total_scores_written = 0;
        oracle.bump = ctx.bumps.oracle;
        msg!("✓ MAGMA Scoring Oracle initialized");
        Ok(())
    }

    /// Write final score for a narrative
    /// Validates Pyth price freshness before writing
    pub fn write_score(
        ctx: Context<WriteScore>,
        narrative_id: u64,
        originality_score: u8,
        community_score: u8,
        novelty: u8,
        clarity: u8,
        timeliness: u8,
        potential: u8,
    ) -> Result<()> {
        require!(originality_score <= MAX_SCORE, OracleError::InvalidScore);
        require!(community_score <= MAX_SCORE, OracleError::InvalidScore);
        require!(novelty <= MAX_SCORE, OracleError::InvalidScore);
        require!(clarity <= MAX_SCORE, OracleError::InvalidScore);
        require!(timeliness <= MAX_SCORE, OracleError::InvalidScore);
        require!(potential <= MAX_SCORE, OracleError::InvalidScore);

        // Validate Pyth price freshness
        let clock = Clock::get()?;
        let pyth_info = &ctx.accounts.pyth_price_feed.to_account_info();
        let data = pyth_info.try_borrow_data()?;
        let price_account = bytemuck::try_from_bytes::<PriceAccount>(&data[..std::mem::size_of::<PriceAccount>()])
            .map_err(|_| OracleError::PythFeedInvalid)?;

        let age = clock.unix_timestamp - price_account.timestamp;
        require!(age <= MAX_PYTH_STALENESS_SECS, OracleError::PythPriceStale);
        require!(price_account.agg.price > 0, OracleError::PythPriceInvalid);

        let sol_price = price_account.agg.price;

        // Calculate composite score
        let composite = ((originality_score as u16
            + community_score as u16
            + novelty as u16
            + clarity as u16
            + timeliness as u16
            + potential as u16) / 6) as u8;

        let verdict = if composite >= GRADUATION_THRESHOLD {
            NarrativeVerdict::Graduated
        } else if composite <= SLASH_THRESHOLD {
            NarrativeVerdict::Slashed
        } else {
            NarrativeVerdict::Expired
        };

        let score_record = &mut ctx.accounts.score_record;
        score_record.narrative_id = narrative_id;
        score_record.originality_score = originality_score;
        score_record.community_score = community_score;
        score_record.novelty = novelty;
        score_record.clarity = clarity;
        score_record.timeliness = timeliness;
        score_record.potential = potential;
        score_record.composite_score = composite;
        score_record.verdict = verdict.clone();
        score_record.sol_price_at_scoring = sol_price;
        score_record.written_at = clock.unix_timestamp;
        score_record.bump = ctx.bumps.score_record;

        ctx.accounts.oracle.total_scores_written += 1;

        emit!(ScoreWritten {
            narrative_id,
            composite_score: composite,
            verdict,
            sol_price,
            written_at: clock.unix_timestamp,
        });

        msg!("📊 Score written for narrative #{}: {}", narrative_id, composite);
        Ok(())
    }

    /// Read current SOL price from Pyth
    pub fn get_sol_price(ctx: Context<GetSolPrice>) -> Result<i64> {
        let clock = Clock::get()?;
        let pyth_info = &ctx.accounts.pyth_price_feed.to_account_info();
        let data = pyth_info.try_borrow_data()?;
        let price_account = bytemuck::try_from_bytes::<PriceAccount>(&data[..std::mem::size_of::<PriceAccount>()])
            .map_err(|_| OracleError::PythFeedInvalid)?;

        let age = clock.unix_timestamp - price_account.timestamp;
        require!(age <= MAX_PYTH_STALENESS_SECS, OracleError::PythPriceStale);

        msg!("SOL/USD: ${}", price_account.agg.price);
        Ok(price_account.agg.price)
    }
}

// ─── ACCOUNTS ────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeOracle<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + Oracle::INIT_SPACE,
        seeds = [b"oracle"],
        bump,
    )]
    pub oracle: Account<'info, Oracle>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(narrative_id: u64)]
pub struct WriteScore<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"oracle"],
        bump = oracle.bump,
        has_one = authority,
    )]
    pub oracle: Account<'info, Oracle>,

    #[account(
        init,
        payer = authority,
        space = 8 + ScoreRecord::INIT_SPACE,
        seeds = [b"score", narrative_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub score_record: Account<'info, ScoreRecord>,

    /// CHECK: Pyth price feed — validated via key constraint and manual deserialization
    #[account(
        constraint = pyth_price_feed.key().to_string() == PYTH_SOL_USD_FEED
            @ OracleError::WrongPythFeed
    )]
    pub pyth_price_feed: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GetSolPrice<'info> {
    /// CHECK: Pyth price feed account
    pub pyth_price_feed: UncheckedAccount<'info>,
}

// ─── STATE ────────────────────────────────────────────────────────────────────

#[account]
#[derive(InitSpace)]
pub struct Oracle {
    pub authority: Pubkey,
    pub total_scores_written: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct ScoreRecord {
    pub narrative_id: u64,
    pub originality_score: u8,
    pub community_score: u8,
    pub novelty: u8,
    pub clarity: u8,
    pub timeliness: u8,
    pub potential: u8,
    pub composite_score: u8,
    pub verdict: NarrativeVerdict,
    pub sol_price_at_scoring: i64,
    pub written_at: i64,
    pub bump: u8,
}

// ─── ENUMS ───────────────────────────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, InitSpace)]
pub enum NarrativeVerdict {
    Graduated,
    Slashed,
    Expired,
}

// ─── EVENTS ──────────────────────────────────────────────────────────────────

#[event]
pub struct ScoreWritten {
    pub narrative_id: u64,
    pub composite_score: u8,
    pub verdict: NarrativeVerdict,
    pub sol_price: i64,
    pub written_at: i64,
}

// ─── ERRORS ──────────────────────────────────────────────────────────────────

#[error_code]
pub enum OracleError {
    #[msg("Score must be between 0 and 100")]
    InvalidScore,
    #[msg("Pyth price is stale (> 30 seconds old)")]
    PythPriceStale,
    #[msg("Pyth price feed account is invalid")]
    PythFeedInvalid,
    #[msg("Pyth price is zero or negative")]
    PythPriceInvalid,
    #[msg("Wrong Pyth feed address")]
    WrongPythFeed,
}
