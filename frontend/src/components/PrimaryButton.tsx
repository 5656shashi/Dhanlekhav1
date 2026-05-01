import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../theme/typography';
import { useTheme } from '../context/ThemeContext';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  iconName?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  variant?: 'primary' | 'outline' | 'ghost';
  disabled?: boolean;
}

export const PrimaryButton = ({
  label,
  onPress,
  style,
  textStyle,
  iconName,
  loading = false,
  variant = 'primary',
  disabled = false,
}: PrimaryButtonProps) => {
  const { theme, isDark } = useTheme();

  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';

  const bgColor = isPrimary
    ? theme.colors.accent
    : isOutline
    ? 'transparent'
    : 'transparent';

  const textColor = isPrimary
    ? isDark ? '#0A192F' : '#FFFFFF'
    : theme.colors.accent;

  const borderColor = isOutline ? theme.colors.accent : 'transparent';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.btn,
        {
          backgroundColor: bgColor,
          borderColor,
          borderWidth: isOutline ? 1.5 : 0,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.inner}>
          <Text style={[Typography.headlineMD, styles.label, { color: textColor, fontSize: 15 }, textStyle]}>
            {label}
          </Text>
          {iconName && (
            <Ionicons name={iconName} size={18} color={textColor} style={{ marginLeft: 6 }} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    textAlign: 'center',
  },
});
