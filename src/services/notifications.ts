import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert:    true,
    shouldPlaySound:    true,
    shouldSetBadge:     true,
    shouldShowBanner:   true,
    shouldShowList:     true,
  }),
});

// Register for push notifications — returns expoPushToken or null
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('[notifications] Must use physical device for push notifications');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[notifications] Permission not granted');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name:              'MAGMA Notifications',
      importance:        Notifications.AndroidImportance.MAX,
      vibrationPattern:  [0, 250, 250, 250],
      lightColor:        '#FF6B35',
    });
  }

  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

// Local notification helpers — used when backend pushes aren't set up yet

export async function notifyNarrativeResolved(
  title: string,
  result: 'TRUE' | 'FALSE',
  payout?: number
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: result === 'TRUE' ? '✅ Narrative Resolved TRUE' : '❌ Narrative Resolved FALSE',
      body:  result === 'TRUE'
        ? `"${title}" resolved correctly. ${payout ? 'Claim ' + payout.toFixed(3) + ' SOL' : 'Payout available.'}`
        : `"${title}" resolved incorrectly.`,
      data:  { type: 'narrative_resolved' },
    },
    trigger: null, // immediate
  });
}

export async function notifyEchoPoolDistribution(amount: number): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌊 Echo Pool Distribution',
      body:  `You received ${amount.toFixed(3)} SOL from this month's Echo Pool.`,
      data:  { type: 'echo_pool' },
    },
    trigger: null,
  });
}

export async function notifyEarlyWindow(narrativeTitle: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⚡ Early Window Open',
      body:  `"${narrativeTitle}" — Back now for 2.0× Discovery bonus.`,
      data:  { type: 'early_window' },
    },
    trigger: null,
  });
}

export async function notifyChallengeWindowClosing(narrativeTitle: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⏱ Challenge Window Closing',
      body:  `"${narrativeTitle}" challenge window closes in 2 hours.`,
      data:  { type: 'challenge_window' },
    },
    trigger: null,
  });
}
