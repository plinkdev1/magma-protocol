// src/screens/OnboardingScreen.tsx
// 6-slide onboarding — faithful RN translation of magma_app_onboarding.html
import { useAuthorization } from '../context/WalletContext';
import { API_URL } from '../config';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TouchableWithoutFeedback,
  Image,
  ImageBackground,
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
  bg: '#09080C',
  card: '#111018',
  orange: '#ff6b35',
  amber: '#ffb347',

  ember: '#ff2200',
  text: '#ffe8d0',
  muted: 'rgba(255,232,208,0.45)',
  border: 'rgba(255,107,53,0.15)',
  green: '#00ff88',
  cyan: '#00e5ff',
};

const BG_IMAGES = [
  require('../../assets/images/onboarding-bg-1.png'),
  require('../../assets/images/onboarding-bg-2.png'),
  require('../../assets/images/onboarding-bg-3.png'),
];

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
        <Image source={require('../../assets/magma-icon-orange.png')} style={vis.logoImage} resizeMode="contain" />
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
  { logo: require('../../assets/logos/wallets/phantom.jpg'), name: 'Phantom', sub: 'Recommended · MWA' },
  { logo: require('../../assets/logos/wallets/backpack.jpg'), name: 'Backpack', sub: 'Solana Native' },
  { logo: require('../../assets/logos/wallets/solflare.jpg'), name: 'Solflare', sub: 'Ledger Compatible' },
];
const VisualWallet = () => {
  return <View />;
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


// Slide 5 � Path Choice
const PATHS = [
  { id: 'predictor', emoji: '🎯', label: 'Predictor', sub: 'I back narratives I believe in' },
  { id: 'observer',  emoji: '👁',  label: 'Observer',  sub: 'I watch and learn first' },
  { id: 'farmer',   emoji: '🌾', label: 'Yield Farmer', sub: 'I want to earn yield' },
];
const VisualPathChoice = ({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) => (
  <View style={vis.pathWrap}>
    {PATHS.map(p => (
      <TouchableOpacity
        key={p.id}
        style={[vis.pathPill, selected === p.id && vis.pathPillActive]}
        onPress={() => onSelect(p.id)}
        activeOpacity={0.8}
      >
        <Text style={vis.pathEmoji}>{p.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[vis.pathLabel, selected === p.id && { color: C.orange }]}>{p.label}</Text>
          <Text style={vis.pathSub}>{p.sub}</Text>
        </View>
        {selected === p.id && <Text style={{ color: C.orange, fontSize: 16 }}>✓</Text>}
      </TouchableOpacity>
    ))}
  </View>
);

// Slide 6 � Notifications
const VisualNotifications = () => (
  <View style={vis.notifWrap}>
    {['Narrative resolved ✓', 'Echo Pool distributed 💰', 'New narrative in your category 🔥'].map((n, i) => (
      <Animated.View key={i} entering={FadeIn.delay(i * 200).duration(400)} style={vis.notifRow}>
        <View style={[vis.notifDot, { backgroundColor: i === 0 ? C.green : i === 1 ? C.amber : C.orange }]} />
        <Text style={vis.notifText}>{n}</Text>
      </Animated.View>
    ))}
  </View>
);

// Slide 7 � Seeker Phone
const VisualSeeker = () => (
  <View style={vis.seekerWrap}>
    <View style={vis.seekerPhone}>
      <Text style={{ fontSize: 48 }}>📱</Text>
      <Text style={[vis.seekerLabel, { color: C.cyan }]}>Seeker Phone</Text>
    </View>
    <Text style={vis.seekerSub}>SKR holders get 0% deposit fee{'\n'}and priority access to narratives</Text>
  </View>
);

// Slide 8 � Anti-Sybil
const VisualAntiSybil = () => (
  <View style={vis.sybilWrap}>
    <View style={vis.sybilIcon}>
      <Text style={{ fontSize: 48 }}>🔐</Text>
    </View>
    <Text style={vis.sybilText}>One-time verification{'\n'}protects every backer</Text>
  </View>
);

// Slide 9 � Terms
const TERMS_TEXT = `MAGMA PROTOCOL � TERMS OF USE\n\nBy using MAGMA Protocol you agree to the following:\n\n1. MAGMA is a yield-bearing narrative capital market on Solana. Participation involves financial risk.\n\n2. Backing narratives is not investment advice. You may lose backed capital if a narrative resolves FALSE.\n\n3. Yield is generated through DeFi protocol integrations. APY rates are variable and not guaranteed.\n\n4. MAGMA does not custody your funds. All transactions are on-chain and irreversible.\n\n5. You are responsible for the security of your wallet and private keys.\n\n6. Anti-Sybil verification is required to participate. One wallet per person.\n\n7. MAGMA reserves the right to update these terms. Continued use constitutes acceptance.\n\n8. This protocol is in beta. Use at your own risk.\n\nBy tapping "Accept & Continue" you confirm you have read and agree to these terms.`;

const VisualTerms = ({ onScrollEnd }: { onScrollEnd: () => void }) => (<>
  <ScrollView
    style={vis.termsScroll}
    onMomentumScrollEnd={(e) => {
      const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
      if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 20) {
        onScrollEnd();
      }
    }}
    scrollEventThrottle={16}
    showsVerticalScrollIndicator={true}
  >
    <Text style={vis.termsText}>{TERMS_TEXT}</Text>
  </ScrollView>
  <Text style={vis.termsHint}>Scroll to the bottom to accept</Text>
  </>
);

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
        eyebrow: 'Your Path',
        title: 'HOW WILL\nYOU PLAY?',
        body: 'Choose your role in the MAGMA ecosystem. You can always change this later.',
        visual: (active: boolean, selPath: string, setSelPath: (s: string) => void) => <VisualPathChoice selected={selPath} onSelect={setSelPath} />,
        cta: 'Next ->',
      },
      {
        eyebrow: 'Stay Informed',
        title: 'NEVER MISS\nA SIGNAL',
        body: 'Get notified when your narratives resolve, yield is distributed, and new opportunities emerge.',
        visual: (active: boolean) => <VisualNotifications />,
        cta: 'Enable Notifications ->',
      },
      {
        eyebrow: 'Seeker Phone',
        title: 'SKR HOLDER\nBENEFITS',
        body: 'Seeker phone owners and SKR holders get 0% deposit fee and priority access to new narratives.',
        visual: (active: boolean) => <VisualSeeker />,
        cta: 'Next ->',
      },
      {
        eyebrow: 'Verification',
        title: 'PROVE YOUR\nHUMANITY',
        body: 'Verify your humanity with Gitcoin Passport. Solana wallets with EVM history get a score boost. No Passport? Get one free at passport.xyz.',
        visual: (active: boolean) => <VisualAntiSybil />,
        cta: 'Check My Passport ->',
      },
      {
        eyebrow: 'Terms of Use',
        title: 'READ &\nACCEPT',
        body: 'Scroll to the bottom to accept the terms and enter MAGMA.',
        visual: (active: boolean, selPath: string, setSelPath: (s: string) => void, setTermsDone: (v: boolean) => void) => <VisualTerms onScrollEnd={() => setTermsDone(true)} />,
        cta: 'Accept & Continue ->',
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
  const { connect, isConnected, account } = useAuthorization();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [selectedPath, setSelectedPath] = useState('predictor');
  const [termsScrolled, setTermsScrolled] = useState(false);
  const [passportMsg, setPassportMsg] = useState<string | null>(null);
  const [passportLoading, setPassportLoading] = useState(false);
  const [notifRequested, setNotifRequested] = useState(false);

  const goTo = useCallback((idx: number) => {
    setDirection(idx > current ? 'forward' : 'back');
    setCurrent(Math.max(0, Math.min(SLIDES.length - 1, idx)));
  }, [current]);

  const handleMain = useCallback(async () => {
    const eyebrow = SLIDES[current]?.eyebrow;

    // Wallet slide � open picker if not connected
    if (eyebrow === 'Connect Wallet' && !isConnected) {
      connect();
    }

    // Notifications slide — request permission + save push token
    if (eyebrow === 'Stay Informed' && !notifRequested) {
      setNotifRequested(true);
      try {
        const Notifications = await import('expo-notifications');
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted' && account?.address) {
          try {
            const tokenData = await Notifications.getExpoPushTokenAsync();
            const pushToken = tokenData.data;
            await fetch(`${API_URL}/v1/users/push-token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ wallet_address: account.address, push_token: pushToken }),
            });
          } catch (tokenErr) {
            console.warn('[push] failed to save token:', tokenErr);
          }
        }
      } catch {}
      goTo(current + 1);
      return;
    }

    // Verification slide — Gitcoin Passport check (soft gate, never blocks)
    // Verification slide — Gitcoin Passport check (soft gate, never blocks)
    if (eyebrow === 'Verification') {
      setPassportLoading(true);
      setPassportMsg(null);
      if (account?.address) {
        try {
          const res = await fetch(`${API_URL}/v1/verify/passport/${account.address}`);
          const data = await res.json();
          const score = data.score ?? 0;
          const msg = score > 0
            ? `✓ Passport verified — score: ${score.toFixed(1)}`
            : '⚠️ No EVM Passport found. Get one free at passport.xyz';
          setPassportMsg(msg);
        } catch {
          setPassportMsg('Could not check Passport — continuing anyway.');
        }
      } else {
        setPassportMsg('Connect your wallet first to check Passport.');
      }
      setPassportLoading(false);
      // Show result for 2s then advance
      setTimeout(() => goTo(current + 1), 2000);
      return;
    }

    // Terms slide � must scroll to bottom first
    if (eyebrow === 'Terms of Use') {
      if (!termsScrolled) return;
      const walletAddr = account?.address || null;
      try {
        await fetch(`${API_URL}/v1/terms/accept`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet_address: walletAddr,
            terms_version: '0.1',
            source: 'app',
            platform: 'mobile_app',
            app_version: '1.0.0',
          }),
        });
      } catch {}
      try { await AsyncStorage.setItem('magma_terms_v0.1', '1'); } catch {}
      goTo(current + 1);
      return;
    }

    // Last slide � complete onboarding
    if (current >= SLIDES.length - 1) {
      onComplete();
      return;
    }

    goTo(current + 1);
  }, [current, goTo, onComplete, isConnected, account, termsScrolled, notifRequested]);

  const slide = SLIDES[current];
  const entering = direction === 'forward' ? SlideInRight.duration(200).springify() : SlideInLeft.duration(200).springify();
  const exiting = direction === 'forward' ? SlideOutLeft.duration(180) : SlideOutRight.duration(180);

  return (
    <ImageBackground
      source={BG_IMAGES[current % 3]}
      style={s.container}
      resizeMode="cover"
    >
      <View style={s.overlay} pointerEvents="none" />
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Lava bg glow */}

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
          {slide.visual(true, selectedPath, setSelectedPath, setTermsScrolled)}
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
        {slide.eyebrow === 'Verification' && passportLoading && (
          <Text style={{ color: '#FFB347', fontSize: 13, textAlign: 'center', marginTop: 12 }}>Checking Passport...</Text>
        )}
        {slide.eyebrow === 'Verification' && passportMsg && !passportLoading && (
          <Text style={{ color: passportMsg.startsWith('✓') ? '#22C55E' : '#FFB347', fontSize: 13, textAlign: 'center', marginTop: 12, paddingHorizontal: 24 }}>{passportMsg}</Text>
        )}
        {current < SLIDES.length - 1 && (
          <Text style={s.swipeHint}>Swipe to continue</Text>
        )}
      </View>
    </ImageBackground>
  );
};

// ─── VISUAL STYLES ─────────────────────────────────────────────────────────────
const vis = StyleSheet.create({
  // Welcome
  welcomeWrap: { alignItems: 'center', justifyContent: 'center', height: 160 },
  glowBehind: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,50,0,0.12)' },
  logoBox: { width: 100, height: 100, borderRadius: 24, backgroundColor: '#1a0800', borderWidth: 1, borderColor: 'rgba(255,107,53,0.25)', alignItems: 'center', justifyContent: 'center', shadowColor: '#ff6b35', shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 },
  logoShine: { position: 'absolute', top: 8, left: 12, width: 20, height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4 },
      logoImage: { width: 80, height: 80, borderRadius: 18 },

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
  pill: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, backgroundColor: 'rgba(255,107,53,0.04)', borderRadius: 12 },
  pillName: { fontFamily: 'SpaceMono', fontSize: 12, fontWeight: '700' },
  pillApy: { fontFamily: 'SpaceMono', fontSize: 10, color: C.muted },

  // Wallet
  walletWrap: { gap: 8, width: W - 80 },
  walletBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,107,53,0.15)', backgroundColor: 'rgba(255,107,53,0.04)', borderRadius: 12 },
  walletBtnActive: { borderColor: 'rgba(255,107,53,0.5)', backgroundColor: 'rgba(255,107,53,0.08)' },
  walletLogo: { width: 32, height: 32, borderRadius: 6 },
  walletInfo: { flex: 1 },
  walletName: { fontFamily: 'SpaceMono', fontSize: 12, color: C.text, fontWeight: '700' },
  walletSub: { fontFamily: 'SpaceMono', fontSize: 9, color: C.muted, marginTop: 2 },
  walletCheck: { fontSize: 14, color: C.green, fontWeight: '700' },

  // Ready
  readyWrap: { alignItems: 'center', justifyContent: 'center', width: 160, height: 160 },
  readyOuter: { position: 'absolute', width: 160, height: 160, borderRadius: 80, borderWidth: 1, borderColor: 'rgba(255,107,53,0.3)' },
  readyInner: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#1a0800', borderWidth: 1.5, borderColor: 'rgba(255,107,53,0.4)', alignItems: 'center', justifyContent: 'center', shadowColor: '#ff6b35', shadowOpacity: 0.5, shadowRadius: 24, elevation: 12 },
  readyEmoji: { fontSize: 44 },
  pathWrap:      { width: '100%', gap: 10, paddingHorizontal: 4 },
  pathPill:      { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,107,53,0.2)', backgroundColor: 'rgba(255,107,53,0.05)' },
  pathPillActive:{ borderColor: '#FF6B35', backgroundColor: 'rgba(255,107,53,0.12)' },
  pathEmoji:     { fontSize: 24 },
  pathLabel:     { fontSize: 14, fontWeight: '700', color: '#E8E4F0', fontFamily: 'SpaceMono' },
  pathSub:       { fontSize: 11, color: 'rgba(255,232,208,0.45)', fontFamily: 'SpaceMono', marginTop: 2 },
  notifWrap:     { width: '100%', gap: 12, paddingHorizontal: 4 },
  notifRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 10, backgroundColor: 'rgba(255,107,53,0.06)', borderWidth: 1, borderColor: 'rgba(255,107,53,0.15)' },
  notifDot:      { width: 8, height: 8, borderRadius: 4 },
  notifText:     { fontSize: 13, color: '#E8E4F0', fontFamily: 'SpaceMono' },
  seekerWrap:    { alignItems: 'center', gap: 16 },
  seekerPhone:   { alignItems: 'center', gap: 8, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,229,255,0.3)', backgroundColor: 'rgba(0,229,255,0.05)' },
  seekerLabel:   { fontSize: 13, fontWeight: '700', fontFamily: 'SpaceMono', letterSpacing: 2 },
  seekerSub:     { fontSize: 12, color: 'rgba(255,232,208,0.45)', textAlign: 'center', fontFamily: 'SpaceMono', lineHeight: 20 },
  sybilWrap:     { alignItems: 'center', gap: 16 },
  sybilIcon:     { padding: 20, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(255,107,53,0.3)', backgroundColor: 'rgba(255,107,53,0.08)' },
  sybilText:     { fontSize: 13, color: 'rgba(255,232,208,0.7)', textAlign: 'center', fontFamily: 'SpaceMono', lineHeight: 22 },
  termsScroll:   { width: '100%', maxHeight: 200, backgroundColor: 'rgba(255,107,53,0.04)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,107,53,0.15)' },
  termsText:     { fontSize: 10, color: 'rgba(255,232,208,0.6)', fontFamily: 'SpaceMono', lineHeight: 18, padding: 14 },
  termsHint: { fontSize: 11, color: 'rgba(255,107,53,0.7)', textAlign: 'center', marginTop: 6, fontFamily: 'SpaceMono', letterSpacing: 0.5 },
});

// ─── SCREEN STYLES ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:  { flex: 1 },
  overlay:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.48)' },
  lavaBg: { position: 'absolute', bottom: 0, left: 0, right: 0, height: H * 0.35, backgroundColor: 'rgba(255,40,0,0.06)', borderTopLeftRadius: 200, borderTopRightRadius: 200 },
  skipBtn: { position: 'absolute', top: 80, right: 24, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(255,107,53,0.2)', zIndex: 20, borderRadius: 12 },
  skipText: { fontFamily: 'SpaceMono', fontSize: 10, color: 'rgba(255,107,53,0.5)', letterSpacing: 1 },
  dotRow: { position: 'absolute', top: 56, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 8, zIndex: 10 },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,107,53,0.15)' },
  dotActive: { backgroundColor: C.orange, shadowColor: C.orange, shadowOpacity: 0.6, shadowRadius: 6, elevation: 4 },
  dotDone: { backgroundColor: 'rgba(255,107,53,0.4)' },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 80, paddingHorizontal: 32, width: W },
  visualArea: { minHeight: 180, alignItems: 'center', justifyContent: 'center', marginBottom: 20, width: '100%' },
  textArea: { alignItems: 'center', gap: 10 },
  eyebrow: { fontFamily: 'SpaceMono', fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', color: C.orange },
  title: { fontFamily: 'SpaceMono', fontSize: 28, fontWeight: '700', color: C.text, textAlign: 'center', lineHeight: 34 },
  body: { fontFamily: 'SpaceMono', fontSize: 12, color: C.muted, textAlign: 'center', lineHeight: 22, maxWidth: 300 },
  bottomArea: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 48, paddingTop: 16, paddingHorizontal: 32, alignItems: 'center', gap: 12, backgroundColor: C.bg },
  mainBtn: { width: '100%', paddingVertical: 16, backgroundColor: C.orange, alignItems: 'center', shadowColor: C.orange, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8, borderRadius: 12 },
  mainBtnText: { fontFamily: 'SpaceMono', fontSize: 13, fontWeight: '700', color: '#fff', letterSpacing: 1 },
  swipeHint: { fontFamily: 'SpaceMono', fontSize: 9, color: 'rgba(255,107,53,0.3)', letterSpacing: 2 },
  mainBtnDisabled: { backgroundColor: 'rgba(255,107,53,0.3)', shadowOpacity: 0 },
  termsHint: { fontFamily: 'SpaceMono', fontSize: 10, color: 'rgba(255,107,53,0.6)', letterSpacing: 1, textAlign: 'center', marginTop: 8 },
});

export default OnboardingScreen;



