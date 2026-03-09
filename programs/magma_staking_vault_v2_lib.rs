use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("11111111111111111111111111111111");

pub const MIN_STAKE_LAMPORTS: u64 = 10_000_000; // 0.01 SOL minimum
pub const VAULT_FEE_BPS: u64 = 200; // 2% protocol fee on yield
pub const SCORING_WINDOW_DAYS: i64 = 7;

#[program]
pub mod magma_staking_vault {
    use super::*;

    /// Initialize the global vault
    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.authority = ctx.accounts.authority.key();
        vault.total_staked = 0;
        vault.total_yield_distributed = 0;
        vault.fee_bps = VAULT_FEE_BPS;
        vault.bump = ctx.bumps.vault;
        vault.vault_sol_bump = ctx.bumps.vault_sol;
        msg!("✓ MAGMA Staking Vault initialized");
        Ok(())
    }

    /// Stake SOL on a narrative
    pub fn stake_on_narrative(
        ctx: Context<StakeOnNarrative>,
        narrative_id: u64,
        amount_lamports: u64,
    ) -> Result<()> {
        require!(amount_lamports >= MIN_STAKE_LAMPORTS, VaultError::StakeTooSmall);

        let clock = Clock::get()?;
        let stake = &mut ctx.accounts.stake;
        let vault = &mut ctx.accounts.vault;

        let cpi_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.staker.to_account_info(),
                to: ctx.accounts.vault_sol.to_account_info(),
            },
        );
        system_program::transfer(cpi_ctx, amount_lamports)?;

        stake.staker = ctx.accounts.staker.key();
        stake.narrative_id = narrative_id;
        stake.amount_lamports = amount_lamports;
        stake.staked_at = clock.unix_timestamp;
        stake.unstaked_at = 0;
        stake.yield_earned = 0;
        stake.is_active = true;
        stake.bump = ctx.bumps.stake;

        vault.total_staked = vault.total_staked
            .checked_add(amount_lamports)
            .ok_or(VaultError::Overflow)?;

        emit!(Staked {
            staker: ctx.accounts.staker.key(),
            narrative_id,
            amount_lamports,
            staked_at: clock.unix_timestamp,
        });

        msg!("🌋 Staked {} lamports on narrative #{}", amount_lamports, narrative_id);
        Ok(())
    }

    /// Unstake SOL after scoring window
    pub fn unstake(ctx: Context<Unstake>) -> Result<()> {
        let clock = Clock::get()?;
        let stake = &mut ctx.accounts.stake;
        let vault = &mut ctx.accounts.vault;

        require!(stake.is_active, VaultError::StakeNotActive);

        let window_end = stake.staked_at + (SCORING_WINDOW_DAYS * 86400);
        require!(
            clock.unix_timestamp >= window_end,
            VaultError::StakingWindowActive
        );

        let return_amount = stake.amount_lamports
            .checked_add(stake.yield_earned)
            .ok_or(VaultError::Overflow)?;

        let vault_sol_bump = vault.vault_sol_bump;
        let seeds = &[b"vault_sol".as_ref(), &[vault_sol_bump]];
        let signer = &[&seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.vault_sol.to_account_info(),
                to: ctx.accounts.staker.to_account_info(),
            },
            signer,
        );
        system_program::transfer(cpi_ctx, return_amount)?;

        vault.total_staked = vault.total_staked.saturating_sub(stake.amount_lamports);

        stake.is_active = false;
        stake.unstaked_at = clock.unix_timestamp;

        emit!(Unstaked {
            staker: ctx.accounts.staker.key(),
            narrative_id: stake.narrative_id,
            amount_lamports: stake.amount_lamports,
            yield_earned: stake.yield_earned,
            unstaked_at: clock.unix_timestamp,
        });

        msg!("✓ Unstaked {} lamports + {} yield", stake.amount_lamports, stake.yield_earned);
        Ok(())
    }

    /// Credit yield to a stake position
    pub fn credit_yield(
        ctx: Context<CreditYield>,
        yield_lamports: u64,
    ) -> Result<()> {
        let stake = &mut ctx.accounts.stake;
        require!(stake.is_active, VaultError::StakeNotActive);

        let fee = yield_lamports
            .checked_mul(ctx.accounts.vault.fee_bps)
            .ok_or(VaultError::Overflow)?
            .checked_div(10000)
            .ok_or(VaultError::Overflow)?;

        let net_yield = yield_lamports
            .checked_sub(fee)
            .ok_or(VaultError::Overflow)?;

        stake.yield_earned = stake.yield_earned
            .checked_add(net_yield)
            .ok_or(VaultError::Overflow)?;

        ctx.accounts.vault.total_yield_distributed = ctx.accounts.vault.total_yield_distributed
            .checked_add(net_yield)
            .ok_or(VaultError::Overflow)?;

        emit!(YieldCredited {
            staker: stake.staker,
            narrative_id: stake.narrative_id,
            yield_lamports: net_yield,
        });

        msg!("✓ Credited {} lamports yield (fee: {})", net_yield, fee);
        Ok(())
    }
}

// ─── ACCOUNTS ────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + Vault::INIT_SPACE,
        seeds = [b"vault"],
        bump,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        init,
        payer = authority,
        space = 8,
        seeds = [b"vault_sol"],
        bump,
    )]
    pub vault_sol: Account<'info, VaultSol>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(narrative_id: u64)]
pub struct StakeOnNarrative<'info> {
    #[account(mut)]
    pub staker: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault"],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [b"vault_sol"],
        bump = vault.vault_sol_bump,
    )]
    pub vault_sol: Account<'info, VaultSol>,

    #[account(
        init,
        payer = staker,
        space = 8 + Stake::INIT_SPACE,
        seeds = [b"stake", staker.key().as_ref(), narrative_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub stake: Account<'info, Stake>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut)]
    pub staker: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault"],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [b"vault_sol"],
        bump = vault.vault_sol_bump,
    )]
    pub vault_sol: Account<'info, VaultSol>,

    #[account(
        mut,
        seeds = [b"stake", staker.key().as_ref(), stake.narrative_id.to_le_bytes().as_ref()],
        bump = stake.bump,
        has_one = staker,
    )]
    pub stake: Account<'info, Stake>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreditYield<'info> {
    pub authority: Signer<'info>,

    #[account(
        seeds = [b"vault"],
        bump = vault.bump,
        has_one = authority,
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub stake: Account<'info, Stake>,
}

// ─── STATE ────────────────────────────────────────────────────────────────────

#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub authority: Pubkey,
    pub total_staked: u64,
    pub total_yield_distributed: u64,
    pub fee_bps: u64,
    pub bump: u8,
    pub vault_sol_bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct VaultSol {}

#[account]
#[derive(InitSpace)]
pub struct Stake {
    pub staker: Pubkey,
    pub narrative_id: u64,
    pub amount_lamports: u64,
    pub staked_at: i64,
    pub unstaked_at: i64,
    pub yield_earned: u64,
    pub is_active: bool,
    pub bump: u8,
}

// ─── EVENTS ──────────────────────────────────────────────────────────────────

#[event]
pub struct Staked {
    pub staker: Pubkey,
    pub narrative_id: u64,
    pub amount_lamports: u64,
    pub staked_at: i64,
}

#[event]
pub struct Unstaked {
    pub staker: Pubkey,
    pub narrative_id: u64,
    pub amount_lamports: u64,
    pub yield_earned: u64,
    pub unstaked_at: i64,
}

#[event]
pub struct YieldCredited {
    pub staker: Pubkey,
    pub narrative_id: u64,
    pub yield_lamports: u64,
}

// ─── ERRORS ──────────────────────────────────────────────────────────────────

#[error_code]
pub enum VaultError {
    #[msg("Minimum stake is 0.01 SOL")]
    StakeTooSmall,
    #[msg("Stake position is not active")]
    StakeNotActive,
    #[msg("Cannot unstake during the 7-day scoring window")]
    StakingWindowActive,
    #[msg("Arithmetic overflow")]
    Overflow,
}
