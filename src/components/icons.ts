// src/components/icons.ts
// ─────────────────────────────────────────────────────────────────────────────
// Central icon registry for MAGMA Protocol.
// Import ALL icons from here — never use emoji anywhere in the app.
//
// Quick reference:
//   🌋 → <MagmaLogo />       (custom SVG — import from ./MagmaLogo)
//   🔥 → <Flame />
//   ⚡ → <Zap />
//   🏆 → <Trophy />
//   📊 → <BarChart2 />
//   🎯 → <Target />
//   ✅ → <CheckCircle />
//   ❌ → <XCircle />
//   ⚠️ → <AlertTriangle />
//   ✨ → <Sparkles />         (OriginalityCheck "Original" badge)
//   🔗 → <Link2 />
//   👤 → <User />
//   💎 → <Gem />
//   🌐 → <Globe />
//   📱 → <Smartphone />
//   💰 → <DollarSign />
//   📈 → <TrendingUp />
//   📉 → <TrendingDown />
//   🔔 → <Bell />
//   👛 → <Wallet />
//   📤 → <Send />
//   🔒 → <Lock />
//   🔓 → <Unlock />
//   ℹ️ → <Info />
//   ⟳  → <RefreshCw />
//   →  → <ArrowRight />
// ─────────────────────────────────────────────────────────────────────────────

export {
  // Core UI
  Flame,
  Zap,
  Trophy,
  BarChart2,
  Target,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Sparkles,
  // Navigation / links
  Link2,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ExternalLink,
  // People / identity
  User,
  Users,
  // Finance
  Gem,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  // Web / connectivity
  Globe,
  Wifi,
  // Device
  Smartphone,
  // Notifications
  Bell,
  BellOff,
  // Wallet / send
  Wallet,
  Send,
  // Security
  Lock,
  Unlock,
  Shield,
  // Utility
  Info,
  RefreshCw,
  Clock,
  Calendar,
  Search,
  Filter,
  Settings,
  MoreHorizontal,
  // Content / narrative
  FileText,
  BookOpen,
  Star,
  Minus,
  Plus,
  Copy,
  Share2,
  Eye,
  EyeOff,
} from 'lucide-react-native';

// ─── Re-export custom components ─────────────────────────────────────────────
export { MagmaLogo }             from './MagmaLogo';
export { GlowEmptyState }        from './GlowEmptyState';
export { TierBadge, getTierFromScore, TierProgressBar } from './TierBadge';
export { StageBadge }            from './StageBadge';
export { OriginalityBadge, OriginalityCheckCard } from './OriginalityBadge';
export { ProtocolLogo, ProtocolCard, PROTOCOL_LOGOS } from './ProtocolCard';
export { AgentProgress }         from './AgentProgress';
export { FilterPill }            from './FilterPill';
export { StatCard, StatRow }     from './StatCard';

// ─── Design-token icon sizes ──────────────────────────────────────────────────
// Use these constants for consistent sizing across all screens.

/** 10px — inline within tight labels, filter pills */
export const ICON_XS = { size: 10, strokeWidth: 2.5 } as const;

/** 12px — badge icons, secondary labels */
export const ICON_SM = { size: 12, strokeWidth: 2.5 } as const;

/** 16px — card body icons (default) */
export const ICON_MD = { size: 16, strokeWidth: 2   } as const;

/** 20px — section headers, nav icons */
export const ICON_LG = { size: 20, strokeWidth: 1.75 } as const;

/** 24px — tab bar, hero callouts */
export const ICON_XL = { size: 24, strokeWidth: 1.5  } as const;

// ─── Colour shortcuts ─────────────────────────────────────────────────────────
export const COLORS = {
  primary:  '#ff6b35',
  accent:   '#ffb347',
  text:     '#f0d8c0',
  muted:    '#7a4a30',
  bg:       '#080400',
  card:     '#1a0f0a',
  green:    '#00ff88',
  blue:     '#00c4ff',
  red:      '#ff3232',
} as const;
