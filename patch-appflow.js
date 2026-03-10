const fs = require('fs');
const path = require('path');
const fp = path.join(__dirname, 'App.tsx');
let c = fs.readFileSync(fp, 'utf8');

const newImports = `import AsyncStorage from '@react-native-async-storage/async-storage';
import LoadingScreen from './src/screens/LoadingScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';`;

c = c.replace(
  `import ProfileScreen from './src/screens/ProfileScreen';`,
  `import ProfileScreen from './src/screens/ProfileScreen';\n${newImports}`
);

const oldReturn = `export default function App() {
  return (`;

const newApp = `export default function App() {
  const [appState, setAppState] = React.useState<'loading' | 'onboarding' | 'main'>('loading');

  const handleLoadComplete = React.useCallback(async () => {
    try {
      const seen = await AsyncStorage.getItem('onboarding_complete');
      setAppState(seen ? 'main' : 'onboarding');
    } catch {
      setAppState('main');
    }
  }, []);

  const handleOnboardingComplete = React.useCallback(async () => {
    try { await AsyncStorage.setItem('onboarding_complete', 'true'); } catch {}
    setAppState('main');
  }, []);

  if (appState === 'loading') {
    return <LoadingScreen onLoadComplete={handleLoadComplete} />;
  }
  if (appState === 'onboarding') {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return (`;

c = c.replace(oldReturn, newApp);

fs.writeFileSync(fp, c);
console.log('✅ App.tsx wired: Loading → Onboarding → Main');
