use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

pub const MAX_TITLE_LEN: usize = 100;
pub const MAX_THESIS_LEN: usize = 2000;
pub const MAX_IPFS_CID_LEN: usize = 64;
pub const NARRATIVE_DURATION_DAYS: i64 = 7;

#[program]
pub mod magma_narrative_registry {
    use super::*;

    /// Register a new narrative on-chain
    /// Called after the AI agent pipeline completes and kit is uploaded to IPFS
    pub fn register_narrative(
        ctx: Context<RegisterNarrative>,
        title: String,
        thesis: String,
        kit_cid: String,
        originality_score: u8,
    ) -> Result<()> {
        require!(title.len() <= MAX_TITLE_LEN, RegistryError::TitleTooLong);
        require!(thesis.len() <= MAX_THESIS_LEN, RegistryError::ThesisTooLong);
        require!(kit_cid.len() <= MAX_IPFS_CID_LEN, RegistryError::CidTooLong);
        require!(originality_score <= 100, RegistryError::InvalidScore);
        require!(originality_score >= 50, RegistryError::NotOriginalEnough);

        let narrative = &mut ctx.accounts.narrative;
        let clock = Clock::get()?;

        narrative.author = ctx.accounts.author.key();
        narrative.title = title.clone();
        narrative.thesis = thesis;
        narrative.kit_cid = kit_cid;
        narrative.originality_score = originality_score;
        narrative.community_score = 0;
        narrative.sol_backed = 0;
        narrative.backers = 0;
        narrative.status = NarrativeStatus::Active;
        narrative.created_at = clock.unix_timestamp;
        narrative.expires_at = clock.unix_timestamp + (NARRATIVE_DURATION_DAYS * 86400);
        narrative.votes_yes = 0;
        narrative.votes_no = 0;
        narrative.bump = ctx.bumps.narrative;
        narrative.narrative_id = ctx.accounts.registry.narrative_count;

        // Increment registry count
        ctx.accounts.registry.narrative_count += 1;

        emit!(NarrativeRegistered {
            narrative_id: narrative.narrative_id,
            author: narrative.author,
            title: title,
            originality_score,
            created_at: narrative.created_at,
        });

        msg!("🌋 Narrative #{} registered: {}", narrative.narrative_id, narrative.title);
        Ok(())
    }

    /// Initialize the global registry
    pub fn initialize_registry(ctx: Context<InitializeRegistry>) -> Result<()> {
        let registry = &mut ctx.accounts.registry;
        registry.authority = ctx.accounts.authority.key();
        registry.narrative_count = 0;
        registry.bump = ctx.bumps.registry;
        msg!("✓ MAGMA Narrative Registry initialized");
        Ok(())
    }

    /// Update narrative status (authority only)
    /// Called by scoring oracle after 7-day window
    pub fn update_status(
        ctx: Context<UpdateStatus>,
        new_status: NarrativeStatus,
    ) -> Result<()> {
        let narrative = &mut ctx.accounts.narrative;
        let clock = Clock::get()?;

        // Can only graduate/slash after expiry
        if new_status != NarrativeStatus::Active {
            require!(
                clock.unix_timestamp >= narrative.expires_at,
                RegistryError::NarrativeNotExpired
            );
        }

        narrative.status = new_status.clone();

        emit!(NarrativeStatusUpdated {
            narrative_id: narrative.narrative_id,
            new_status,
            updated_at: clock.unix_timestamp,
        });

        msg!("Narrative #{} status updated", narrative.narrative_id);
        Ok(())
    }

    /// Cast a community vote on a narrative
    pub fn cast_vote(
        ctx: Context<CastVote>,
        vote_yes: bool,
    ) -> Result<()> {
        let narrative = &mut ctx.accounts.narrative;
        let vote_record = &mut ctx.accounts.vote_record;
        let clock = Clock::get()?;

        require!(
            narrative.status == NarrativeStatus::Active,
            RegistryError::NarrativeNotActive
        );
        require!(
            clock.unix_timestamp < narrative.expires_at,
            RegistryError::NarrativeExpired
        );
        require!(!vote_record.has_voted, RegistryError::AlreadyVoted);

        if vote_yes {
            narrative.votes_yes += 1;
        } else {
            narrative.votes_no += 1;
        }

        vote_record.voter = ctx.accounts.voter.key();
        vote_record.narrative_id = narrative.narrative_id;
        vote_record.vote_yes = vote_yes;
        vote_record.voted_at = clock.unix_timestamp;
        vote_record.has_voted = true;
        vote_record.bump = ctx.bumps.vote_record;

        // Recalculate community score
        let total_votes = narrative.votes_yes + narrative.votes_no;
        if total_votes > 0 {
            narrative.community_score = ((narrative.votes_yes * 100) / total_votes) as u8;
        }

        emit!(VoteCast {
            narrative_id: narrative.narrative_id,
            voter: ctx.accounts.voter.key(),
            vote_yes,
            new_score: narrative.community_score,
        });

        msg!("Vote cast on narrative #{}: {}", narrative.narrative_id, if vote_yes { "YES" } else { "NO" });
        Ok(())
    }
}

// ─── ACCOUNTS ────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeRegistry<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + Registry::INIT_SPACE,
        seeds = [b"registry"],
        bump,
    )]
    pub registry: Account<'info, Registry>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(title: String, thesis: String, kit_cid: String)]
pub struct RegisterNarrative<'info> {
    #[account(mut)]
    pub author: Signer<'info>,

    #[account(
        mut,
        seeds = [b"registry"],
        bump = registry.bump,
    )]
    pub registry: Account<'info, Registry>,

    #[account(
        init,
        payer = author,
        space = 8 + Narrative::INIT_SPACE,
        seeds = [b"narrative", registry.narrative_count.to_le_bytes().as_ref()],
        bump,
    )]
    pub narrative: Account<'info, Narrative>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateStatus<'info> {
    pub authority: Signer<'info>,

    #[account(
        seeds = [b"registry"],
        bump = registry.bump,
        has_one = authority,
    )]
    pub registry: Account<'info, Registry>,

    #[account(
        mut,
        seeds = [b"narrative", narrative.narrative_id.to_le_bytes().as_ref()],
        bump = narrative.bump,
    )]
    pub narrative: Account<'info, Narrative>,
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,

    #[account(
        mut,
        seeds = [b"narrative", narrative.narrative_id.to_le_bytes().as_ref()],
        bump = narrative.bump,
    )]
    pub narrative: Account<'info, Narrative>,

    #[account(
        init,
        payer = voter,
        space = 8 + VoteRecord::INIT_SPACE,
        seeds = [b"vote", narrative.key().as_ref(), voter.key().as_ref()],
        bump,
    )]
    pub vote_record: Account<'info, VoteRecord>,

    pub system_program: Program<'info, System>,
}

// ─── STATE ────────────────────────────────────────────────────────────────────

#[account]
#[derive(InitSpace)]
pub struct Registry {
    pub authority: Pubkey,
    pub narrative_count: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Narrative {
    pub narrative_id: u64,
    pub author: Pubkey,
    #[max_len(100)]
    pub title: String,
    #[max_len(2000)]
    pub thesis: String,
    #[max_len(64)]
    pub kit_cid: String,
    pub originality_score: u8,
    pub community_score: u8,
    pub sol_backed: u64,
    pub backers: u32,
    pub status: NarrativeStatus,
    pub created_at: i64,
    pub expires_at: i64,
    pub votes_yes: u64,
    pub votes_no: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct VoteRecord {
    pub voter: Pubkey,
    pub narrative_id: u64,
    pub vote_yes: bool,
    pub voted_at: i64,
    pub has_voted: bool,
    pub bump: u8,
}

// ─── ENUMS ───────────────────────────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, InitSpace)]
pub enum NarrativeStatus {
    Active,
    Graduated,
    Slashed,
    Expired,
}

// ─── EVENTS ──────────────────────────────────────────────────────────────────

#[event]
pub struct NarrativeRegistered {
    pub narrative_id: u64,
    pub author: Pubkey,
    pub title: String,
    pub originality_score: u8,
    pub created_at: i64,
}

#[event]
pub struct NarrativeStatusUpdated {
    pub narrative_id: u64,
    pub new_status: NarrativeStatus,
    pub updated_at: i64,
}

#[event]
pub struct VoteCast {
    pub narrative_id: u64,
    pub voter: Pubkey,
    pub vote_yes: bool,
    pub new_score: u8,
}

// ─── ERRORS ──────────────────────────────────────────────────────────────────

#[error_code]
pub enum RegistryError {
    #[msg("Title exceeds 100 characters")]
    TitleTooLong,
    #[msg("Thesis exceeds 2000 characters")]
    ThesisTooLong,
    #[msg("IPFS CID exceeds 64 characters")]
    CidTooLong,
    #[msg("Score must be between 0 and 100")]
    InvalidScore,
    #[msg("Originality score must be at least 50 to register")]
    NotOriginalEnough,
    #[msg("Narrative has not expired yet")]
    NarrativeNotExpired,
    #[msg("Narrative is not active")]
    NarrativeNotActive,
    #[msg("Narrative voting period has ended")]
    NarrativeExpired,
    #[msg("You have already voted on this narrative")]
    AlreadyVoted,
}
