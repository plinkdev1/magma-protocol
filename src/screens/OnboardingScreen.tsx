// src/screens/OnboardingScreen.tsx
// 6-slide onboarding — faithful RN translation of magma_app_onboarding.html
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TouchableWithoutFeedback,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  SlideInLeft,
  SlideOutRight,
  Easing,
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg: '#080400',
  card: '#0e0800',
  orange: '#ff6b35',
  amber: '#ffb347',
  ember: '#ff2200',
  text: '#ffe8d0',
  muted: 'rgba(255,232,208,0.45)',
  border: 'rgba(255,107,53,0.15)',
  green: '#00ff88',
  cyan: '#00e5ff',
};

// ─── SLIDE VISUALS ─────────────────────────────────────────────────────────────

// Slide 0 — Welcome: volcano logo
const VisualWelcome = () => {
  const glow = useSharedValue(0.4);
  const bob = useSharedValue(0);
  useEffect(() => {
    glow.value = withRepeat(withSequence(withTiming(0.8, { duration: 1200 }), withTiming(0.3, { duration: 1200 })), -1, true);
    bob.value = withRepeat(withSequence(withTiming(-6, { duration: 1200 }), withTiming(0, { duration: 1200 })), -1, true);
  }, []);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  const bobStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));
  return (
    <View style={vis.welcomeWrap}>
      <Animated.View style={[vis.glowBehind, glowStyle]} />
      <Animated.View style={[vis.logoBox, bobStyle]}>
        <View style={vis.logoShine} />
        <Text style={vis.logoEmoji}>🌋</Text>
      </Animated.View>
    </View>
  );
};

// Slide 1 — Ideas: ring diagram
const VisualRings = () => {
  const r1 = useSharedValue(0);
  const r2 = useSharedValue(0);
  const r3 = useSharedValue(0);
  useEffect(() => {
    r1.value = withRepeat(withTiming(360, { duration: 8000, easing: Easing.linear }), -1);
    r2.value = withRepeat(withTiming(-360, { duration: 12000, easing: Easing.linear }), -1);
    r3.value = withRepeat(withTiming(360, { duration: 16000, easing: Easing.linear }), -1);
  }, []);
  const s1 = useAnimatedStyle(() => ({ transform: [{ rotate: `${r1.value}deg` }] }));
  const s2 = useAnimatedStyle(() => ({ transform: [{ rotate: `${r2.value}deg` }] }));
  const s3 = useAnimatedStyle(() => ({ transform: [{ rotate: `${r3.value}deg` }] }));
  return (
    <View style={vis.ringWrap}>
      <Animated.View style={[vis.ring, vis.ring3, s3]}>
        <View style={vis.ringDot} />
      </Animated.View>
      <Animated.View style={[vis.ring, vis.ring2, s2]}>
        <View style={[vis.ringDot, { backgroundColor: C.amber }]} />
      </Animated.View>
      <Animated.View style={[vis.ring, vis.ring1, s1]}>
        <View style={[vis.ringDot, { backgroundColor: C.green }]} />
      </Animated.View>
      <View style={vis.ringCore}>
        <Text style={vis.ringCoreEmoji}>💡</Text>
      </View>
    </View>
  );
};

// Slide 2 — AI Score: animated bars
const BARS = [
  { label: 'Factual', pct: 82, color: C.orange },
  { label: 'Engagement', pct: 74, color: C.amber },
  { label: 'Originality', pct: 91, color: C.green },
  { label: 'Community', pct: 67, color: C.cyan },
];
const VisualBars = ({ active }: { active: boolean }) => {
  const vals = BARS.map(() => useSharedValue(0));
  useEffect(() => {
    if (!active) return;
    vals.forEach((v, i) => {
      v.value = withTiming(BARS[i].pct / 100, { duration: 800, easing: Easing.out(Easing.quad) });
    });
  }, [active]);
  return (
    <View style={vis.barsWrap}>
      {BARS.map((b, i) => {
        const barStyle = useAnimatedStyle(() => ({ width: `${vals[i].value * 100}%` }));
        return (
          <View key={b.label} style={vis.barRow}>
            <Text style={vis.barLabel}>{b.label}</Text>
            <View style={vis.barTrack}>
              <Animated.View style={[vis.barFill, { backgroundColor: b.color }, barStyle]} />
            </View>
            <Text style={[vis.barPct, { color: b.color }]}>{b.pct}%</Text>
          </View>
        );
      })}
    </View>
  );
};

// Slide 3 — Yield: protocol pills
const PROTOCOLS = [
  { name: 'Meteora LP', apy: '~18% APY', color: C.green },
  { name: 'Kamino', apy: '~9% APY', color: C.cyan },
  { name: 'Save.Finance', apy: '~7% APY', color: C.amber },
];
const VisualVault = ({ active }: { active: boolean }) => (
  <View style={vis.vaultWrap}>
    {PROTOCOLS.map((p, i) => (
      <Animated.View
        key={p.name}
        entering={active ? FadeIn.delay(i * 150).duration(400) : undefined}
        style={[vis.pill, { borderColor: p.color + '40' }]}
      >
        <Text style={[vis.pillName, { color: p.color }]}>{p.name}</Text>
        <Text style={vis.pillApy}>{p.apy}</Text>
      </Animated.View>
    ))}
  </View>
);

// Slide 4 — Wallet: selection buttons
const WALLETS = [
  { emoji: '👻', name: 'Phantom', sub: 'Recommended · MWA' },
  { emoji: '🎒', name: 'Backpack', sub: 'Solana Native' },
  { emoji: '🦅', name: 'Solflare', sub: 'Ledger Compatible' },
];
const VisualWallet = () => {
  const [selected, setSelected] = useState(0);
  return (
    <View style={vis.walletWrap}>
      {WALLETS.map((w, i) => (
        <TouchableOpacity
          key={w.name}
          style={[vis.walletBtn, selected === i && vis.walletBtnActive]}
          onPress={() => setSelected(i)}
          activeOpacity={0.7}
        >
          <Text style={vis.walletEmoji}>{w.emoji}</Text>
          <View style={vis.walletInfo}>
            <Text style={vis.walletName}>{w.name}</Text>
            <Text style={vis.walletSub}>{w.sub}</Text>
          </View>
          {selected === i && <Text style={vis.walletCheck}>✓</Text>}
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Slide 5 — Ready: pulsing final ring
const VisualReady = () => {
  const pulse = useSharedValue(1);
  const outerOpacity = useSharedValue(0.3);
  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1.08, { duration: 1400 }), withTiming(1, { duration: 1400 })), -1, true);
    outerOpacity.value = withRepeat(withSequence(withTiming(0.7, { duration: 1400 }), withTiming(0.2, { duration: 1400 })), -1, true);
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const outerStyle = useAnimatedStyle(() => ({ opacity: outerOpacity.value }));
  return (
    <View style={vis.readyWrap}>
      <Animated.View style={[vis.readyOuter, outerStyle]} />
      <Animated.View style={[vis.readyInner, pulseStyle]}>
        <Text style={vis.readyEmoji}>🌋</Text>
      </Animated.View>
    </View>
  );
};

// ─── SLIDE DATA ────────────────────────────────────────────────────────────────
const SLIDES = [
  {
    eyebrow: 'Welcome',
    title: 'WELCOME TO\nMAGMA',
    body: 'The Solana-native narrative capital market. Back ideas with $MAGMA. Earn real yield. Shape the future of on-chain intelligence.',
    visual: (active: boolean) => <VisualWelcome />,
    cta: 'Get Started →',
  },
  {
    eyebrow: 'How It Works',
    title: 'IDEAS HAVE\nPRICE',
    body: 'Submit a narrative, stake $MAGMA to back it, and earn a share of protocol fees when the community validates your belief as true.',
    visual: (active: boolean) => <VisualRings />,
    cta: 'Next →',
  },
  {
    eyebrow: 'AI Scoring',
    title: 'SCORED BY\nAI + CROWD',
    body: 'Every narrative is scored across four dimensions. Higher scores mean higher payouts — for you and every backer who believed early.',
    visual: (active: boolean) => <VisualBars active={active} />,
    cta: 'Next →',
  },
  {
    eyebrow: 'Yield Engine',
    title: 'EARN WHILE\nYOU BACK',
    body: 'Your $MAGMA stake earns yield across integrated Solana DeFi protocols. Your holder tier multiplies your base APY up to 3.5×.',
    visual: (active: boolean) => <VisualVault active={active} />,
    cta: 'Next →',
  },
  {
    eyebrow: 'Connect Wallet',
    title: 'LINK YOUR\nWALLET',
    body: 'Your Solana wallet is your identity on MAGMA. No email, no passwords — just your keys.',
    visual: (active: boolean) => <VisualWallet />,
    cta: 'Connect Wallet →',
  },
  {
    eyebrow: "You're Ready",
    title: 'LET THE\nLAVA\nFLOW',
    body: 'MAGMA is ready. Your first narrative feed is loading. Back an idea, submit your own, or explore the DeFi vault dashboard.',
    visual: (active: boolean) => <VisualReady />,
    cta: 'Enter MAGMA 🌋',
  },
];

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
interface OnboardingScreenProps {
  onComplete: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');

  const goTo = useCallback((idx: number) => {
    setDirection(idx > current ? 'forward' : 'back');
    setCurrent(Math.max(0, Math.min(SLIDES.length - 1, idx)));
  }, [current]);

  const handleMain = useCallback(() => {
    if (current < SLIDES.length - 1) {
      goTo(current + 1);
    } else {
      onComplete();
    }
  }, [current, goTo, onComplete]);

  const slide = SLIDES[current];
  const entering = direction === 'forward' ? SlideInRight.duration(320) : SlideInLeft.duration(320);
  const exiting = direction === 'forward' ? SlideOutLeft.duration(320) : SlideOutRight.duration(320);

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Lava bg glow */}
      <View style={s.lavaBg} />

      {/* Skip */}
      {current < SLIDES.length - 1 && (
        <TouchableOpacity style={s.skipBtn} onPress={() => goTo(SLIDES.length - 1)}>
          <Text style={s.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Dot nav */}
      <View style={s.dotRow}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goTo(i)}>
            <View style={[s.dot, current === i && s.dotActive, i < current && s.dotDone]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Slide content */}
      <Animated.View
        key={current}
        entering={entering}
        exiting={exiting}
        style={s.slide}
      >
        {/* Visual area */}
        <View style={s.visualArea}>
          {slide.visual(true)}
        </View>

        {/* Text area */}
        <View style={s.textArea}>
          <Text style={s.eyebrow}>{slide.eyebrow}</Text>
          <Text style={s.title}>{slide.title}</Text>
          <Text style={s.body}>{slide.body}</Text>
        </View>
      </Animated.View>

      {/* Bottom area */}
      <View style={s.bottomArea}>
        <TouchableOpacity style={s.mainBtn} onPress={handleMain} activeOpacity={0.85}>
          <Text style={s.mainBtnText}>{slide.cta}</Text>
        </TouchableOpacity>
        {current < SLIDES.length - 1 && (
          <Text style={s.swipeHint}>Swipe to continue</Text>
        )}
      </View>
    </View>
  );
};

// ─── VISUAL STYLES ─────────────────────────────────────────────────────────────
const vis = StyleSheet.create({
  // Welcome
  welcomeWrap: { alignItems: 'center', justifyContent: 'center', height: 160 },
  glowBehind: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,50,0,0.12)' },
  logoBox: { width: 100, height: 100, borderRadius: 24, backgroundColor: '#1a0800', borderWidth: 1, borderColor: 'rgba(255,107,53,0.25)', alignItems: 'center', justifyContent: 'center', shadowColor: '#ff6b35', shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 },
  logoShine: { position: 'absolute', top: 8, left: 12, width: 20, height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4 },
  logoEmoji: { fontSize: 48 },

  // Rings
  ringWrap: { width: 180, height: 180, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderRadius: 200, borderWidth: 1, alignItems: 'flex-start', justifyContent: 'center' },
  ring1: { width: 80, height: 80, borderColor: 'rgba(255,107,53,0.4)' },
  ring2: { width: 120, height: 120, borderColor: 'rgba(255,179,71,0.25)' },
  ring3: { width: 160, height: 160, borderColor: 'rgba(255,107,53,0.12)' },
  ringDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.orange, marginLeft: -3, shadowColor: C.orange, shadowOpacity: 0.8, shadowRadius: 4, elevation: 4 },
  ringCore: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1a0800', borderWidth: 1, borderColor: 'rgba(255,107,53,0.3)', alignItems: 'center', justifyContent: 'center' },
  ringCoreEmoji: { fontSize: 22 },

  // Bars
  barsWrap: { width: W - 80, gap: 12 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { width: 80, fontSize: 9, color: C.muted, fontFamily: 'SpaceMono', letterSpacing: 0.5 },
  barTrack: { flex: 1, height: 4, backgroundColor: 'rgba(255,107,53,0.1)', borderRadius: 2, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 2 },
  barPct: { width: 36, fontSize: 9, fontFamily: 'SpaceMono', textAlign: 'right' },

  // Vault
  vaultWrap: { gap: 10, width: W - 80 },
  pill: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, backgroundColor: 'rgba(255,107,53,0.04)' },
  pillName: { fontFamily: 'SpaceMono', fontSize: 12, fontWeight: '700' },
  pillApy: { fontFamily: 'SpaceMono', fontSize: 10, color: C.muted },

  // Wallet
  walletWrap: { gap: 8, width: W - 80 },
  walletBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,107,53,0.15)', backgroundColor: 'rgba(255,107,53,0.04)' },
  walletBtnActive: { borderColor: 'rgba(255,107,53,0.5)', backgroundColor: 'rgba(255,107,53,0.08)' },
  walletEmoji: { fontSize: 24 },
  walletInfo: { flex: 1 },
  walletName: { fontFamily: 'SpaceMono', fontSize: 12, color: C.text, fontWeight: '700' },
  walletSub: { fontFamily: 'SpaceMono', fontSize: 9, color: C.muted, marginTop: 2 },
  walletCheck: { fontSize: 14, color: C.green, fontWeight: '700' },

  // Ready
  readyWrap: { alignItems: 'center', justifyContent: 'center', width: 160, height: 160 },
  readyOuter: { position: 'absolute', width: 160, height: 160, borderRadius: 80, borderWidth: 1, borderColor: 'rgba(255,107,53,0.3)' },
  readyInner: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#1a0800', borderWidth: 1.5, borderColor: 'rgba(255,107,53,0.4)', alignItems: 'center', justifyContent: 'center', shadowColor: '#ff6b35', shadowOpacity: 0.5, shadowRadius: 24, elevation: 12 },
  readyEmoji: { fontSize: 44 },
});

// ─── SCREEN STYLES ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, alignItems: 'center' },
  lavaBg: { position: 'absolute', bottom: 0, left: 0, right: 0, height: H * 0.3, backgroundColor: 'transparent', shadowColor: '#ff3300', shadowOffset: { width: 0, height: -20 }, shadowOpacity: 0.15, shadowRadius: 60, elevation: 0 },
  skipBtn: { position: 'absolute', top: 52, right: 24, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(255,107,53,0.2)', zIndex: 20 },
  skipText: { fontFamily: 'SpaceMono', fontSize: 10, color: 'rgba(255,107,53,0.5)', letterSpacing: 1 },
  dotRow: { position: 'absolute', top: 56, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 8, zIndex: 10 },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,107,53,0.15)' },
  dotActive: { backgroundColor: C.orange, shadowColor: C.orange, shadowOpacity: 0.6, shadowRadius: 6, elevation: 4 },
  dotDone: { backgroundColor: 'rgba(255,107,53,0.4)' },
  slide: { flex: 1, alignItems: 'center', paddingTop: 80, paddingHorizontal: 32, width: W },
  visualArea: { height: 200, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  textArea: { alignItems: 'center', gap: 12, flex: 1 },
  eyebrow: { fontFamily: 'SpaceMono', fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', color: C.orange },
  title: { fontFamily: 'SpaceMono', fontSize: 28, fontWeight: '700', color: C.text, textAlign: 'center', lineHeight: 34 },
  body: { fontFamily: 'SpaceMono', fontSize: 12, color: C.muted, textAlign: 'center', lineHeight: 22, maxWidth: 300 },
  bottomArea: { paddingBottom: 48, paddingHorizontal: 32, width: W, alignItems: 'center', gap: 12 },
  mainBtn: { width: '100%', paddingVertical: 16, backgroundColor: C.orange, alignItems: 'center', shadowColor: C.orange, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  mainBtnText: { fontFamily: 'SpaceMono', fontSize: 13, fontWeight: '700', color: '#fff', letterSpacing: 1 },
  swipeHint: { fontFamily: 'SpaceMono', fontSize: 9, color: 'rgba(255,107,53,0.3)', letterSpacing: 2 },
});

export default OnboardingScreen;
