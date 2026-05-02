import React from 'react';
import { View, ViewStyle, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export const GlassCard = ({ children, style, padding = 16 }: {
  children: React.ReactNode; style?: ViewStyle | ViewStyle[]; padding?: number;
}) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.glassBackground, borderColor: theme.colors.cardBorder, padding }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { 
    borderRadius: 16, 
    borderWidth: 1, 
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 0,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
      }
    })
  },
});
