
// MAGMA Design System V2 — Token definitions
// Dark: V2 canonical (supersedes H2 original dark values)
// Light: H2 original values (unchanged)

export const darkTokens = {
  // Backgrounds
  bgBase:          '#09080C',
  bgSurface:       '#111018',
  bgElevated:      '#18161F',
  bgGlass:         'rgba(255, 255, 255, 0.04)',

  // Brand
  orange:          '#FF6B35',
  amber:           '#FFB347',
  volcanic:        '#FF3A1A',
  ember:           '#CC7722',

  // Text
  textPrimary:     '#F2EEF8',
  textSecondary:   '#9B95A8',
  textTertiary:    '#5C5668',

  // Borders
  borderSubtle:    'rgba(255, 255, 255, 0.06)',
  borderMedium:    'rgba(255, 107, 53, 0.15)',
  borderActive:    'rgba(255, 107, 53, 0.45)',

  // Cards
  cardBg:          '#111018',
  cardBorder:      'rgba(255, 255, 255, 0.06)',
  cardBorderHover: 'rgba(255, 107, 53, 0.30)',

  // Status
  green:           '#22C55E',
  red:             '#EF4444',
  yellow:          '#F59E0B',
  blue:            '#3B82F6',

  // Risk badges
  riskLow:         '#22C55E',
  riskMed:         '#F59E0B',
  riskHigh:        '#EF4444',
} as const;

export const lightTokens = {
  // Backgrounds
  bgBase:          '#FFF8F0',
  bgSurface:       '#FFFFFF',
  bgElevated:      '#F5EFE8',
  bgGlass:         'rgba(0, 0, 0, 0.02)',

  // Brand (adjusted for light bg)
  orange:          '#D44E1F',
  amber:           '#CC8A00',
  volcanic:        '#B52E0F',
  ember:           '#A05A1A',

  // Text
  textPrimary:     '#1A0E08',
  textSecondary:   '#6B5A4A',
  textTertiary:    '#9B8A7A',

  // Borders
  borderSubtle:    '#E8D8C0',
  borderMedium:    'rgba(212, 78, 31, 0.20)',
  borderActive:    'rgba(212, 78, 31, 0.50)',

  // Cards
  cardBg:          '#FFFFFF',
  cardBorder:      '#E8D8C0',
  cardBorderHover: 'rgba(212, 78, 31, 0.25)',

  // Status
  green:           '#16A34A',
  red:             '#DC2626',
  yellow:          '#D97706',
  blue:            '#2563EB',

  // Risk badges
  riskLow:         '#16A34A',
  riskMed:         '#D97706',
  riskHigh:        '#DC2626',
} as const;

// Shared across both themes

export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  full: 9999,
} as const;

export const spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  xxxl: 32,
} as const;

export const fontSize = {
  xs:  11,
  sm:  13,
  md:  15,
  lg:  18,
  xl:  22,
  xxl: 28,
  xxxl: 36,
} as const;

export const fontFamily = {
  heading: 'Syne_700Bold',
  mono:    'SpaceMono_400Regular',
  ui:      undefined, // system default
} as const;

export const gradients = {
  primaryDark:  ['#FF6B35', '#FF8C42'] as [string, string],
  primaryLight: ['#D44E1F', '#E06030'] as [string, string],
} as const;

export const tierColors = {
  ember: {
    bg:     'rgba(204, 119, 34, 0.15)',
    border: 'rgba(204, 119, 34, 0.40)',
    text:   '#CC7722',
    emoji:  '⬡',
  },
  flare: {
    bg:     'rgba(255, 107, 53, 0.15)',
    border: 'rgba(255, 107, 53, 0.40)',
    text:   '#FF6B35',
    emoji:  '⚡',
  },
  magma: {
    bg:     'rgba(255, 58, 26, 0.15)',
    border: 'rgba(255, 58, 26, 0.40)',
    text:   '#FF3A1A',
    emoji:  '🌋',
  },
  core: {
    bg:     'rgba(255, 30, 10, 0.15)',
    border: 'rgba(255, 30, 10, 0.40)',
    text:   '#FF1E0A',
    emoji:  '💎',
  },
  volcanic: {
    bg:     'rgba(255, 0, 0, 0.20)',
    border: 'rgba(255, 0, 0, 0.50)',
    text:   '#FF0000',
    emoji:  '🔥',
  },
} as const;

export type ThemeTokens = typeof darkTokens | typeof lightTokens;
export type TierKey = keyof typeof tierColors;
