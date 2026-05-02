import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Switch, Alert, RefreshControl, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/GlassCard';
import { Header } from '../components/Header';
import { Badge } from '../components/Badge';
import { Typography } from '../theme/typography';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApi } from '../hooks/useApi';
import { authApi } from '../services/api';

export const ProfileScreen = ({ navigation }: any) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, logout, refreshUser } = useAuth();

  const { data: profile, loading, refresh: refreshProfile } = useApi(() => authApi.getMe());
  const [refreshing, setRefreshing] = React.useState(false);

  useFocusEffect(
    React.useCallback(() => {
      refreshProfile();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  const me = profile || user;

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const MENU = [
    { group: 'Account', items: [
      { icon: 'shield-checkmark-outline' as const, label: 'KYC Verification', screen: 'KYCVerification', badge: me?.kycStatus === 'VERIFIED' ? 'Verified' : me?.kycStatus === 'SUBMITTED' ? 'Pending' : null },
      { icon: 'card-outline' as const, label: 'Subscription Plan', screen: null, badge: me?.plan === 'PRO' ? 'Pro' : 'Free' },
      { icon: 'settings-outline' as const, label: 'Security Settings', screen: 'SecuritySettings', badge: null },
      { icon: 'shield-half-outline' as const, label: 'Security Lab', screen: 'SecurityLab', badge: 'BETA' },
    ]},
    { group: 'Assets', items: [
      { icon: 'link-outline' as const, label: 'Connected Accounts', screen: 'ConnectAccounts', badge: null },
      { icon: 'cube-outline' as const, label: 'Blockchain Verification', screen: 'BlockchainVerification', badge: null },
      { icon: 'document-text-outline' as const, label: 'Generate Wealth Report', screen: 'GenerateReport', badge: null },
      { icon: 'receipt-outline' as const, label: 'Payment History', screen: 'PaymentHistory', badge: null },
    ]},
    { group: 'Support', items: [
      { icon: 'help-circle-outline' as const, label: 'Help & Support', screen: null, badge: null },
      { icon: 'information-circle-outline' as const, label: 'About DhanLekha', screen: null, badge: null },
    ]},
  ];

  return (
    <View style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <Header title="Profile" showThemeToggle />
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 20) + 120 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />}
      >

        {/* Hero */}
        <GlassCard style={styles.heroCard} padding={20}>
          <LinearGradient colors={isDark ? ['rgba(100,255,218,0.08)', 'transparent'] : ['rgba(20,184,166,0.06)', 'transparent']} style={StyleSheet.absoluteFill} />
          <View style={styles.avatarRow}>
            <View style={styles.avatarWrap}>
              <View style={[styles.avatarCircle, { backgroundColor: theme.colors.accent + '20', borderColor: theme.colors.accent }]}>
                <Text style={[Typography.displayXL, { color: theme.colors.accent, fontSize: 28 }]}>
                  {me?.name ? me.name.charAt(0).toUpperCase() : (me?.phone?.slice(-2) ?? '?')}
                </Text>
              </View>
              {me?.kycStatus === 'VERIFIED' && (
                <View style={[styles.verifiedIcon, { backgroundColor: theme.colors.accent }]}>
                  <Ionicons name="checkmark" size={12} color={isDark ? '#0A192F' : '#fff'} />
                </View>
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={[Typography.headlineMD, { color: theme.colors.onSurface }]}>
                {me?.name || 'Your Name'}
              </Text>
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}>
                {me?.email || me?.phone || ''}
              </Text>
              {me?.phone && me?.email && (
                <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}>{me.phone}</Text>
              )}
            </View>
          </View>
          <View style={styles.badgeRow}>
            <Badge label={me?.plan === 'PRO' ? 'Pro Member' : 'Free'} color={theme.colors.accent} backgroundColor={theme.colors.accent + '15'} borderColor={theme.colors.accent + '30'} iconName="star" />
            {me?.kycStatus === 'VERIFIED' && (
              <Badge label="KYC Verified" color={isDark ? '#ADC6FF' : '#6366F1'} backgroundColor={isDark ? 'rgba(173,198,255,0.12)' : 'rgba(99,102,241,0.1)'} borderColor={isDark ? 'rgba(173,198,255,0.2)' : 'rgba(99,102,241,0.2)'} iconName="shield-checkmark" />
            )}
          </View>
        </GlassCard>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Documents', value: me?._count?.documents ?? '--', icon: 'document-text-outline' as const },
            { label: 'Nominees', value: me?._count?.nominees ?? '--', icon: 'people-outline' as const },
            { label: 'Accounts', value: me?._count?.connectedAccounts ?? '--', icon: 'wallet-outline' as const },
          ].map((s) => (
            <GlassCard key={s.label} style={{ flex: 1 }} padding={14}>
              <View style={{ alignItems: 'center' }}>
                <Ionicons name={s.icon} size={20} color={theme.colors.accent} />
                <Text style={[Typography.headlineMD, { color: theme.colors.onSurface, marginTop: 6, fontSize: 22 }]}>{s.value}</Text>
                <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}>{s.label}</Text>
              </View>
            </GlassCard>
          ))}
        </View>

        {/* Dark Mode */}
        <GlassCard style={{ marginBottom: 16 }} padding={16}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.menuIcon, { backgroundColor: isDark ? 'rgba(255,218,68,0.12)' : 'rgba(99,102,241,0.1)' }]}>
                <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color={isDark ? '#FFD844' : '#6366F1'} />
              </View>
              <View>
                <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600' }]}>
                  {isDark ? 'Light Mode' : 'Dark Mode'}
                </Text>
                <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}>
                  Currently: {isDark ? 'Dark' : 'Light'}
                </Text>
              </View>
            </View>
            <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.accent + '60' }} thumbColor={isDark ? theme.colors.accent : theme.colors.onSurface} />
          </View>
        </GlassCard>

        {/* Menu Groups */}
        {MENU.map((group) => (
          <View key={group.group} style={{ marginBottom: 16 }}>
            <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, paddingLeft: 4 }]}>{group.group}</Text>
            <GlassCard padding={0}>
              {group.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.menuItem, { borderBottomWidth: idx < group.items.length - 1 ? 1 : 0, borderBottomColor: theme.colors.cardBorder }]}
                  onPress={() => item.screen && navigation.navigate(item.screen)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuIcon, { backgroundColor: theme.colors.surfaceContainerHigh }]}>
                    <Ionicons name={item.icon} size={18} color={theme.colors.onSurfaceVariant} />
                  </View>
                  <Text style={[Typography.bodyMD, { flex: 1, color: theme.colors.onSurface, marginLeft: 12 }]}>{item.label}</Text>
                  {item.badge && (
                    <Badge label={item.badge} color={theme.colors.accent} backgroundColor={theme.colors.accent + '15'} borderColor={theme.colors.accent + '25'} style={{ marginRight: 8 }} />
                  )}
                  <Ionicons name="chevron-forward" size={16} color={theme.colors.onSurfaceVariant} />
                </TouchableOpacity>
              ))}
            </GlassCard>
          </View>
        ))}

        {/* Sign Out */}
        <TouchableOpacity style={[styles.signOutBtn, { borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.06)' }]} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={[Typography.bodyMD, { color: '#EF4444', marginLeft: 10, fontWeight: '600' }]}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8, marginBottom: 16 }]}>
          DhanLekha v1.0.0 • All data end-to-end encrypted
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 120 },
  heroCard: { marginTop: 20, marginBottom: 16, overflow: 'hidden' },
  avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatarWrap: { position: 'relative' },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  verifiedIcon: { position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, paddingVertical: 16, marginBottom: 16 },
});
