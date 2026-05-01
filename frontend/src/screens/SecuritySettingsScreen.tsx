import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { GlassCard } from '../components/GlassCard';
import { Header } from '../components/Header';
import { Typography } from '../theme/typography';
import { SafeAreaView } from 'react-native-safe-area-context';

export const SecuritySettingsScreen = ({ navigation }: any) => {
  const { theme, isDark } = useTheme();

  const [biometric, setBiometric] = useState(true);
  const [twoFA, setTwoFA] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [legacyShield, setLegacyShield] = useState(true);
  const [inactivityDays, setInactivityDays] = useState(180);

  const handleChangePIN = () =>
    Alert.alert('Change PIN', 'PIN change flow would open here. Enter current PIN to proceed.');

  const handleRevokeDevices = () =>
    Alert.alert('Revoke Devices', 'All other devices will be signed out. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Revoke All', style: 'destructive', onPress: () => Alert.alert('Done', 'All other devices have been signed out.') },
    ]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <Header title="Security" showBack onBack={() => navigation.goBack()} showThemeToggle />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Title */}
        <Text style={[Typography.headlineLG, { color: theme.colors.onSurface, marginTop: 16, marginBottom: 4 }]}>
          Security Settings
        </Text>
        <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, marginBottom: 6 }]}>
          Manage your account security and authentication preferences.
        </Text>
        <View style={[styles.encryptBadge, { backgroundColor: isDark ? 'rgba(185,199,228,0.08)' : 'rgba(10,25,47,0.06)', borderColor: isDark ? 'rgba(185,199,228,0.15)' : 'rgba(10,25,47,0.12)' }]}>
          <Ionicons name="shield-checkmark" size={14} color={isDark ? '#B9C7E4' : '#0A192F'} />
          <Text style={[Typography.labelSM, { color: isDark ? '#B9C7E4' : '#0A192F', marginLeft: 6, textTransform: 'uppercase', letterSpacing: 0.8 }]}>
            End-to-End Encrypted Session
          </Text>
        </View>

        {/* Authentication */}
        <View style={styles.sectionHeader}>
          <Text style={[Typography.headlineMD, { color: theme.colors.onSurface }]}>Authentication</Text>
        </View>
        <GlassCard padding={0} style={{ marginBottom: 16 }}>
          {/* Change PIN */}
          <TouchableOpacity style={[styles.settingRow, { borderBottomColor: theme.colors.cardBorder, borderBottomWidth: 1 }]} onPress={handleChangePIN}>
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
          <View style={[styles.settingRow, { borderBottomColor: theme.colors.cardBorder, borderBottomWidth: 1 }]}>
            <View style={[styles.settingIcon, { backgroundColor: biometric ? theme.colors.accent + '15' : theme.colors.surfaceContainerHigh }]}>
              <Ionicons name="finger-print" size={18} color={biometric ? theme.colors.accent : theme.colors.onSurfaceVariant} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600' }]}>Biometric Authentication</Text>
              <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}>Face ID / Fingerprint unlock</Text>
            </View>
            <Switch value={biometric} onValueChange={setBiometric} trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.accent + '60' }} thumbColor={biometric ? theme.colors.accent : theme.colors.onSurface} />
          </View>

          {/* 2FA */}
          <View style={[styles.settingRow, { borderBottomColor: theme.colors.cardBorder, borderBottomWidth: 1 }]}>
            <View style={[styles.settingIcon, { backgroundColor: twoFA ? theme.colors.accent + '15' : theme.colors.surfaceContainerHigh }]}>
              <Ionicons name="phone-portrait-outline" size={18} color={twoFA ? theme.colors.accent : theme.colors.onSurfaceVariant} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600' }]}>Two-Factor Authentication</Text>
              <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}>OTP via SMS / Authenticator app</Text>
            </View>
            <Switch value={twoFA} onValueChange={setTwoFA} trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.accent + '60' }} thumbColor={twoFA ? theme.colors.accent : theme.colors.onSurface} />
          </View>

          {/* Login Alerts */}
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: loginAlerts ? theme.colors.accent + '15' : theme.colors.surfaceContainerHigh }]}>
              <Ionicons name="notifications-outline" size={18} color={loginAlerts ? theme.colors.accent : theme.colors.onSurfaceVariant} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600' }]}>Login Alerts</Text>
              <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}>Notify on new device sign-in</Text>
            </View>
            <Switch value={loginAlerts} onValueChange={setLoginAlerts} trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.accent + '60' }} thumbColor={loginAlerts ? theme.colors.accent : theme.colors.onSurface} />
          </View>
        </GlassCard>

        {/* Legacy Shield */}
        <View style={styles.sectionHeader}>
          <Text style={[Typography.headlineMD, { color: theme.colors.onSurface }]}>Legacy Shield</Text>
        </View>
        <GlassCard padding={16} style={{ marginBottom: 16, borderColor: isDark ? 'rgba(173,198,255,0.12)' : 'rgba(99,102,241,0.12)' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600' }]}>
                Inactivity Trigger
              </Text>
              <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 4, lineHeight: 18 }]}>
                Automatically notify nominees if your account is inactive for the set period.
              </Text>
            </View>
            <Switch value={legacyShield} onValueChange={setLegacyShield} trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.accent + '60' }} thumbColor={legacyShield ? theme.colors.accent : theme.colors.onSurface} />
          </View>

          {legacyShield && (
            <View>
              <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }]}>
                Trigger After Inactivity
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[60, 90, 120, 180, 365].map((days) => (
                  <TouchableOpacity
                    key={days}
                    style={[
                      styles.dayBtn,
                      {
                        backgroundColor: inactivityDays === days ? theme.colors.accent : theme.colors.surfaceContainerHigh,
                        borderColor: inactivityDays === days ? theme.colors.accent : theme.colors.outlineVariant,
                      },
                    ]}
                    onPress={() => setInactivityDays(days)}
                  >
                    <Text style={[Typography.labelSM, { color: inactivityDays === days ? (isDark ? '#0A192F' : '#fff') : theme.colors.onSurfaceVariant, fontSize: 10 }]}>
                      {days}d
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </GlassCard>

        {/* Devices */}
        <View style={styles.sectionHeader}>
          <Text style={[Typography.headlineMD, { color: theme.colors.onSurface }]}>Trusted Devices</Text>
        </View>
        <GlassCard padding={16} style={{ marginBottom: 16 }}>
          {[
            { name: 'iPhone 14 Pro', lastUsed: 'Active now', icon: 'phone-portrait-outline' as const, current: true },
            { name: 'iPad Air', lastUsed: '3 days ago', icon: 'tablet-portrait-outline' as const, current: false },
          ].map((device, idx) => (
            <View
              key={device.name}
              style={[styles.deviceRow, idx > 0 && { borderTopWidth: 1, borderTopColor: theme.colors.cardBorder }]}
            >
              <View style={[styles.settingIcon, { backgroundColor: device.current ? theme.colors.accent + '15' : theme.colors.surfaceContainerHigh }]}>
                <Ionicons name={device.icon} size={18} color={device.current ? theme.colors.accent : theme.colors.onSurfaceVariant} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600' }]}>{device.name}</Text>
                <Text style={[Typography.labelSM, { color: device.current ? theme.colors.accent : theme.colors.onSurfaceVariant, marginTop: 2 }]}>
                  {device.lastUsed}
                </Text>
              </View>
              {!device.current && (
                <TouchableOpacity onPress={() => Alert.alert('Remove Device', `Remove ${device.name}?`)}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity
            style={[styles.revokeBtn, { borderColor: '#EF444440' }]}
            onPress={handleRevokeDevices}
          >
            <Ionicons name="shield-outline" size={16} color="#EF4444" />
            <Text style={[Typography.labelSM, { color: '#EF4444', marginLeft: 6, textTransform: 'uppercase', letterSpacing: 0.8 }]}>
              Revoke All Other Devices
            </Text>
          </TouchableOpacity>
        </GlassCard>

        {/* Security & Reliability */}
        <View style={styles.sectionHeader}>
          <Text style={[Typography.headlineMD, { color: theme.colors.onSurface }]}>Security &amp; Reliability</Text>
        </View>
        <GlassCard padding={0} style={{ marginBottom: 16 }}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('FuzzTesting')}
          >
            <View style={[styles.settingIcon, { backgroundColor: theme.colors.accent + '15' }]}>
              <Ionicons name="bug-outline" size={18} color={theme.colors.accent} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600' }]}>
                Fuzz Testing
              </Text>
              <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}>
                APIs · Blockchain · Vault system hardening
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 100 },
  encryptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 10,
    marginBottom: 20,
  },
  sectionHeader: { marginBottom: 10 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  revokeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    marginTop: 12,
  },
});
