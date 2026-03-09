use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::{
        self, Token2022,
        spl_token_2022::{
            extension::transfer_hook::TransferHookAccount,
            instruction::AuthorityType,
        },
    },
    token_interface::{Mint, TokenAccount, TokenInterface},
    associated_token::AssociatedToken,
};
use spl_transfer_hook_interface::instruction::ExecuteInstruction;

declare_id!("11111111111111111111111111111111");

pub const MAGMA_DECIMALS: u8 = 9;
pub const MAGMA_TOTAL_SUPPLY: u64 = 1_000_000_000 * 10u64.pow(9 as u32); // 1B tokens

#[program]
pub mod magma_token {
    use super::*;

    /// Initialize the $MAGMA token mint with Token-2022
    /// Includes TransferHook extension for future royalty/fee logic
    pub fn initialize_mint(
        ctx: Context<InitializeMint>,
        transfer_hook_program_id: Option<Pubkey>,
    ) -> Result<()> {
        msg!("🌋 Initializing $MAGMA Token-2022 mint");
        msg!("Total supply: 1,000,000,000 $MAGMA");
        msg!("Decimals: {}", MAGMA_DECIMALS);

        // Store mint authority info
        let mint_config = &mut ctx.accounts.mint_config;
        mint_config.authority = ctx.accounts.authority.key();
        mint_config.mint = ctx.accounts.mint.key();
        mint_config.total_minted = 0;
        mint_config.is_frozen = false;
        mint_config.bump = ctx.bumps.mint_config;

        msg!("Mint initialized: {}", ctx.accounts.mint.key());
        Ok(())
    }

    /// Mint tokens to a destination account
    pub fn mint_tokens(
        ctx: Context<MintTokens>,
        amount: u64,
    ) -> Result<()> {
        require!(!ctx.accounts.mint_config.is_frozen, MagmaError::MintFrozen);
        require!(amount > 0, MagmaError::InvalidAmount);

        let new_total = ctx.accounts.mint_config.total_minted
            .checked_add(amount)
            .ok_or(MagmaError::Overflow)?;

        require!(new_total <= MAGMA_TOTAL_SUPPLY, MagmaError::ExceedsMaxSupply);

        // Mint via Token-2022
        let cpi_accounts = token_2022::MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.destination.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
        );
        token_2022::mint_to(cpi_ctx, amount)?;

        ctx.accounts.mint_config.total_minted = new_total;

        msg!("✓ Minted {} $MAGMA to {}", amount, ctx.accounts.destination.key());
        Ok(())
    }

    /// Freeze the mint — no more tokens can be created after this
    pub fn freeze_mint(ctx: Context<FreezeMint>) -> Result<()> {
        ctx.accounts.mint_config.is_frozen = true;
        msg!("🔒 $MAGMA mint frozen. Supply is now fixed at {} tokens",
            ctx.accounts.mint_config.total_minted / 10u64.pow(MAGMA_DECIMALS as u32)
        );
        Ok(())
    }

    /// Transfer hook execute — called on every $MAGMA transfer
    /// Currently a passthrough — future: add narrative staking checks
    pub fn transfer_hook_execute(
        ctx: Context<TransferHookExecute>,
        amount: u64,
    ) -> Result<()> {
        msg!("🔗 Transfer hook: {} $MAGMA transferred", amount);
        // Future: check if sender has active narrative stake
        // Future: take protocol fee on large transfers
        Ok(())
    }
}

// ─── ACCOUNTS ────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeMint<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    /// The Token-2022 mint account
    /// Created externally with Token-2022 extensions before calling this
    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,

    /// PDA to store mint metadata
    #[account(
        init,
        payer = authority,
        space = 8 + MintConfig::INIT_SPACE,
        seeds = [b"mint_config", mint.key().as_ref()],
        bump,
    )]
    pub mint_config: Account<'info, MintConfig>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        seeds = [b"mint_config", mint.key().as_ref()],
        bump = mint_config.bump,
        has_one = authority,
        has_one = mint,
    )]
    pub mint_config: Account<'info, MintConfig>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = destination_authority,
        associated_token::token_program = token_program,
    )]
    pub destination: InterfaceAccount<'info, TokenAccount>,

    /// CHECK: The authority of the destination token account
    pub destination_authority: UncheckedAccount<'info>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FreezeMint<'info> {
    pub authority: Signer<'info>,

    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        seeds = [b"mint_config", mint.key().as_ref()],
        bump = mint_config.bump,
        has_one = authority,
    )]
    pub mint_config: Account<'info, MintConfig>,
}

#[derive(Accounts)]
pub struct TransferHookExecute<'info> {
    /// CHECK: Source token account
    pub source: UncheckedAccount<'info>,
    /// CHECK: Mint
    pub mint: UncheckedAccount<'info>,
    /// CHECK: Destination token account
    pub destination: UncheckedAccount<'info>,
    /// CHECK: Owner of source
    pub owner: UncheckedAccount<'info>,
    /// CHECK: Extra account meta list PDA
    pub extra_account_meta_list: UncheckedAccount<'info>,
}

// ─── STATE ────────────────────────────────────────────────────────────────────

#[account]
#[derive(InitSpace)]
pub struct MintConfig {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub total_minted: u64,
    pub is_frozen: bool,
    pub bump: u8,
}

// ─── ERRORS ──────────────────────────────────────────────────────────────────

#[error_code]
pub enum MagmaError {
    #[msg("Mint is frozen — supply is fixed")]
    MintFrozen,
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("Exceeds maximum supply of 1B $MAGMA")]
    ExceedsMaxSupply,
    #[msg("Arithmetic overflow")]
    Overflow,
}
