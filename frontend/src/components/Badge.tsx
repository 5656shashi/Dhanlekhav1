import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../theme/typography';

interface BadgeProps {
  label: string;
  color: string;
  backgroundColor: string;
  borderColor?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

export const Badge = ({ label, color, backgroundColor, borderColor, iconName, style }: BadgeProps) => (
  <View
    style={[
      styles.badge,
      { backgroundColor, borderColor: borderColor || backgroundColor },
      style,
    ]}
  >
    {iconName && (
      <Ionicons name={iconName} size={12} color={color} style={{ marginRight: 3 }} />
    )}
    <Text style={[Typography.labelSM, { color, textTransform: 'uppercase' }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
});
