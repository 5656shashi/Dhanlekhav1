import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Typography } from '../theme/typography';

export const LoadingView = ({ message = 'Loading...' }: { message?: string }) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.c, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.accent} />
      <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, marginTop: 12 }]}>{message}</Text>
    </View>
  );
};

export const ErrorView = ({ message, onRetry }: { message: string; onRetry: () => void }) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.c, { backgroundColor: theme.colors.background }]}>
      <Ionicons name="cloud-offline-outline" size={48} color={theme.colors.onSurfaceVariant} />
      <Text style={[Typography.headlineMD, { color: theme.colors.onSurface, marginTop: 16, textAlign: 'center' }]}>Something went wrong</Text>
      <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, marginTop: 6, textAlign: 'center', paddingHorizontal: 32 }]}>{message}</Text>
      <TouchableOpacity style={[styles.retry, { backgroundColor: theme.colors.accent }]} onPress={onRetry} activeOpacity={0.85}>
        <Ionicons name="refresh" size={16} color="#fff" />
        <Text style={[Typography.labelSM, { color: '#fff', marginLeft: 6, textTransform: 'uppercase' }]}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  c: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  retry: { flexDirection: 'row', alignItems: 'center', marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999 },
});
