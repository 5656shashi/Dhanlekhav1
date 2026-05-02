import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Switch, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { GlassCard } from '../components/GlassCard';
import { Header } from '../components/Header';
import { PrimaryButton } from '../components/PrimaryButton';
import { LoadingView, ErrorView } from '../components/LoadingView';
import { Typography } from '../theme/typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApi } from '../hooks/useApi';
import { securityApi, authApi } from '../services/api';

const INACTIVITY_OPTIONS = [60, 90, 120, 180, 365];

export const SecuritySettingsScreen = ({ navigation }: any) => {
  const { theme, isDark } = useTheme();
  const [saving, setSaving] = useState(false);

  const { data, loading, error, refresh } = useApi(() => securityApi.getSettings());

  const [biometric, setBiometric] = useState(true);
  const [deadMan, setDeadMan] = useState(true);
  const [deadManDays, setDeadManDays] = useState(180);

  // Sync state from API
  useEffect(() => {
    if (data) {
      setBiometric(data.biometricEnabled ?? true);
      setDeadMan(data.deadManEnabled ?? true);
      setDeadManDays(data.deadManDays ?? 180);
    }
  }, [data]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await securityApi.updateSettings({ biometricEnabled: biometric, deadManEnabled: deadMan, deadManDays });
      Alert.alert('Saved', 'Security settings updated.');
      refresh();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeAll = () => {
    Alert.alert('Revoke All Sessions', 'Sign out of all other devices?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Revoke All', style: 'destructive', onPress: async () => {
        try {
          await securityApi.revokeAllSessions();
          Alert.alert('Done', 'All other sessions have been revoked.');
          refresh();
        } catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  if (loading && !data) return <LoadingView message="Loading security settings..." />;
  if (error && !data) return <ErrorView message={error} onRetry={refresh} />;

  const sessions = data?.activeSessions ?? [];

  return (
    <View style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <Header title="Security" showBack onBack={() => navigation.goBack()} showThemeToggle />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <Text style={[Typography.headlineLG, { color: theme.colors.onSurface, marginTop: 16, marginBottom: 4 }]}>Security Settings</Text>
        <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, marginBottom: 6 }]}>Manage authentication and vault protection preferences.</Text>
        <View style={[styles.encBadge, { backgroundColor: isDark ? 'rgba(185,199,228,0.08)' : 'rgba(10,25,47,0.06)', borderColor: isDark ? 'rgba(185,199,228,0.15)' : 'rgba(10,25,47,0.12)' }]}>
          <Ionicons name="shield-checkmark" size={14} color={isDark ? '#B9C7E4' : '#0A192F'} />
          <Text style={[Typography.labelSM, { color: isDark ? '#B9C7E4' : '#0A192F', marginLeft: 6, textTransform: 'uppercase', letterSpacing: 0.8 }]}>End-to-End Encrypted Session</Text>
        </View>

        {/* Authentication */}
        <Text style={[Typography.headlineMD, { color: theme.colors.onSurface, marginTop: 20, marginBottom: 10 }]}>Authentication</Text>
        <GlassCard padding={0} style={{ marginBottom: 16 }}>
          {/* Change PIN */}
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomWidth: 1, borderBottomColor: theme.colors.cardBorder }]}
            onPress={() => Alert.alert('Change PIN', 'Enter your current PIN in the app to set a new one.')}
          >
            <View style={[styles.settingIcon, { backgroundColor: theme.colors.surfaceContainerHigh }]}>
              <Ionicons name="keypad-outline" size={18} color={theme.colors.onSurfaceVariant} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600' }]}>Change PIN</Text>
              <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}>Update your 6-digit access code</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>

          {/* Biometric */}
          <View style={[styles.settingRow, { borderBottomWidth: 1, borderBottomColor: theme.colors.cardBorder }]}>
            <View style={[styles.settingIcon, { backgroundColor: biometric ? theme.colors.accent + '15' : theme.colors.surfaceContainerHigh }]}>
              <Ionicons name="finger-print" size={18} color={biometric ? theme.colors.accent : theme.colors.onSurfaceVariant} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600' }]}>Biometric Authentication</Text>
              <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}>Face ID / Fingerprint unlock</Text>
            </View>
            <Switch value={biometric} onValueChange={setBiometric} trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.accent + '60' }} thumbColor={biometric ? theme.colors.accent : theme.colors.onSurface} />
          </View>

          {/* 2FA Toggle */}
          <View style={[styles.settingRow, { borderBottomWidth: 1, borderBottomColor: theme.colors.cardBorder }]}>
            <View style={[styles.settingIcon, { backgroundColor: theme.colors.surfaceContainerHigh }]}>
              <Ionicons name="phone-portrait-outline" size={18} color={theme.colors.onSurfaceVariant} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600' }]}>Two-Factor Authentication</Text>
              <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}>
                {data?.twoFAEnabled ? 'Enabled — OTP required on each login' : 'Disabled — only PIN required'}
              </Text>
            </View>
            <Switch
              value={data?.twoFAEnabled ?? false}
              onValueChange={async (v) => {
                try {
                  await securityApi.updateSettings({ twoFAEnabled: v } as any);
                  refresh();
                } catch (e: any) { Alert.alert('Error', e.message); }
              }}
              trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.accent + '60' }}
              thumbColor={data?.twoFAEnabled ? theme.colors.accent : theme.colors.onSurface}
            />
          </View>
        </GlassCard>

        {/* Legacy Switch */}
        <Text style={[Typography.headlineMD, { color: theme.colors.onSurface, marginBottom: 10 }]}>Legacy Switch</Text>
        <GlassCard padding={16} style={{ marginBottom: 16, borderColor: isDark ? 'rgba(173,198,255,0.12)' : 'rgba(99,102,241,0.12)' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600' }]}>Inactivity Trigger</Text>
              <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 4, lineHeight: 18 }]}>
                Automatically notify nominees if your account is inactive for the set period.
              </Text>
            </View>
            <Switch value={deadMan} onValueChange={setDeadMan} trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.accent + '60' }} thumbColor={deadMan ? theme.colors.accent : theme.colors.onSurface} />
          </View>
          {deadMan && (
            <View>
              <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }]}>Trigger After</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {INACTIVITY_OPTIONS.map((days) => (
                  <TouchableOpacity key={days}
                    style={[styles.dayBtn, { backgroundColor: deadManDays === days ? theme.colors.accent : theme.colors.surfaceContainerHigh, borderColor: deadManDays === days ? theme.colors.accent : theme.colors.outlineVariant }]}
                    onPress={() => setDeadManDays(days)}
                  >
                    <Text style={[Typography.labelSM, { color: deadManDays === days ? (isDark ? '#0A192F' : '#fff') : theme.colors.onSurfaceVariant, fontSize: 10 }]}>
                      {days >= 365 ? '1yr' : `${days}d`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </GlassCard>

        {/* Active Sessions */}
        <Text style={[Typography.headlineMD, { color: theme.colors.onSurface, marginBottom: 10 }]}>Active Sessions</Text>
        <GlassCard padding={16} style={{ marginBottom: 16 }}>
          {sessions.length === 0 && (
            <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, textAlign: 'center', paddingVertical: 8 }]}>No active sessions</Text>
          )}
          {sessions.slice(0, 5).map((s: any, idx: number) => (
            <View key={s.id} style={[styles.sessionRow, idx > 0 && { borderTopWidth: 1, borderTopColor: theme.colors.cardBorder }]}>
              <View style={[styles.settingIcon, { backgroundColor: idx === 0 ? theme.colors.accent + '15' : theme.colors.surfaceContainerHigh }]}>
                <Ionicons name="phone-portrait-outline" size={18} color={idx === 0 ? theme.colors.accent : theme.colors.onSurfaceVariant} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600' }]}>
                  {s.userAgent ? s.userAgent.slice(0, 30) + '...' : 'Unknown Device'}
                </Text>
                <Text style={[Typography.labelSM, { color: idx === 0 ? theme.colors.accent : theme.colors.onSurfaceVariant, marginTop: 2 }]}>
                  {idx === 0 ? 'Current session' : `IP: ${s.ipAddress || 'Unknown'}`}
                </Text>
              </View>
            </View>
          ))}
          <TouchableOpacity style={[styles.revokeBtn, { borderColor: 'rgba(239,68,68,0.3)' }]} onPress={handleRevokeAll}>
            <Ionicons name="shield-outline" size={16} color="#EF4444" />
            <Text style={[Typography.labelSM, { color: '#EF4444', marginLeft: 6, textTransform: 'uppercase', letterSpacing: 0.8 }]}>Revoke All Other Sessions</Text>
          </TouchableOpacity>
        </GlassCard>

        <PrimaryButton label={saving ? 'Saving...' : 'Save Settings'} onPress={handleSave} loading={saving} iconName="checkmark" style={{ marginBottom: 20 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  encBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, marginTop: 10, marginBottom: 0 },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  settingIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dayBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  sessionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  revokeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, paddingVertical: 10, marginTop: 12 },
});
