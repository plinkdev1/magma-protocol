const fs = require('fs');
const path = require('path');
const fp = path.join(__dirname, 'src/components/VoiceRecorder.tsx');
let c = fs.readFileSync(fp, 'utf8');

c = c.replace(
  `await SpeechRecognition.startRecognition(`,
  `await SpeechRecognition?.startRecognition(`
);
c = c.replace(
  `await SpeechRecognition.stopRecognition();`,
  `await SpeechRecognition?.stopRecognition();`
);
c = c.replace(
  `SpeechRecognition.stopRecognition().catch(() => {});`,
  `SpeechRecognition?.stopRecognition?.().catch(() => {});`
);

fs.writeFileSync(fp, c);
console.log('✅ VoiceRecorder all calls guarded');
