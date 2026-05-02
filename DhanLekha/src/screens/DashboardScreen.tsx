import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Dimensions, RefreshControl, Alert, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { GlassCard } from '../components/GlassCard';
import { Header } from '../components/Header';
import { LoadingView, ErrorView } from '../components/LoadingView';
import { Typography } from '../theme/typography';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApi } from '../hooks/useApi';
import { dashboardApi, securityApi } from '../services/api';
import { useSecurity } from '../context/SecurityContext';

import * as LocalAuthentication from 'expo-local-authentication';

const { width } = Dimensions.get('window');

const formatINR = (n: number, hidden: boolean) => {
  if (hidden) return '₹ ••••••';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
};

const ACTION_LABELS: Record<string, string> = {
  DOCUMENT_UPLOADED: 'Document Uploaded', DOCUMENT_DELETED: 'Document Deleted',
  NOMINEE_ADDED: 'Nominee Added', NOMINEE_UPDATED: 'Nominee Updated',
  NOMINEE_REVOKED: 'Nominee Revoked', USER_LOGGED_IN: 'Login',
  PIN_UPDATED: 'PIN Changed', SECURITY_SETTINGS_UPDATED: 'Security Updated',
  KYC_SUBMITTED: 'KYC Submitted',
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export const DashboardScreen = ({ navigation }: any) => {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [privacyActive, setPrivacyActive] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { shieldActive, toggleShield } = useSecurity();
  const { data, loading, error, refresh } = useApi(() => dashboardApi.get());

  const onRefresh = async () => {
    setRefreshing(true);
    refresh();
    setTimeout(() => setRefreshing(false), 1200);
  };

  const handleTogglePrivacy = async () => {
    if (privacyActive) {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !isEnrolled) {
          // Fallback to manual PIN if no biometrics are set up
          Alert.alert(
            'Security Required',
            'No biometric hardware or enrollment found. Please set up a passcode or FaceID on your device.',
            [{ text: 'OK' }]
          );
          return;
        }

        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Verify Identity',
          fallbackLabel: 'Use Passcode',
          disableDeviceFallback: false,
          cancelLabel: 'Cancel',
        });

        if (result.success) {
          setPrivacyActive(false);
        }
      } catch (error) {
        console.error('Auth error:', error);
        Alert.alert('Authentication Failed', 'Could not verify identity.');
      }
    } else {
      setPrivacyActive(true);
    }
  };

  const handleToggleShield = async () => {
    try {
      const active = await toggleShield();
      Alert.alert(
        active ? '🛡️ Shield Activated' : '⚠️ Shield Deactivated',
        active ? 'DhanLekha Security Layer is now protecting all API endpoints.' : 'Security Layer disabled. System is now vulnerable to anomalies.',
        [{ text: 'OK' }]
      );
    } catch (err) {
      // Error handled by context
    }
  };

  if (loading && !data) return <LoadingView message="Loading your vault..." />;
  if (error && !data) return <ErrorView message={error} onRetry={refresh} />;

  const netWorth = data?.netWorth?.total ?? 0;
  const change = data?.netWorth?.change ?? 0;
  const bd = data?.assetBreakdown;
  const stats = data?.stats;
  const activity = data?.recentActivity ?? [];

  const ASSETS = bd && netWorth > 0 ? [
    { id: '1', label: 'Stocks', value: formatINR(bd.stocks, privacyActive), pct: Math.round((bd.stocks / netWorth) * 100), icon: 'trending-up' as const, color: '#14B8A6' },
    { id: '2', label: 'Mutual Funds', value: formatINR(bd.mutualFunds, privacyActive), pct: Math.round((bd.mutualFunds / netWorth) * 100), icon: 'pie-chart' as const, color: '#6366F1' },
    { id: '3', label: 'Fixed Deposits', value: formatINR(bd.fixedDeposits, privacyActive), pct: Math.round((bd.fixedDeposits / netWorth) * 100), icon: 'business' as const, color: '#3B82F6' },
    { id: '4', label: 'Insurance', value: formatINR(bd.insurance, privacyActive), pct: Math.round((bd.insurance / netWorth) * 100), icon: 'shield' as const, color: '#8B5CF6' },
  ] : [];

  return (
    <View style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <Header title="DhanLekha" showThemeToggle rightIcon="notifications-outline" rightAction={() => navigation.navigate('Notifications')} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 20) + 120 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />}
      >
        {/* Net Worth Card */}
        <LinearGradient colors={isDark ? ['#0A192F', '#0D2241'] : ['#0A192F', '#0F2E55']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.worthCard}>
          <View style={{ flex: 1 }}>
            <Text style={[Typography.labelSM, { color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5, marginBottom: 6 }]}>TOTAL NET WORTH</Text>
            <Text style={[Typography.displayXL, { color: '#FFFFFF', fontSize: 32, marginBottom: 8 }]}>
              {formatINR(netWorth, privacyActive)}
            </Text>
            <View style={[styles.growthBadge, { backgroundColor: 'rgba(100,255,218,0.12)', borderColor: 'rgba(100,255,218,0.2)' }]}>
              <Ionicons name={change >= 0 ? 'trending-up' : 'trending-down'} size={14} color="#64FFDA" />
              <Text style={[Typography.labelSM, { color: '#64FFDA', marginLeft: 4 }]}>{change >= 0 ? '+' : ''}{change}%</Text>
            </View>
          </View>
          
          <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <TouchableOpacity 
              onPress={handleTogglePrivacy} 
              style={[styles.bigEyeBtn, { backgroundColor: privacyActive ? 'rgba(255,255,255,0.1)' : theme.colors.accent + '20' }]}
              activeOpacity={0.7}
            >
              <Ionicons name={privacyActive ? 'eye-off' : 'eye'} size={24} color={privacyActive ? 'rgba(255,255,255,0.8)' : '#64FFDA'} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleToggleShield}
              style={[styles.verifiedBadge, { backgroundColor: shieldActive ? 'rgba(100,255,218,0.1)' : 'rgba(239,68,68,0.1)', borderColor: shieldActive ? 'rgba(100,255,218,0.2)' : 'rgba(239,68,68,0.2)' }]}
              activeOpacity={0.7}
            >
              <Ionicons name={shieldActive ? 'shield-checkmark' : 'warning'} size={12} color={shieldActive ? '#64FFDA' : '#EF4444'} />
              <Text style={[Typography.labelSM, { color: shieldActive ? '#64FFDA' : '#EF4444', marginLeft: 5, fontSize: 10 }]}>
                Shield {shieldActive ? 'Active' : 'Offline'}
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Stats */}
        {stats && (
          <View style={styles.statsRow}>
            {([
              { label: 'Documents', value: stats.documents, icon: 'document-text-outline' as const, screen: 'DocumentVault' },
              { label: 'Nominees', value: stats.nominees, icon: 'people-outline' as const, screen: 'NomineeManagement' },
              { label: 'Accounts', value: stats.connectedAccounts, icon: 'wallet-outline' as const, screen: 'ConnectAccounts' },
            ] as const).map((s) => (
              <TouchableOpacity key={s.label} style={{ flex: 1 }} onPress={() => navigation.navigate(s.screen)} activeOpacity={0.75}>
                <GlassCard padding={12}>
                  <View style={{ alignItems: 'center' }}>
                    <Ionicons name={s.icon} size={18} color={theme.colors.accent} />
                    <Text style={[Typography.headlineMD, { color: theme.colors.onSurface, fontSize: 20, marginTop: 4 }]}>{s.value}</Text>
                    <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}>{s.label}</Text>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {([
            { icon: 'cloud-upload-outline' as const, label: 'Upload Doc', screen: 'AIDocumentProcessing' },
            { icon: 'person-add-outline' as const, label: 'Add Nominee', screen: 'NomineeManagement' },
            { icon: 'document-text-outline' as const, label: 'Wealth Report', screen: 'GenerateReport' },
          ] as const).map((item) => (
            <TouchableOpacity key={item.label} style={[styles.quickBtn, { backgroundColor: theme.colors.surfaceContainer, borderColor: theme.colors.cardBorder }]} onPress={() => navigation.navigate(item.screen)} activeOpacity={0.75}>
              <View style={[styles.quickIcon, { backgroundColor: isDark ? 'rgba(100,255,218,0.08)' : 'rgba(20,184,166,0.1)' }]}>
                <Ionicons name={item.icon} size={22} color={theme.colors.accent} />
              </View>
              <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 6 }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Asset Breakdown */}
        {ASSETS.length > 0 && (
          <View style={styles.section}>
            <Text style={[Typography.headlineMD, { color: theme.colors.onSurface, marginBottom: 12 }]}>Asset Breakdown</Text>
            <View style={styles.assetGrid}>
              {ASSETS.map((a) => (
                <GlassCard key={a.id} style={styles.assetCard} padding={14}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                    <View style={[styles.assetIcon, { backgroundColor: a.color + '18' }]}>
                      <Ionicons name={a.icon} size={20} color={a.color} />
                    </View>
                    <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant }]}>{a.pct}%</Text>
                  </View>
                  <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginBottom: 3 }]}>{a.label}</Text>
                  <Text style={[Typography.headlineMD, { color: theme.colors.onSurface, fontSize: 15 }]}>{a.value}</Text>
                </GlassCard>
              ))}
            </View>
          </View>
        )}

        {/* Recent Activity */}
        <View style={[styles.section, { marginBottom: 8 }]}>
          <Text style={[Typography.headlineMD, { color: theme.colors.onSurface, marginBottom: 12 }]}>Recent Activity</Text>
          <GlassCard padding={16}>
            {activity.length === 0
              ? <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, textAlign: 'center', paddingVertical: 12 }]}>No activity yet</Text>
              : activity.map((item: any, idx: number) => (
                <View key={item.id} style={[styles.activityItem, idx < activity.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.colors.cardBorder }]}>
                  <View style={[styles.activityDot, { backgroundColor: idx === 0 ? theme.colors.accent : theme.colors.surfaceContainerHigh, borderColor: idx === 0 ? theme.colors.accent : theme.colors.outlineVariant }]} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600', marginBottom: 2 }]}>{ACTION_LABELS[item.action] || item.action}</Text>
                    {item.entity && <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, fontSize: 12 }]}>{item.entity}</Text>}
                  </View>
                  <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant }]}>{timeAgo(item.createdAt)}</Text>
                </View>
              ))}
          </GlassCard>
        </View>

        {/* Security Lab Banner */}
        <TouchableOpacity onPress={() => navigation.navigate('SecurityLab')} activeOpacity={0.85}>
          <GlassCard style={{ marginBottom: 16, borderColor: 'rgba(255, 70, 70, 0.3)' }} padding={16}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.connectIcon, { backgroundColor: 'rgba(255, 70, 70, 0.1)' }]}>
                  <Ionicons name="bug-outline" size={22} color="#FF4646" />
                </View>
                <View>
                  <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600' }]}>Security Fuzz Testing</Text>
                  <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}>Stress test APIs with malformed data</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.onSurfaceVariant} />
            </View>
          </GlassCard>
        </TouchableOpacity>

        {/* Connect Accounts Banner */}
        <TouchableOpacity onPress={() => navigation.navigate('ConnectAccounts')} activeOpacity={0.85}>
          <GlassCard style={{ marginBottom: 16, borderColor: isDark ? 'rgba(100,255,218,0.15)' : 'rgba(20,184,166,0.2)' }} padding={16}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.connectIcon, { backgroundColor: isDark ? 'rgba(100,255,218,0.1)' : 'rgba(20,184,166,0.1)' }]}>
                  <MaterialIcons name="link" size={22} color={theme.colors.accent} />
                </View>
                <View>
                  <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600' }]}>Connect Financial Accounts</Text>
                  <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}>Sync HDFC, Zerodha, SBI & more</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.onSurfaceVariant} />
            </View>
          </GlassCard>
        </TouchableOpacity>

        {/* Payment History */}
        <TouchableOpacity onPress={() => navigation.navigate('PaymentHistory')} activeOpacity={0.85}>
          <GlassCard style={{ marginBottom: 16 }} padding={16}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.connectIcon, { backgroundColor: isDark ? 'rgba(173,198,255,0.08)' : 'rgba(99,102,241,0.08)' }]}>
                  <Ionicons name="receipt-outline" size={22} color={isDark ? '#ADC6FF' : '#6366F1'} />
                </View>
                <View>
                  <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600' }]}>Payment History</Text>
                  <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}>View transactions & blockchain proofs</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.onSurfaceVariant} />
            </View>
          </GlassCard>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 120 },
  worthCard: { borderRadius: 24, marginTop: 20, marginBottom: 20, padding: 24, overflow: 'hidden', flexDirection: 'row', justifyContent: 'space-between' },
  growthBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start', marginTop: 10 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(100,255,218,0.08)', borderWidth: 1, borderColor: 'rgba(100,255,218,0.15)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  bigEyeBtn: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  quickActions: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  quickBtn: { flex: 1, borderRadius: 14, borderWidth: 1, alignItems: 'center', paddingVertical: 16 },
  quickIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  section: { marginBottom: 24 },
  assetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  assetCard: { width: (width - 44) / 2 },
  assetIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  activityItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14 },
  activityDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, marginTop: 3 },
  connectIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
