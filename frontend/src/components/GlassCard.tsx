import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  padding?: number;
}

export const GlassCard = ({ children, style, padding = 16 }: GlassCardProps) => {
  const { theme, isDark } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.glassBackground,
          borderColor: theme.colors.glassBorder,
          padding,
          shadowColor: theme.colors.shadowColor,
        },
        isDark ? styles.darkShadow : styles.lightShadow,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  darkShadow: {
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  lightShadow: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
});
