import React from 'react';
import { View } from 'react-native';

// Stub — @rive-app/react-native pending NDK compatibility fix
interface RiveAnimationProps {
  width?: number;
  height?: number;
  [key: string]: any;
}

export const RiveAnimation = React.forwardRef<any, RiveAnimationProps>(
  ({ width = 100, height = 100 }, _ref) => {
    return <View style={{ width, height }} />;
  }
);
