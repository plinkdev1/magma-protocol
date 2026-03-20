import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RiveView, RiveViewProps, RiveViewRef } from '@rive-app/react-native';

interface RiveAnimationProps extends RiveViewProps {
  width?: number;
  height?: number;
}

export const RiveAnimation = React.forwardRef<RiveViewRef, RiveAnimationProps>(
  ({ width = 100, height = 100, style, ...rest }, ref) => {
    return (
      <View style={[styles.container, { width, height }]}>
        <RiveView
          style={[{ width, height }, style]}
          {...rest}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
