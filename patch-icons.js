const fs = require('fs');
const path = require('path');

function patch(relPath, replacements) {
  const fp = path.join(__dirname, relPath);
  if (!fs.existsSync(fp)) { console.log(`⚠️  Not found: ${relPath}`); return; }
  let c = fs.readFileSync(fp, 'utf8');
  let changed = false;
  replacements.forEach(([from, to]) => {
    if (c.includes(from)) { c = c.split(from).join(to); changed = true; }
  });
  if (changed) { fs.writeFileSync(fp, c); console.log(`✅ Patched: ${relPath}`); }
  else { console.log(`⚠️  No changes: ${relPath}`); }
}

// ─── AgentProgress.tsx ────────────────────────────────────────────────────────
patch('src/components/AgentProgress.tsx', [
  // Add lucide import after existing imports
  [`import { API_URL } from '../config';`,
   `import { API_URL } from '../config';
import { Search, Sparkles, Anchor, FileText, Twitter, BarChart2, Globe, CheckCircle, XCircle, AlertTriangle, PartyPopper } from 'lucide-react-native';`],
  // Agent icons
  [`{ id: 'thesis', name: 'Thesis Analyzer', icon: '🔍'`,
   `{ id: 'thesis', name: 'Thesis Analyzer', icon: 'search'`],
  [`{ id: 'originality', name: 'Originality Checker', icon: '✨'`,
   `{ id: 'originality', name: 'Originality Checker', icon: 'sparkles'`],
  [`{ id: 'hook', name: 'Hook Writer', icon: '🎣'`,
   `{ id: 'hook', name: 'Hook Writer', icon: 'anchor'`],
  [`{ id: 'article', name: 'Article Writer', icon: '📝'`,
   `{ id: 'article', name: 'Article Writer', icon: 'filetext'`],
  [`{ id: 'thread', name: 'Thread Writer', icon: '🧵'`,
   `{ id: 'thread', name: 'Thread Writer', icon: 'twitter'`],
  [`{ id: 'score', name: 'Score Evaluator', icon: '📊'`,
   `{ id: 'score', name: 'Score Evaluator', icon: 'barchart'`],
  [`{ id: 'ipfs', name: 'IPFS Publisher', icon: '🌐'`,
   `{ id: 'ipfs', name: 'IPFS Publisher', icon: 'globe'`],
  // Status icons
  [`return <Text style={styles.statusIcon}>✓</Text>;`,
   `return <CheckCircle size={14} color="#00ff88" strokeWidth={2} />;`],
  [`return <Text style={styles.statusIcon}>✕</Text>;`,
   `return <XCircle size={14} color="#ff3232" strokeWidth={2} />;`],
  [`<Text style={styles.errorIcon}>⚠️</Text>`,
   `<AlertTriangle size={16} color="#ffb347" strokeWidth={2} />`],
  [`<Text style={styles.successIcon}>🎉</Text>`,
   `<CheckCircle size={20} color="#00ff88" strokeWidth={2} />`],
  // Agent icon renderer — replace emoji text render
  [`<Text style={styles.agentIcon}>{step.icon}</Text>`,
   `<AgentIconRenderer icon={step.icon} />`],
]);

// Add AgentIconRenderer helper to AgentProgress
const agentPath = path.join(__dirname, 'src/components/AgentProgress.tsx');
let agentC = fs.readFileSync(agentPath, 'utf8');
if (!agentC.includes('AgentIconRenderer')) {
  const helperFn = `
const ICON_MAP: Record<string, React.ReactNode> = {
  search:    <Search size={14} color="#ff6b35" strokeWidth={2} />,
  sparkles:  <Sparkles size={14} color="#ff6b35" strokeWidth={2} />,
  anchor:    <Anchor size={14} color="#ff6b35" strokeWidth={2} />,
  filetext:  <FileText size={14} color="#ff6b35" strokeWidth={2} />,
  twitter:   <Twitter size={14} color="#ff6b35" strokeWidth={2} />,
  barchart:  <BarChart2 size={14} color="#ff6b35" strokeWidth={2} />,
  globe:     <Globe size={14} color="#ff6b35" strokeWidth={2} />,
};
const AgentIconRenderer = ({ icon }: { icon: string }) => (
  <>{ICON_MAP[icon] || <Search size={14} color="#ff6b35" strokeWidth={2} />}</>
);
`;
  agentC = agentC.replace(
    `type StepStatus = 'pending' | 'running' | 'done' | 'error';`,
    helperFn + `type StepStatus = 'pending' | 'running' | 'done' | 'error';`
  );
  fs.writeFileSync(agentPath, agentC);
  console.log('✅ AgentIconRenderer added');
}

// ─── DeFiScreen.tsx ───────────────────────────────────────────────────────────
patch('src/screens/DeFiScreen.tsx', [
  [`import { useSafeAreaInsets } from 'react-native-safe-area-context';`,
   `import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flame, TrendingUp } from 'lucide-react-native';`],
  [`<Text style={styles.apyCardIconText}>🔥</Text>`,
   `<Flame size={18} color="#ff6b35" strokeWidth={2} />`],
  [`<Text style={styles.yieldIcon}>📈</Text>`,
   `<TrendingUp size={18} color="#00ff88" strokeWidth={2} />`],
]);

// ─── FeedScreen.tsx ───────────────────────────────────────────────────────────
patch('src/screens/FeedScreen.tsx', [
  [`import { useSafeAreaInsets } from 'react-native-safe-area-context';`,
   `import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flame, AlertTriangle } from 'lucide-react-native';`],
  [`<Text style={styles.emptyIcon}>🔥</Text>`,
   `<Flame size={32} color="#ff6b35" strokeWidth={2} />`],
  [`<Text style={styles.errorIcon}>⚠️</Text>`,
   `<AlertTriangle size={32} color="#ffb347" strokeWidth={2} />`],
]);

// ─── LaunchScreen.tsx ─────────────────────────────────────────────────────────
patch('src/screens/LaunchScreen.tsx', [
  [`import { API_URL } from '../config';`,
   `import { API_URL } from '../config';
import { Sparkles, AlertTriangle, Wallet, CheckCircle } from 'lucide-react-native';`],
  [`{originalityResult.isOriginal ? '✨' : '⚠️'}`,
   `{originalityResult.isOriginal ? <Sparkles size={14} color="#00ff88" strokeWidth={2} /> : <AlertTriangle size={14} color="#ffb347" strokeWidth={2} />}`],
  [`<Text style={styles.connectIcon}>👛</Text>`,
   `<Wallet size={32} color="#ff6b35" strokeWidth={2} />`],
  [`<Text style={styles.successIcon}>🎉</Text>`,
   `<CheckCircle size={32} color="#00ff88" strokeWidth={2} />`],
  [`<Text style={styles.errorBannerIcon}>⚠️</Text>`,
   `<AlertTriangle size={14} color="#ffb347" strokeWidth={2} />`],
]);

// ─── LoadingScreen.tsx ────────────────────────────────────────────────────────
patch('src/screens/LoadingScreen.tsx', [
  [`import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';`,
   `import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import { MagmaLogo } from '../components/MagmaLogo';`],
  [`<Text style={s.iconEmoji}>🌋</Text>`,
   `<MagmaLogo size={52} color="#ff6b35" accentColor="#ffb347" />`],
]);

// ─── OnboardingScreen.tsx ─────────────────────────────────────────────────────
patch('src/screens/OnboardingScreen.tsx', [
  [`import Animated, {`,
   `import { MagmaLogo } from '../components/MagmaLogo';
import { Lightbulb, Check } from 'lucide-react-native';
import Animated, {`],
  // Welcome visual
  [`<Text style={vis.logoEmoji}>🌋</Text>`,
   `<MagmaLogo size={52} color="#ff6b35" accentColor="#ffb347" />`],
  // Ring core
  [`<Text style={vis.ringCoreEmoji}>💡</Text>`,
   `<Lightbulb size={20} color="#ffb347" strokeWidth={2} />`],
  // Ready visual
  [`<Text style={vis.readyEmoji}>🌋</Text>`,
   `<MagmaLogo size={48} color="#ff6b35" accentColor="#ffb347" />`],
  // CTA
  [`cta: 'Enter MAGMA 🌋'`,
   `cta: 'Enter MAGMA →'`],
  // Wallet checkmark
  [`{selected === i && <Text style={vis.walletCheck}>✓</Text>}`,
   `{selected === i && <Check size={16} color="#00ff88" strokeWidth={2.5} />}`],
  // Wallet emojis — replace with text initials styled
  [`{ emoji: '👻', name: 'Phantom', sub: 'Recommended · MWA' }`,
   `{ emoji: 'PH', name: 'Phantom', sub: 'Recommended · MWA' }`],
  [`{ emoji: '🎒', name: 'Backpack', sub: 'Solana Native' }`,
   `{ emoji: 'BP', name: 'Backpack', sub: 'Solana Native' }`],
  [`{ emoji: '🦅', name: 'Solflare', sub: 'Ledger Compatible' }`,
   `{ emoji: 'SF', name: 'Solflare', sub: 'Ledger Compatible' }`],
  // Wallet emoji text style → badge style
  [`<Text style={vis.walletEmoji}>{w.emoji}</Text>`,
   `<View style={vis.walletEmojiBox}><Text style={vis.walletEmojiText}>{w.emoji}</Text></View>`],
]);

// Add walletEmojiBox style to OnboardingScreen
const onboardPath = path.join(__dirname, 'src/screens/OnboardingScreen.tsx');
let onboardC = fs.readFileSync(onboardPath, 'utf8');
if (!onboardC.includes('walletEmojiBox')) {
  onboardC = onboardC.replace(
    `walletEmoji: { fontSize: 24 },`,
    `walletEmoji: { fontSize: 24 },
  walletEmojiBox: { width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(255,107,53,0.1)', borderWidth: 1, borderColor: 'rgba(255,107,53,0.2)', alignItems: 'center', justifyContent: 'center' },
  walletEmojiText: { fontSize: 10, fontWeight: '700', color: '#ff6b35', fontFamily: 'SpaceMono' },`
  );
  fs.writeFileSync(onboardPath, onboardC);
  console.log('✅ walletEmojiBox style added');
}

// ─── PortfolioScreen.tsx ──────────────────────────────────────────────────────
patch('src/screens/PortfolioScreen.tsx', [
  [`import { useSafeAreaInsets } from 'react-native-safe-area-context';`,
   `import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flame, DollarSign, TrendingUp, FileText, Wallet } from 'lucide-react-native';`],
  [`<Text style={styles.backedCardIconText}>🔥</Text>`,
   `<Flame size={16} color="#ff6b35" strokeWidth={2} />`],
  [`<Text style={styles.payoutCardIconText}>💰</Text>`,
   `<DollarSign size={16} color="#00ff88" strokeWidth={2} />`],
  [`<Text style={styles.yieldCardIcon}>📈</Text>`,
   `<TrendingUp size={16} color="#00ff88" strokeWidth={2} />`],
  [`icon="📝"`, `icon="filetext"`],
  [`icon="👛"`, `icon="wallet"`],
  [`icon="💰"`, `icon="dollar"`],
]);

// ─── ProfileScreen.tsx ────────────────────────────────────────────────────────
patch('src/screens/ProfileScreen.tsx', [
  [`import { useSafeAreaInsets } from 'react-native-safe-area-context';`,
   `import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flame, Star, Gem, Lock, Bell, ClipboardList, Shield, HelpCircle, Wallet } from 'lucide-react-native';`],
  // Tier icons
  [`{ name: 'Ember', minBalance: 0, maxBalance: 999, color: '#ff6b35', icon: '🔥'`,
   `{ name: 'Ember', minBalance: 0, maxBalance: 999, color: '#ff6b35', icon: 'flame'`],
  [`{ name: 'Flare', minBalance: 1000, maxBalance: 9999, color: '#ffb347', icon: '🌟'`,
   `{ name: 'Flare', minBalance: 1000, maxBalance: 9999, color: '#ffb347', icon: 'star'`],
  [`{ name: 'Magma', minBalance: 10000, maxBalance: 99999, color: '#ff3355', icon: '🌋'`,
   `{ name: 'Magma', minBalance: 10000, maxBalance: 99999, color: '#ff3355', icon: 'flame'`],
  [`{ name: 'Core', minBalance: 100000, maxBalance: Infinity, color: '#00ff88', icon: '💎'`,
   `{ name: 'Core', minBalance: 100000, maxBalance: Infinity, color: '#00ff88', icon: 'gem'`],
  // Action rows
  [`icon="🔐"`, `icon="lock"`],
  [`icon="🔔"`, `icon="bell"`],
  [`<Text style={styles.actionRowIconText}>📋</Text>`,
   `<ClipboardList size={16} color="#ff6b35" strokeWidth={2} />`],
  [`<Text style={styles.actionRowIconText}>🛡️</Text>`,
   `<Shield size={16} color="#ff6b35" strokeWidth={2} />`],
  [`<Text style={styles.actionRowIconText}>❓</Text>`,
   `<HelpCircle size={16} color="#ff6b35" strokeWidth={2} />`],
  [`<Text style={styles.dangerButtonIcon}>👛</Text>`,
   `<Wallet size={16} color="#ff3232" strokeWidth={2} />`],
]);

console.log('\n🌋 All emoji replacements complete!');
