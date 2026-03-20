import React, { useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { PanGestureHandler, GestureEvent, HandlerStateChangeEvent, PanGestureHandlerEventPayload } from 'react-native-gesture-handler';
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
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing, fontSize } from '../theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;
const SWIPE_THRESHOLD = 60;

export interface NarrativeCardProps {
  title: string;
  thesis: string;
  score: number;
  solBacked: number;
  backers: number;
  daysRemaining: number;
  category?: string;
  discoveryLabel?: string;
  onBack: () => void;
  onDismiss: () => void;
  onPress?: () => void;
}

export const NarrativeCard: React.FC<NarrativeCardProps> = ({
  title,
  thesis,
  score,
  solBacked,
  backers,
  daysRemaining,
  category,
  discoveryLabel,
  onBack,
  onDismiss,
  onPress,
}) => {
  const { theme } = useTheme();
  const translationX = useSharedValue(0);
  const scoreWidth = useSharedValue(0);
  const isGestureActive = useRef(false);

  React.useEffect(() => {
    scoreWidth.value = withTiming(score, { duration: 800 });
  }, [score]);

  const handleGestureEvent = (event: GestureEvent<PanGestureHandlerEventPayload>) => {
    translationX.value = event.nativeEvent.translationX;
  };

  const handleGestureStateChange = (event: HandlerStateChangeEvent<PanGestureHandlerEventPayload>) => {
    const tx = event.nativeEvent.translationX ?? 0;
    const state = event.nativeEvent.state ?? 0;
    if (state === 2) {
      isGestureActive.current = true;
      Haptics.selectionAsync();
    }
    if (state === 4 || state === 5) {
      isGestureActive.current = false;
      if (tx > SWIPE_THRESHOLD) {
        translationX.value = withTiming(0, { duration: 100 }, () => runOnJS(onBack)());
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (tx < -SWIPE_THRESHOLD) {
        translationX.value = withTiming(-SCREEN_WIDTH, { duration: 200 }, () => runOnJS(onDismiss)());
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
    if (s >= 75) return theme.orange;
    if (s >= 50) return theme.amber;
    return theme.textTertiary;
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
      <Animated.View style={[
        styles.card,
        {
          backgroundColor: theme.cardBg,
          borderColor:     theme.cardBorder,
          shadowColor:     theme.orange,
        },
        cardAnimatedStyle,
      ]}>

        {/* Badges row */}
        {(category || discoveryLabel) && (
          <View style={styles.badgeRow}>
            {category && (
              <View style={[styles.badge, { backgroundColor: theme.bgGlass, borderColor: theme.borderSubtle }]}>
                <Text style={[styles.badgeText, { color: theme.textSecondary }]}>{category.toUpperCase()}</Text>
              </View>
            )}
            {discoveryLabel && (
              <View style={[styles.badge, { backgroundColor: 'rgba(34,197,94,0.10)', borderColor: 'rgba(34,197,94,0.30)' }]}>
                <Text style={[styles.badgeText, { color: theme.green }]}>{discoveryLabel}</Text>
              </View>
            )}
          </View>
        )}

        {/* Score bar */}
        <View style={styles.scoreContainer}>
          <View style={[styles.scoreBarBackground, { backgroundColor: theme.bgElevated }]}>
            <Animated.View
              style={[styles.scoreBar, scoreBarStyle, { backgroundColor: getScoreColor(score) }]}
            />
          </View>
          <Text style={[styles.scoreText, { color: theme.textPrimary }]}>{score}</Text>
        </View>

        {/* Content */}
        <TouchableOpacity style={styles.content} onPress={onPress || onBack} activeOpacity={0.7}>
          <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={2}>{title}</Text>
          <Text style={[styles.thesis, { color: theme.textSecondary }]} numberOfLines={3}>{thesis}</Text>
        </TouchableOpacity>

        {/* Metrics */}
        <View style={[styles.metrics, { borderTopColor: theme.borderSubtle, borderBottomColor: theme.borderSubtle }]}>
          <View style={styles.metric}>
            <Text style={[styles.metricValue, { color: theme.orange }]}>{(solBacked ?? 0).toFixed(2)}</Text>
            <Text style={[styles.metricLabel, { color: theme.textTertiary }]}>SOL Backed</Text>
          </View>
          <View style={[styles.metricDivider, { backgroundColor: theme.borderSubtle }]} />
          <View style={styles.metric}>
            <Text style={[styles.metricValue, { color: theme.orange }]}>{formatNumber(backers ?? 0)}</Text>
            <Text style={[styles.metricLabel, { color: theme.textTertiary }]}>Backers</Text>
          </View>
          <View style={[styles.metricDivider, { backgroundColor: theme.borderSubtle }]} />
          <View style={styles.metric}>
            <Text style={[styles.metricValue, { color: theme.orange }]}>{daysRemaining ?? 0}</Text>
            <Text style={[styles.metricLabel, { color: theme.textTertiary }]}>Days Left</Text>
          </View>
        </View>

        {/* Swipe hints */}
        <View style={styles.hintContainer}>
          <Animated.View style={[styles.hintArrow, { left: 16,
            opacity: interpolate(translationX.value, [0, 50], [0, 1], Extrapolation.CLAMP),
            transform: [{ translateX: interpolate(translationX.value, [0, 50], [-10, 0], Extrapolation.CLAMP) }],
          }]}>
            <Text style={[styles.hintText, { color: theme.amber }]}>→</Text>
          </Animated.View>
          <Text style={[styles.hintLabel, { color: theme.textTertiary }]}>Swipe to decide</Text>
          <Animated.View style={[styles.hintArrow, { right: 16,
            opacity: interpolate(translationX.value, [0, -50], [0, 1], Extrapolation.CLAMP),
            transform: [{ translateX: interpolate(translationX.value, [0, -50], [10, 0], Extrapolation.CLAMP) }],
          }]}>
            <Text style={[styles.hintText, { color: theme.amber }]}>←</Text>
          </Animated.View>
        </View>

      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  card: {
    width:           CARD_WIDTH,
    borderRadius:    radius.xl,
    borderWidth:     1,
    padding:         spacing.xl,
    marginHorizontal: spacing.lg,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.15,
    shadowRadius:    12,
    elevation:       8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap:           spacing.sm,
    marginBottom:  spacing.md,
  },
  badge: {
    borderRadius:      radius.full,
    borderWidth:       1,
    paddingVertical:   3,
    paddingHorizontal: spacing.md,
  },
  badgeText: {
    fontSize:    fontSize.xs,
    fontWeight:  '600',
    letterSpacing: 0.5,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  spacing.md,
  },
  scoreBarBackground: {
    flex:         1,
    height:       6,
    borderRadius: 3,
    overflow:     'hidden',
    marginRight:  spacing.md,
  },
  scoreBar: {
    height:       '100%',
    borderRadius: 3,
  },
  scoreText: {
    fontSize:   18,
    fontWeight: '700',
    width:      32,
    textAlign:  'right',
  },
  content: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize:     20,
    fontWeight:   '700',
    marginBottom: spacing.sm,
    lineHeight:   26,
  },
  thesis: {
    fontSize:   14,
    lineHeight: 22,
  },
  metrics: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderTopWidth:    1,
    borderBottomWidth: 1,
  },
  metric: {
    flex:        1,
    alignItems:  'center',
  },
  metricDivider: {
    width:  1,
    height: 32,
  },
  metricValue: {
    fontSize:   16,
    fontWeight: '700',
  },
  metricLabel: {
    fontSize:  11,
    marginTop: 2,
  },
  hintContainer: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    marginTop:      spacing.md,
    paddingHorizontal: spacing.lg,
    width:          '100%',
    position:       'relative',
  },
  hintArrow: {
    width:      24,
    alignItems: 'center',
    position:   'absolute',
  },
  hintText: {
    fontSize:   20,
    fontWeight: '700',
  },
  hintLabel: {
    fontSize:        12,
    marginHorizontal: spacing.md,
    flexShrink:      1,
    textAlign:       'center',
  },
});

export default NarrativeCard;
