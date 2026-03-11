import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, PermissionsAndroid, Platform } from 'react-native';
import { Mic } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSpring,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
let SpeechRecognition: any = null;
try { SpeechRecognition = require('expo-speech-recognition').default; } catch (e) { console.warn('[VoiceRecorder] expo-speech-recognition not available:', e); }

// Design tokens
const COLORS = {
  background: '#080400',
  primary: '#ff6b35',
  accent: '#ffb347',
  text: '#f0d8c0',
  muted: '#7a4a30',
  card: '#1a0f0a',
};

type RecorderState = 'idle' | 'recording' | 'processing';

export interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  onError?: (error: string) => void;
  size?: 'small' | 'medium' | 'large';
}

const SILENCE_TIMEOUT_MS = 3000;
const MAX_RECORDING_MS = 30000;

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscript,
  onError,
  size = 'large',
}) => {
  const [state, setState] = useState<RecorderState>('idle');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isListeningRef = useRef(false);

  // Animation values
  const pulseValue = useSharedValue(0);
  const waveformValues = useSharedValue([0.3, 0.5, 0.3, 0.5, 0.3]);

  const buttonSize = {
    small: 48,
    medium: 64,
    large: 80,
  }[size];

  // Request microphone permission (Android only)
  const requestPermission = useCallback(async () => {
    if (Platform.OS !== 'android') {
      setHasPermission(true);
      return true;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'MAGMA needs microphone access for voice commands',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        }
      );
      const hasAccess = granted === PermissionsAndroid.RESULTS.GRANTED;
      setHasPermission(hasAccess);
      return hasAccess;
    } catch (error) {
      console.error('[VoiceRecorder] Permission request failed:', error);
      setHasPermission(false);
      return false;
    }
  }, []);

  // Initialize permission check
  useEffect(() => {
    if (Platform.OS === 'android') {
      PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO).then(
        (granted) => setHasPermission(granted)
      );
    } else {
      setHasPermission(true);
    }
  }, []);

  // Start waveform animation
  const startWaveformAnimation = useCallback(() => {
    waveformValues.value = [
      withRepeat(withTiming(1, { duration: 200 }), -1, true),
      withRepeat(withTiming(0.8, { duration: 250 }), -1, true),
      withRepeat(withTiming(1, { duration: 180 }), -1, true),
      withRepeat(withTiming(0.6, { duration: 220 }), -1, true),
      withRepeat(withTiming(1, { duration: 200 }), -1, true),
    ];
  }, []);

  // Stop waveform animation
  const stopWaveformAnimation = useCallback(() => {
    waveformValues.value = [0.3, 0.5, 0.3, 0.5, 0.3];
  }, []);

  // Start pulse animation
  const startPulseAnimation = useCallback(() => {
    pulseValue.value = withRepeat(
      withTiming(1, { duration: 600 }),
      -1,
      true
    );
  }, []);

  // Stop pulse animation
  const stopPulseAnimation = useCallback(() => {
    pulseValue.value = withTiming(0, { duration: 200 });
  }, []);

  // Reset silence timer
  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    silenceTimerRef.current = setTimeout(() => {
      if (isListeningRef.current) {
        runOnJS(handleStopRecording)();
      }
    }, SILENCE_TIMEOUT_MS);
  }, []);

  // Handle speech recognition results
  const handleRecognitionResult = useCallback((result: SpeechRecognitionResult) => {
    if (result.isFinal) {
      const transcript = result.transcript?.trim() || '';
      if (transcript) {
        runOnJS(onTranscript)(transcript);
      }
      runOnJS(handleStopRecording)();
    } else {
      // Partial result - reset silence timer
      runOnJS(resetSilenceTimer)();
    }
  }, [onTranscript, resetSilenceTimer]);

  // Start recording
  const handleStartRecording = useCallback(async () => {
    if (state !== 'idle') return;

    // Check permission
    let permissionGranted = hasPermission;
    if (!permissionGranted) {
      permissionGranted = await requestPermission();
    }

    if (!permissionGranted) {
      onError?.('Microphone permission denied');
      return;
    }

    try {
      setState('recording');
      isListeningRef.current = true;

      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Start animations
      startPulseAnimation();
      startWaveformAnimation();

      // Start speech recognition
      await SpeechRecognition?.startRecognition({
        onResults: handleRecognitionResult,
        onError: (error) => {
          console.error('[VoiceRecorder] Recognition error:', error);
          runOnJS(onError)?.(error.message || 'Recognition failed');
          runOnJS(handleStopRecording)();
        },
        locale: 'en-US',
        showPopup: false,
      });

      // Max recording timeout
      recordingTimerRef.current = setTimeout(() => {
        if (isListeningRef.current) {
          runOnJS(handleStopRecording)();
        }
      }, MAX_RECORDING_MS);
    } catch (error) {
      console.error('[VoiceRecorder] Failed to start recording:', error);
      setState('idle');
      onError?.(error instanceof Error ? error.message : 'Failed to start recording');
    }
  }, [state, hasPermission, requestPermission, onError, handleRecognitionResult, startPulseAnimation, startWaveformAnimation]);

  // Stop recording
  const handleStopRecording = useCallback(async () => {
    if (state !== 'recording') return;

    isListeningRef.current = false;
    setState('processing');

    // Clear timers
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    // Stop animations
    stopPulseAnimation();
    stopWaveformAnimation();

    // Stop speech recognition
    try {
      await SpeechRecognition?.stopRecognition();
    } catch (error) {
      console.error('[VoiceRecorder] Failed to stop recognition:', error);
    }

    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Return to idle after brief processing delay
    setTimeout(() => {
      setState('idle');
    }, 500);
  }, [state, stopPulseAnimation, stopWaveformAnimation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
      }
      SpeechRecognition?.stopRecognition?.().catch(() => {});
    };
  }, []);

  // Animated button style
  const buttonAnimatedStyle = useAnimatedStyle(() => {
    const scale = 1 + pulseValue.value * 0.15;
    const backgroundColor = interpolateColor(
      pulseValue.value,
      [0, 1],
      [COLORS.primary, COLORS.accent]
    );

    return {
      transform: [{ scale }],
      backgroundColor,
      shadowColor: COLORS.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3 + pulseValue.value * 0.4,
      shadowRadius: 8 + pulseValue.value * 12,
    };
  });

  // Waveform bar styles
  const WaveformBar = ({ index }: { index: number }) => {
    const barStyle = useAnimatedStyle(() => {
      const heightScale = Array.isArray(waveformValues.value)
        ? waveformValues.value[index] || 0.5
        : 0.5;

      return {
        height: `${30 + heightScale * 40}%`,
        backgroundColor: state === 'recording' ? COLORS.accent : COLORS.muted,
      };
    });

    return <Animated.View style={[styles.waveformBar, barStyle]} />;
  };

  // Render mic icon
  const renderMicIcon = () => {
    if (state === 'processing') {
      return (
        <View style={styles.processingSpinner}>
          <View style={styles.spinnerDot} />
          <View style={styles.spinnerDot} />
          <View style={styles.spinnerDot} />
        </View>
      );
    }

    return (
      <Mic size={state === 'recording' ? 32 : 28} color={state === 'recording' ? COLORS.accent : '#fff5ee'} strokeWidth={1.5} />
    );
  };

  // Render permission warning
  if (hasPermission === false) {
    return (
      <View style={[styles.container, styles.containerSmall]}>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
          activeOpacity={0.7}
        >
          <Text style={styles.permissionIcon}>­ƒöç</Text>
          <Text style={styles.permissionText}>Enable Mic</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, size === 'small' && styles.containerSmall]}>
      {/* Waveform visualization */}
      {state === 'recording' && (
        <View style={styles.waveform}>
          {[0, 1, 2, 3, 4].map((i) => (
            <WaveformBar key={i} index={i} />
          ))}
        </View>
      )}

      {/* Mic button */}
      <TouchableOpacity
        style={[styles.button, { width: buttonSize, height: buttonSize }]}
        onPressIn={handleStartRecording}
        onPressOut={handleStopRecording}
        disabled={state === 'processing'}
        activeOpacity={0.8}
      >
        <Animated.View style={[styles.buttonInner, buttonAnimatedStyle]}>
          {renderMicIcon()}
        </Animated.View>
      </TouchableOpacity>

      {/* Status text */}
      <Text style={styles.statusText}>
        {state === 'idle' && 'Tap to speak'}
        {state === 'recording' && 'Listening...'}
        {state === 'processing' && 'Processing...'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  containerSmall: {
    paddingVertical: 8,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  buttonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.background,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  micIcon: {
    fontSize: 32,
  },
  processingSpinner: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  spinnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 40,
    marginBottom: 8,
  },
  waveformBar: {
    width: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 8,
    fontFamily: 'Syne-Regular',
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  permissionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  permissionText: {
    fontSize: 14,
    color: COLORS.text,
    fontFamily: 'Syne-Regular',
  },
});

export default VoiceRecorder;


