// src/screens/LoadingScreen.tsx
// Faithful RN translation of magma_app_loading.html
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');

// ─── EMBER PARTICLE ────────────────────────────────────────────────────────────
const EMBER_COLORS = ['#ff3200', '#ff6b35', '#ffb347'];

const Ember: React.FC<{ index: number }> = ({ index }) => {
  const y     = useSharedValue(H);
  const x     = useSharedValue(W / 2);
  const opac  = useSharedValue(0);
  const size  = 0.5 + Math.random() * 1.5;
  const dur   = 2500 + Math.random() * 2000;
  const color = EMBER_COLORS[Math.floor(Math.random() * 3)];
  const dX    = (Math.random() - 0.5) * 60;
  const delay = index * 140;

  useEffect(() => {
    const go = () => {
      const sx = W / 2 + (Math.random() - 0.5) * 20;
      x.value = sx; y.value = H; opac.value = 0;
      opac.value = withDelay(delay, withSequence(
        withTiming(0.7, { duration: 200 }),
        withTiming(0, { duration: dur - 200 })
      ));
      y.value = withDelay(delay, withTiming(
        H * 0.3 - Math.random() * 80,
        { duration: dur, easing: Easing.out(Easing.quad) },
        () => runOnJS(go)()
      ));
      x.value = withDelay(delay, withTiming(sx + dX, { duration: dur, easing: Easing.inOut(Easing.sin) }));
    };
    go();
  }, []);

  const st = useAnimatedStyle(() => ({
    position: 'absolute',
    width: size * 2, height: size * 2, borderRadius: size,
    backgroundColor: color,
    left: x.value - size, top: y.value - size,
    opacity: opac.value,
  }));
  return <Animated.View style={st} />;
};

// ─── STEPS ─────────────────────────────────────────────────────────────────────
const STEPS = [
  { at: 0.00, dotIdx: 0, label: 'Loading',           status: 'Initializing...' },
  { at: 0.15, dotIdx: 1, label: 'Connecting wallet', status: 'Connecting wallet...' },
  { at: 0.35, dotIdx: 2, label: 'Loading feed',      status: 'Loading feed...' },
  { at: 0.60, dotIdx: 3, label: 'Fetching prices',   status: 'Fetching prices...' },
  { at: 0.85, dotIdx: 4, label: 'Almost ready',      status: 'Almost ready...' },
];
const TOTAL_MS = 3500;

// ─── MAIN ──────────────────────────────────────────────────────────────────────
interface Props { onLoadComplete: () => void }

const LoadingScreen: React.FC<Props> = ({ onLoadComplete }) => {
  const [pct,       setPct]       = useState(0);
  const [stepIdx,   setStepIdx]   = useState(0);
  const [dotsDone,  setDotsDone]  = useState<number[]>([]);
  const [activeDot, setActiveDot] = useState(0);

  const progress  = useSharedValue(0);
  const iconBob   = useSharedValue(0);
  const sdotOpac  = useSharedValue(1);

  useEffect(() => {
    iconBob.value = withRepeat(withSequence(
      withTiming(-4, { duration: 1250 }), withTiming(0, { duration: 1250 })
    ), -1, true);
    sdotOpac.value = withRepeat(withSequence(
      withTiming(0.3, { duration: 600 }), withTiming(1, { duration: 600 })
    ), -1, true);
    progress.value = withTiming(1, { duration: TOTAL_MS, easing: Easing.bezier(0.4, 0, 0.2, 1) });

    const start = Date.now();
    const triggered = new Set<number>();
    const tick = () => {
      const t = (Date.now() - start) / TOTAL_MS;
      const p = Math.min(Math.floor(t * 100), 100);
      setPct(p);
      STEPS.forEach((step, i) => {
        if (t >= step.at && !triggered.has(i)) {
          triggered.add(i);
          setStepIdx(i);
          setActiveDot(step.dotIdx);
          setDotsDone(Array.from({ length: step.dotIdx }, (_, j) => j));
        }
      });
      if (p < 100) requestAnimationFrame(tick);
      else setTimeout(onLoadComplete, 300);
    };
    requestAnimationFrame(tick);
  }, []);

  const bobStyle  = useAnimatedStyle(() => ({ transform: [{ translateY: iconBob.value }] }));
  const barStyle  = useAnimatedStyle(() => ({ width: `${interpolate(progress.value, [0, 1], [0, 100])}%` as any }));
  const sdotStyle = useAnimatedStyle(() => ({ opacity: sdotOpac.value }));
  const step      = STEPS[stepIdx];

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#080400" />

      {/* Lava waves */}
      <View style={s.flowWrap} pointerEvents="none">
        <View style={[s.wave, s.wave1]} />
        <View style={[s.wave, s.wave2]} />
      </View>

      {/* Embers */}
      {Array.from({ length: 20 }).map((_, i) => <Ember key={i} index={i} />)}

      {/* Content */}
      <View style={s.content}>

        {/* Icon */}
        <Animated.View style={[s.iconWrap, bobStyle]}>
          <View style={s.iconShine} />
          <Text style={s.iconEmoji}>🌋</Text>
        </Animated.View>

        {/* Gradient wordmark */}
        <Text style={s.appNameMask}>MAGMA</Text>

        <Text style={s.tagline}>Narrative Capital Markets</Text>

        {/* Progress */}
        <View style={s.loaderWrap}>
          <View style={s.loaderLabel}>
            <Text style={s.loaderText}>{step.label}</Text>
            <Text style={s.loaderPct}>{pct}%</Text>
          </View>
          <View style={s.loaderTrack}>
            <Animated.View style={[s.loaderFill, barStyle]}>
              <View style={[StyleSheet.absoluteFill, { backgroundColor: '#ff6b35' }]} />
              <View style={s.tipDot} />
            </Animated.View>
          </View>
        </View>

        {/* Step dots */}
        <View style={s.dotsRow}>
          {STEPS.map((_, i) => (
            <View key={i} style={[s.dot, activeDot === i && s.dotActive, dotsDone.includes(i) && s.dotDone]} />
          ))}
        </View>

        {/* Status */}
        <View style={s.statusRow}>
          <Animated.View style={[s.statusDot, sdotStyle]} />
          <Text style={s.statusText}>{step.status}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={s.footer}>
        <Text style={s.footerText}>Solana · $MAGMA · v1.0</Text>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#080400', alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  flowWrap:     { position: 'absolute', bottom: 0, left: 0, right: 0, height: H * 0.42, overflow: 'hidden' },
  wave:         { position: 'absolute', bottom: 0, left: '-10%' as any, right: '-10%' as any, borderTopLeftRadius: 200, borderTopRightRadius: 200 },
  wave1:        { height: '60%', backgroundColor: 'rgba(255,34,0,0.12)' },
  wave2:        { height: '45%', backgroundColor: 'rgba(255,107,53,0.09)' },

  content:      { alignItems: 'center', zIndex: 10 },
  iconWrap:     { width: 100, height: 100, borderRadius: 24, backgroundColor: '#1a0800', borderWidth: 1, borderColor: 'rgba(255,107,53,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 32, shadowColor: '#ff3200', shadowOpacity: 0.15, shadowRadius: 30, elevation: 8 },
  iconShine:    { position: 'absolute', top: 8, left: 12, width: 20, height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4 },
  iconEmoji:    { fontSize: 48 },

  appNameMask:  { fontFamily: 'SpaceMono', fontSize: 42, fontWeight: '700', letterSpacing: 6, color: '#ff6b35' },
  tagline:      { fontFamily: 'SpaceMono', fontSize: 9, letterSpacing: 5, color: 'rgba(255,107,53,0.4)', marginTop: 4, marginBottom: 40, textTransform: 'uppercase' },

  loaderWrap:   { width: 260, marginBottom: 16 },
  loaderLabel:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  loaderText:   { fontFamily: 'SpaceMono', fontSize: 9, letterSpacing: 2, color: 'rgba(255,107,53,0.4)', textTransform: 'uppercase' },
  loaderPct:    { fontFamily: 'SpaceMono', fontSize: 10, color: 'rgba(255,179,71,0.6)', fontWeight: '700' },
  loaderTrack:  { width: '100%', height: 2, backgroundColor: 'rgba(255,107,53,0.08)', borderRadius: 1, overflow: 'visible' },
  loaderFill:   { height: 2, borderRadius: 1, overflow: 'visible', position: 'relative' },
  tipDot:       { position: 'absolute', right: -4, top: -3, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ffd700', shadowColor: '#ffd700', shadowOpacity: 1, shadowRadius: 6, elevation: 4 },

  dotsRow:      { flexDirection: 'row', gap: 8, marginBottom: 24 },
  dot:          { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,107,53,0.15)' },
  dotActive:    { backgroundColor: '#ff6b35', shadowColor: '#ff6b35', shadowOpacity: 0.6, shadowRadius: 8, elevation: 4 },
  dotDone:      { backgroundColor: 'rgba(255,107,53,0.4)' },

  statusRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot:    { width: 4, height: 4, borderRadius: 2, backgroundColor: '#ff6b35', shadowColor: '#ff6b35', shadowOpacity: 0.6, shadowRadius: 6, elevation: 3 },
  statusText:   { fontFamily: 'SpaceMono', fontSize: 9, letterSpacing: 2, color: 'rgba(255,255,255,0.3)' },

  footer:       { position: 'absolute', bottom: 24 },
  footerText:   { fontFamily: 'SpaceMono', fontSize: 9, letterSpacing: 4, color: 'rgba(255,255,255,0.1)', textTransform: 'uppercase' },
});

export default LoadingScreen;
