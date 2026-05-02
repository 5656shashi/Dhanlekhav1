import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../theme/typography';

export const Badge = ({ label, color, backgroundColor, borderColor, iconName, style }: {
  label: string; color: string; backgroundColor: string; borderColor?: string;
  iconName?: keyof typeof Ionicons.glyphMap; style?: ViewStyle;
}) => (
  <View style={[styles.badge, { backgroundColor, borderColor: borderColor || backgroundColor }, style]}>
    {iconName && <Ionicons name={iconName} size={11} color={color} style={{ marginRight: 3 }} />}
    <Text style={[Typography.labelSM, { color }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
});
