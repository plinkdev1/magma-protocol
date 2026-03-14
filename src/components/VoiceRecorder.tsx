import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Mic } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

const COLORS = {
  background: '#080400',
  primary: '#ff6b35',
  accent: '#ffb347',
  text: '#f0d8c0',
  muted: '#7a4a30',
  card: '#1a0f0a',
  cardBorder: '#3d2a1f',
};

type RecorderState = 'idle' | 'recording' | 'processing';

export interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  onError?: (error: string) => void;
  size?: 'small' | 'medium' | 'large';
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscript,
  onError,
  size = 'large',
}) => {
  const [state, setState] = useState<RecorderState>('idle');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const pulseValue = useSharedValue(0);
  const buttonSize = { small: 48, medium: 64, large: 80 }[size];

  useEffect(() => {
    ExpoSpeechRecognitionModule.getPermissionsAsync().then((result) => {
      setHasPermission(result.granted);
    });
  }, []);

  useSpeechRecognitionEvent('result', (event) => {
    if (event.isFinal) {
      const transcript = event.results?.[0]?.transcript?.trim() || '';
      if (transcript) onTranscript(transcript);
      setState('idle');
      pulseValue.value = withTiming(0, { duration: 200 });
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    onError?.(event.message || 'Recognition failed');
    setState('idle');
    pulseValue.value = withTiming(0, { duration: 200 });
  });

  useSpeechRecognitionEvent('end', () => {
    setState((prev) => (prev === 'recording' ? 'idle' : prev));
    pulseValue.value = withTiming(0, { duration: 200 });
  });

  const requestPermission = useCallback(async () => {
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    setHasPermission(result.granted);
    return result.granted;
  }, []);

  const handleStartRecording = useCallback(async () => {
    if (state !== 'idle') return;
    let granted = hasPermission;
    if (!granted) granted = await requestPermission();
    if (!granted) { onError?.('Microphone permission denied'); return; }
    try {
      setState('recording');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      pulseValue.value = withRepeat(withTiming(1, { duration: 600 }), -1, true);
      ExpoSpeechRecognitionModule.start({ lang: 'en-US', interimResults: true, maxAlternatives: 1, continuous: true });
    } catch (error) {
      setState('idle');
      onError?.(error instanceof Error ? error.message : 'Failed to start');
    }
  }, [state, hasPermission, requestPermission, onError]);

  const handleStopRecording = useCallback(async () => {
    if (state !== 'recording') return;
    setState('processing');
    pulseValue.value = withTiming(0, { duration: 200 });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    ExpoSpeechRecognitionModule.stop();
    setTimeout(() => setState('idle'), 500);
  }, [state]);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulseValue.value * 0.15 }],
    backgroundColor: interpolateColor(pulseValue.value, [0, 1], [COLORS.primary, COLORS.accent]),
    shadowOpacity: 0.3 + pulseValue.value * 0.4,
    shadowRadius: 8 + pulseValue.value * 12,
  }));

  if (hasPermission === false) {
    return (
      <View style={[styles.container, styles.containerSmall]}>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission} activeOpacity={0.7}>
          <Mic size={18} color={COLORS.primary} strokeWidth={1.5} />
          <Text style={styles.permissionText}>Enable Mic</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, size === 'small' && styles.containerSmall]}>
      <TouchableOpacity
        style={[styles.button, { width: buttonSize, height: buttonSize }]}
        onPressIn={handleStartRecording}
        onPressOut={handleStopRecording}
        disabled={state === 'processing'}
        activeOpacity={0.8}
      >
        <Animated.View style={[styles.buttonInner, buttonAnimatedStyle]}>
          {state === 'processing' ? (
            <View style={styles.processingSpinner}>
              <View style={styles.spinnerDot} />
              <View style={styles.spinnerDot} />
              <View style={styles.spinnerDot} />
            </View>
          ) : (
            <Mic size={state === 'recording' ? 32 : 28} color={state === 'recording' ? COLORS.accent : '#fff5ee'} strokeWidth={1.5} />
          )}
        </Animated.View>
      </TouchableOpacity>
      <Text style={styles.statusText}>
        {state === 'idle' && 'Tap to speak'}
        {state === 'recording' && 'Listening...'}
        {state === 'processing' && 'Processing...'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  containerSmall: { paddingVertical: 8 },
  button: { alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  buttonInner: { width: '100%', height: '100%', borderRadius: 100, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: COLORS.background, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  processingSpinner: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  spinnerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent },
  statusText: { fontSize: 14, color: COLORS.muted, marginTop: 8, fontFamily: 'Syne-Regular' },
  permissionButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.card, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: COLORS.cardBorder },
  permissionText: { fontSize: 14, color: COLORS.text, fontFamily: 'Syne-Regular' },
});

export default VoiceRecorder;
