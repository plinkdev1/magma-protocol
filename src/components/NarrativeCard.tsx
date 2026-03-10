import React, { useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PanGestureHandler, GestureHandlerStateChange } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const COLORS = {
  background: '#080400',
  primary: '#ff6b35',
  accent: '#ffb347',
  text: '#f0d8c0',
  muted: '#7a4a30',
  card: '#1a0f0a',
  cardBorder: '#3d2a1f',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;
const SWIPE_THRESHOLD = 120;

export interface NarrativeCardProps {
  title: string;
  thesis: string;
  score: number;
  solBacked: number;
  backers: number;
  daysRemaining: number;
  onBack: () => void;
  onDismiss: () => void;
}

export const NarrativeCard: React.FC<NarrativeCardProps> = ({
  title,
  thesis,
  score,
  solBacked,
  backers,
  daysRemaining,
  onBack,
  onDismiss,
}) => {
  const translationX = useSharedValue(0);
  const scoreWidth = useSharedValue(0);
  const isGestureActive = useRef(false);

  React.useEffect(() => {
    scoreWidth.value = withTiming(score, { duration: 800 });
  }, [score]);

  const handleGestureEvent = (event: GestureHandlerStateChange) => {
    translationX.value = event.translationX;
  };

  const handleGestureStateChange = (event: GestureHandlerStateChange) => {
    if (event.state === 2) {
      isGestureActive.current = true;
      Haptics.selectionAsync();
    }
    if (event.state === 4 || event.state === 5) {
      isGestureActive.current = false;
      if (event.translationX > SWIPE_THRESHOLD) {
        translationX.value = withSpring(SCREEN_WIDTH, { velocity: 2 }, () => {
          runOnJS(onBack)();
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        translationX.value = withSpring(-SCREEN_WIDTH, { velocity: 2 }, () => {
          runOnJS(onDismiss)();
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        translationX.value = withSpring(0);
      }
    }
  };

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translationX.value }],
    opacity: interpolate(
      Math.abs(translationX.value),
      [0, SCREEN_WIDTH / 2, SCREEN_WIDTH],
      [1, 0.7, 0.5],
      Extrapolation.CLAMP
    ),
  }));

  const scoreBarStyle = useAnimatedStyle(() => ({
    width: `${scoreWidth.value}%`,
  }));

  const getScoreColor = (s: number) => {
    if (s >= 75) return COLORS.primary;
    if (s >= 50) return COLORS.accent;
    return COLORS.muted;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <PanGestureHandler
      onGestureEvent={handleGestureEvent}
      onHandlerStateChange={handleGestureStateChange}
      activeOffsetX={[-10, 10]}
      failOffsetY={[-50, 50]}
    >
      <Animated.View style={[styles.card, cardAnimatedStyle]}>
        <View style={styles.scoreContainer}>
          <View style={styles.scoreBarBackground}>
            <Animated.View
              style={[styles.scoreBar, scoreBarStyle, { backgroundColor: getScoreColor(score) }]}
            />
          </View>
          <Text style={styles.scoreText}>{score}</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
          <Text style={styles.thesis} numberOfLines={3}>{thesis}</Text>
        </View>

        <View style={styles.metrics}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{(solBacked ?? 0).toFixed(2)}</Text>
            <Text style={styles.metricLabel}>SOL Backed</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{formatNumber(backers ?? 0)}</Text>
            <Text style={styles.metricLabel}>Backers</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{daysRemaining ?? 0}</Text>
            <Text style={styles.metricLabel}>Days Left</Text>
          </View>
        </View>

        <View style={styles.hintContainer}>
          <Animated.View
            style={[styles.hintArrow, {
              opacity: interpolate(translationX.value, [0, 50], [0, 1], Extrapolation.CLAMP),
              transform: [{ translateX: interpolate(translationX.value, [0, 50], [-10, 0], Extrapolation.CLAMP) }],
            }]}
          >
            <Text style={styles.hintText}>→</Text>
          </Animated.View>
          <Text style={styles.hintLabel}>Swipe to decide</Text>
          <Animated.View
            style={[styles.hintArrow, {
              opacity: interpolate(translationX.value, [0, -50], [0, 1], Extrapolation.CLAMP),
              transform: [{ translateX: interpolate(translationX.value, [0, -50], [10, 0], Extrapolation.CLAMP) }],
            }]}
          >
            <Text style={styles.hintText}>←</Text>
          </Animated.View>
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 16,
    marginHorizontal: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.muted,
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 12,
  },
  scoreBar: {
    height: '100%',
    borderRadius: 3,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    width: 32,
    textAlign: 'right',
  },
  content: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  thesis: {
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 20,
  },
  metrics: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.cardBorder,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  metricLabel: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  hintArrow: {
    width: 24,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 20,
    color: COLORS.accent,
    fontWeight: '700',
  },
  hintLabel: {
    fontSize: 12,
    color: COLORS.muted,
    marginHorizontal: 12,
  },
});

export default NarrativeCard;
