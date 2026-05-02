import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Typography } from '../theme/typography';

export const PrimaryButton = ({ label, onPress, style, iconName, loading = false, variant = 'primary', disabled = false }: {
  label: string; onPress: () => void; style?: ViewStyle;
  iconName?: keyof typeof Ionicons.glyphMap; loading?: boolean;
  variant?: 'primary' | 'outline'; disabled?: boolean;
}) => {
  const { theme, isDark } = useTheme();
  const isPrimary = variant === 'primary';
  const bg = isPrimary ? theme.colors.accent : 'transparent';
  const textColor = isPrimary ? (isDark ? '#0D1117' : '#FFFFFF') : theme.colors.accent;
  return (
    <TouchableOpacity
      onPress={onPress} disabled={disabled || loading} activeOpacity={0.85}
      style={[styles.btn, { backgroundColor: bg, borderWidth: isPrimary ? 0 : 1.5, borderColor: theme.colors.accent, opacity: disabled ? 0.5 : 1 }, style]}
    >
      {loading ? <ActivityIndicator color={textColor} /> : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={[Typography.headlineMD, { color: textColor, fontSize: 15 }]}>{label}</Text>
          {iconName && <Ionicons name={iconName} size={18} color={textColor} />}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: { borderRadius: 999, paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
});
