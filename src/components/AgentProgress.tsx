import { API_URL } from '../config';
import React, { useEffect, useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  withRepeat,
  interpolateColor,
  runOnJS,
  FadeIn,
  FadeInUp,
  FadeOutUp,
} from 'react-native-reanimated';
import axios from 'axios';

// Design tokens
const COLORS = {
  background: '#080400',
  primary: '#ff6b35',
  accent: '#ffb347',
  text: '#f0d8c0',
  muted: '#7a4a30',
  card: '#1a0f0a',
  cardBorder: '#3d2a1f',
  success: '#00ff88',
  error: '#ff3355',
};

// Agent definitions
interface AgentStep {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const AGENT_STEPS: AgentStep[] = [
  { id: 'thesis', name: 'Thesis Analyzer', icon: '🔍', description: 'Analyzing narrative thesis' },
  { id: 'originality', name: 'Originality Checker', icon: '✨', description: 'Checking uniqueness' },
  { id: 'hook', name: 'Hook Writer', icon: '🎣', description: 'Crafting compelling hook' },
  { id: 'article', name: 'Article Writer', icon: '📝', description: 'Writing full article' },
  { id: 'thread', name: 'Thread Writer', icon: '🧵', description: 'Creating Twitter thread' },
  { id: 'score', name: 'Score Evaluator', icon: '📊', description: 'Evaluating narrative score' },
  { id: 'ipfs', name: 'IPFS Publisher', icon: '🌐', description: 'Publishing to IPFS' },
];

type StepStatus = 'pending' | 'running' | 'done' | 'error';

interface StepState {
  status: StepStatus;
  progress: number;
}

interface JobStatusResponse {
  jobId: string;
  steps: Record<string, { status: StepStatus; progress?: number }>;
  overallStatus: 'running' | 'completed' | 'failed';
  error?: string;
}

export interface AgentProgressProps {
  jobId: string;
  onComplete?: (result: JobStatusResponse) => void;
  onError?: (error: string) => void;
}

export const AgentProgress: React.FC<AgentProgressProps> = ({
  jobId,
  onComplete,
  onError,
}) => {
  const [steps, setSteps] = useState<Record<string, StepState>>(() => {
    const initial: Record<string, StepState> = {};
    AGENT_STEPS.forEach((step) => {
      initial[step.id] = { status: 'pending', progress: 0 };
    });
    return initial;
  });
  const [overallStatus, setOverallStatus] = useState<'running' | 'completed' | 'failed'>('running');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationProgress = useSharedValue(0);

  // Poll job status
  const pollJobStatus = useCallback(async () => {
    try {
      const response = await axios.get<JobStatusResponse>(
        `${API_URL}/v1/jobs/${jobId}/status`,
        { timeout: 5000 }
      );

      const data = response.data;
      setOverallStatus(data.overallStatus);

      // Update steps
      const newSteps: Record<string, StepState> = {};
      AGENT_STEPS.forEach((step) => {
        const stepData = data.steps[step.id] || { status: 'pending' as StepStatus, progress: 0 };
        newSteps[step.id] = {
          status: stepData.status,
          progress: stepData.progress ?? 0,
        };
      });
      setSteps(newSteps);

      if (data.error) {
        setErrorMessage(data.error);
      }

      // Check if done
      if (data.overallStatus === 'completed' || data.overallStatus === 'failed') {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }

        if (data.overallStatus === 'completed') {
          onComplete?.(data);
        } else {
          onError?.(data.error || 'Job failed');
        }
      }
    } catch (error) {
      console.error('[AgentProgress] Polling error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch status';
      setErrorMessage(errorMsg);
      onError?.(errorMsg);

      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  }, [jobId, onComplete, onError]);

  // Start polling
  useEffect(() => {
    // Initial fetch
    pollJobStatus();

    // Poll every 2 seconds
    pollingIntervalRef.current = setInterval(pollJobStatus, 2000);

    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [pollJobStatus]);

  // Animate overall progress
  useEffect(() => {
    const doneCount = Object.values(steps).filter((s) => s.status === 'done').length;
    const errorCount = Object.values(steps).filter((s) => s.status === 'error').length;

    if (errorCount > 0) {
      animationProgress.value = withTiming(0.3, { duration: 500 });
    } else {
      animationProgress.value = withTiming(doneCount / AGENT_STEPS.length, { duration: 500 });
    }
  }, [steps]);

  // Step item component
  const StepItem = ({ step, index }: { step: AgentStep; index: number }) => {
    const stepState = steps[step.id] || { status: 'pending', progress: 0 };
    const progressValue = useSharedValue(0);
    const pulseValue = useSharedValue(0);

    // Animate progress when status changes
    useEffect(() => {
      if (stepState.status === 'running') {
        progressValue.value = withRepeat(
          withTiming(1, { duration: 1000 }),
          -1,
          true
        );
        pulseValue.value = withRepeat(
          withTiming(1, { duration: 600 }),
          -1,
          true
        );
      } else if (stepState.status === 'done') {
        progressValue.value = withTiming(1, { duration: 300 });
        pulseValue.value = withTiming(0, { duration: 200 });
      } else if (stepState.status === 'error') {
        progressValue.value = withTiming(0.3, { duration: 300 });
        pulseValue.value = withTiming(0, { duration: 200 });
      } else {
        progressValue.value = withTiming(0, { duration: 200 });
        pulseValue.value = withTiming(0, { duration: 200 });
      }
    }, [stepState.status]);

    const containerStyle = useAnimatedStyle(() => {
      const isActive = stepState.status === 'running';
      const isDone = stepState.status === 'done';
      const isError = stepState.status === 'error';

      return {
        opacity: isDone ? 0.7 : 1,
        borderColor: isError
          ? COLORS.error
          : isDone
          ? COLORS.success
          : isActive
          ? COLORS.primary
          : COLORS.cardBorder,
        backgroundColor: isError
          ? `${COLORS.error}20`
          : isDone
          ? `${COLORS.success}10`
          : isActive
          ? `${COLORS.primary}15`
          : COLORS.card,
        transform: [
          {
            scale: isActive ? 1 + pulseValue.value * 0.02 : 1,
          },
        ],
      };
    });

    const iconContainerStyle = useAnimatedStyle(() => {
      const isActive = stepState.status === 'running';
      const isDone = stepState.status === 'done';
      const isError = stepState.status === 'error';

      return {
        backgroundColor: isError
          ? COLORS.error
          : isDone
          ? COLORS.success
          : isActive
          ? COLORS.primary
          : COLORS.muted,
        transform: [
          {
            scale: isActive ? 1 + pulseValue.value * 0.1 : 1,
          },
        ],
      };
    });

    const progressBarStyle = useAnimatedStyle(() => ({
      width: `${progressValue.value * 100}%`,
      backgroundColor: stepState.status === 'error' ? COLORS.error : COLORS.accent,
    }));

    const renderStatusIcon = () => {
      if (stepState.status === 'running') {
        return (
          <ActivityIndicator size="small" color={COLORS.background} />
        );
      }
      if (stepState.status === 'done') {
        return <Text style={styles.statusIcon}>✓</Text>;
      }
      if (stepState.status === 'error') {
        return <Text style={styles.statusIcon}>✕</Text>;
      }
      return null;
    };

    return (
      <Animated.View
        style={[styles.stepContainer, containerStyle]}
        entering={FadeInUp.delay(index * 100).duration(400)}
      >
        <View style={styles.stepHeader}>
          <Animated.View style={[styles.iconContainer, iconContainerStyle]}>
            <Text style={styles.stepIcon}>{step.icon}</Text>
            {renderStatusIcon()}
          </Animated.View>
          <View style={styles.stepInfo}>
            <Text style={styles.stepName}>{step.name}</Text>
            <Text style={styles.stepDescription}>{step.description}</Text>
          </View>
          <View style={styles.stepStatus}>
            <Text
              style={[
                styles.statusText,
                stepState.status === 'done' && styles.statusTextDone,
                stepState.status === 'error' && styles.statusTextError,
                stepState.status === 'running' && styles.statusTextRunning,
              ]}
            >
              {stepState.status.toUpperCase()}
            </Text>
          </View>
        </View>
        {stepState.status === 'running' && (
          <View style={styles.progressContainer}>
            <Animated.View style={[styles.progressBar, progressBarStyle]} />
          </View>
        )}
      </Animated.View>
    );
  };

  // Overall progress bar
  const OverallProgress = () => {
    const progressStyle = useAnimatedStyle(() => ({
      width: `${animationProgress.value * 100}%`,
      backgroundColor:
        overallStatus === 'failed'
          ? COLORS.error
          : overallStatus === 'completed'
          ? COLORS.success
          : COLORS.primary,
    }));

    return (
      <View style={styles.overallProgressContainer}>
        <View style={styles.overallProgressHeader}>
          <Text style={styles.overallProgressLabel}>Pipeline Progress</Text>
          <Text style={styles.overallProgressValue}>
            {Math.round(animationProgress.value * 100)}%
          </Text>
        </View>
        <View style={styles.overallProgressBar}>
          <Animated.View style={[styles.overallProgressFill, progressStyle]} />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <OverallProgress />

      <View style={styles.stepsContainer}>
        {AGENT_STEPS.map((step, index) => (
          <StepItem key={step.id} step={step} index={index} />
        ))}
      </View>

      {errorMessage && (
        <Animated.View style={styles.errorContainer} entering={FadeIn}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        </Animated.View>
      )}

      {overallStatus === 'completed' && (
        <Animated.View style={styles.successContainer} entering={FadeIn}>
          <Text style={styles.successIcon}>🎉</Text>
          <Text style={styles.successText}>Pipeline Complete!</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  overallProgressContainer: {
    marginBottom: 20,
  },
  overallProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  overallProgressLabel: {
    fontSize: 14,
    color: COLORS.muted,
    fontFamily: 'Syne-Regular',
  },
  overallProgressValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Syne-Bold',
  },
  overallProgressBar: {
    height: 8,
    backgroundColor: COLORS.card,
    borderRadius: 4,
    overflow: 'hidden',
  },
  overallProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  stepsContainer: {
    gap: 12,
  },
  stepContainer: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  stepIcon: {
    fontSize: 20,
  },
  statusIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.background,
  },
  stepInfo: {
    flex: 1,
  },
  stepName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Syne-Bold',
  },
  stepDescription: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
    fontFamily: 'Syne-Regular',
  },
  stepStatus: {
    minWidth: 70,
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.muted,
    fontFamily: 'Syne-Bold',
  },
  statusTextDone: {
    color: COLORS.success,
  },
  statusTextError: {
    color: COLORS.error,
  },
  statusTextRunning: {
    color: COLORS.primary,
  },
  progressContainer: {
    marginTop: 10,
    height: 3,
    backgroundColor: COLORS.card,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  errorContainer: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.error}20`,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  errorIcon: {
    fontSize: 20,
  },
  errorMessage: {
    flex: 1,
    fontSize: 13,
    color: COLORS.error,
    fontFamily: 'Syne-Regular',
  },
  successContainer: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.success}20`,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  successIcon: {
    fontSize: 24,
  },
  successText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.success,
    fontFamily: 'Syne-Bold',
  },
});

export default AgentProgress;
