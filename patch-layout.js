const fs = require('fs');
const path = require('path');

// ─── FIX 1: OnboardingScreen layout ───────────────────────────────────────────
const onboardPath = path.join(__dirname, 'src/screens/OnboardingScreen.tsx');
let o = fs.readFileSync(onboardPath, 'utf8');

// Fix slide: reduce paddingTop, use justifyContent space-between
o = o.replace(
  `slide: { flex: 1, alignItems: 'center', paddingTop: 80, paddingHorizontal: 32, width: W },`,
  `slide: { flex: 1, alignItems: 'center', paddingTop: 72, paddingHorizontal: 32, width: W, justifyContent: 'flex-start' },`
);

// Fix visualArea: reduce height and margin
o = o.replace(
  `visualArea: { height: 200, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },`,
  `visualArea: { height: 180, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },`
);

// Fix textArea: remove flex:1, add justifyContent center, add marginBottom to push toward button
o = o.replace(
  `textArea: { alignItems: 'center', gap: 12, flex: 1 },`,
  `textArea: { alignItems: 'center', gap: 10 },`
);

// Fix bottomArea: reduce paddingBottom
o = o.replace(
  `bottomArea: { paddingBottom: 48, paddingHorizontal: 32, width: W, alignItems: 'center', gap: 12 },`,
  `bottomArea: { paddingBottom: 36, paddingTop: 20, paddingHorizontal: 32, width: W, alignItems: 'center', gap: 12 },`
);

// Make container use space-between to push bottom area down
o = o.replace(
  `container: { flex: 1, backgroundColor: C.bg, alignItems: 'center' },`,
  `container: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'space-between' },`
);

// Enhance lava bg glow - make it more visible
o = o.replace(
  `lavaBg: { position: 'absolute', bottom: 0, left: 0, right: 0, height: H * 0.3, backgroundColor: 'transparent', shadowColor: '#ff3300', shadowOffset: { width: 0, height: -20 }, shadowOpacity: 0.15, shadowRadius: 60, elevation: 0 },`,
  `lavaBg: { position: 'absolute', bottom: 0, left: 0, right: 0, height: H * 0.35, backgroundColor: 'rgba(255,40,0,0.06)', borderTopLeftRadius: 200, borderTopRightRadius: 200 },`
);

fs.writeFileSync(onboardPath, o);
console.log('✅ OnboardingScreen layout fixed');

// ─── FIX 2: LoadingScreen spacing and glow ────────────────────────────────────
const loadPath = path.join(__dirname, 'src/screens/LoadingScreen.tsx');
let l = fs.readFileSync(loadPath, 'utf8');

// Fix container - push content slightly higher than center
l = l.replace(
  `container:    { flex: 1, backgroundColor: '#080400', alignItems: 'center', justifyContent: 'center' },`,
  `container:    { flex: 1, backgroundColor: '#080400', alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },`
);

// Enhance wave visibility
l = l.replace(
  `wave1:        { height: '60%', backgroundColor: 'rgba(255,34,0,0.07)' },`,
  `wave1:        { height: '60%', backgroundColor: 'rgba(255,34,0,0.12)' },`
);
l = l.replace(
  `wave2:        { height: '45%', backgroundColor: 'rgba(255,107,53,0.05)' },`,
  `wave2:        { height: '45%', backgroundColor: 'rgba(255,107,53,0.09)' },`
);

// Make flowWrap taller for more visible glow
l = l.replace(
  `flowWrap:     { position: 'absolute', bottom: 0, left: 0, right: 0, height: H * 0.35, overflow: 'hidden' },`,
  `flowWrap:     { position: 'absolute', bottom: 0, left: 0, right: 0, height: H * 0.42, overflow: 'hidden' },`
);

// Reduce tagline margin to tighten spacing
l = l.replace(
  `tagline:      { fontFamily: 'SpaceMono', fontSize: 9, letterSpacing: 5, color: 'rgba(255,107,53,0.4)', marginTop: 4, marginBottom: 56, textTransform: 'uppercase' },`,
  `tagline:      { fontFamily: 'SpaceMono', fontSize: 9, letterSpacing: 5, color: 'rgba(255,107,53,0.4)', marginTop: 4, marginBottom: 40, textTransform: 'uppercase' },`
);

fs.writeFileSync(loadPath, l);
console.log('✅ LoadingScreen spacing + glow fixed');
