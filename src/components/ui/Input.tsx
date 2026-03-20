import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { radius, spacing, fontSize } from '../../theme/tokens';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, containerStyle, style, ...rest }: InputProps) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      )}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.cardBg,
            borderColor:     focused ? theme.borderActive : (error ? theme.red : theme.borderSubtle),
            color:           theme.textPrimary,
          },
          style,
        ]}
        placeholderTextColor={theme.textTertiary}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...rest}
      />
      {error && (
        <Text style={[styles.error, { color: theme.red }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    fontSize:   fontSize.sm,
    fontWeight: '500',
  },
  input: {
    borderRadius:      radius.md,
    borderWidth:       1,
    paddingVertical:   spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize:          fontSize.md,
  },
  error: {
    fontSize: fontSize.xs,
  },
});
