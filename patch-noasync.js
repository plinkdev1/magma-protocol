const fs = require('fs');
const path = require('path');
const fp = path.join(__dirname, 'App.tsx');
let c = fs.readFileSync(fp, 'utf8');

// Remove AsyncStorage import
c = c.replace(`import AsyncStorage from '@react-native-async-storage/async-storage';\n`, '');

// Replace handleLoadComplete to skip AsyncStorage
c = c.replace(
  `  const handleLoadComplete = React.useCallback(async () => {
    try {
      const seen = await AsyncStorage.getItem('onboarding_complete');
      setAppState(seen ? 'main' : 'onboarding');
    } catch {
      setAppState('main');
    }
  }, []);`,
  `  const handleLoadComplete = React.useCallback(() => {
    setAppState('onboarding');
  }, []);`
);

// Replace handleOnboardingComplete to skip AsyncStorage
c = c.replace(
  `  const handleOnboardingComplete = React.useCallback(async () => {
    try { await AsyncStorage.setItem('onboarding_complete', 'true'); } catch {}
    setAppState('main');
  }, []);`,
  `  const handleOnboardingComplete = React.useCallback(() => {
    setAppState('main');
  }, []);`
);

fs.writeFileSync(fp, c);
console.log('✅ AsyncStorage removed — using in-memory flow');
