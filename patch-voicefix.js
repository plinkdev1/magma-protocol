const fs = require('fs');
const path = require('path');
const fp = path.join(__dirname, 'src/components/VoiceRecorder.tsx');
let c = fs.readFileSync(fp, 'utf8');

// Make SpeechRecognition fail gracefully
c = c.replace(
  `let SpeechRecognition: any = null;
try { SpeechRecognition = require('expo-speech-recognition').default; } catch (e) { console.warn('[VoiceRecorder] expo-speech-recognition not available:', e); }`,
  `let SpeechRecognition: any = null;
try {
  const mod = require('expo-speech-recognition');
  SpeechRecognition = mod?.default || mod?.ExpoSpeechRecognition || null;
} catch (e) {
  console.warn('[VoiceRecorder] expo-speech-recognition not available:', e);
}`
);

// Guard all SpeechRecognition calls
c = c.replace(
  `SpeechRecognition.stopListening`,
  `SpeechRecognition?.stopListening`
);
c = c.replace(
  `SpeechRecognition.startListening`,
  `SpeechRecognition?.startListening`
);

fs.writeFileSync(fp, c);
console.log('✅ VoiceRecorder patched to fail gracefully');
