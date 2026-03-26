import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useTheme } from '../../theme/ThemeContext';

const OfflineBanner: React.FC = () => {
  const { theme } = useTheme();
  const [isOffline, setIsOffline] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const offline = !(state.isConnected && state.isInternetReachable);
      setIsOffline(offline);
      Animated.timing(slideAnim, {
        toValue: offline ? 0 : -50,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
    return () => unsubscribe();
  }, []);

  if (!isOffline) return null;

  return (
    <Animated.View style={[
      styles.banner,
      { backgroundColor: '#EF4444', transform: [{ translateY: slideAnim }] },
    ]}>
      <Text style={styles.text}>⚠️ No internet connection</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 9999,
    paddingVertical: 8,
    alignItems: 'center',
  },
  text: { color: '#fff', fontSize: 13, fontWeight: '700' },
});

export default OfflineBanner;
