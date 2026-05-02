import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { GlassCard } from '../components/GlassCard';
import { Header } from '../components/Header';
import { Badge } from '../components/Badge';
import { LoadingView, ErrorView } from '../components/LoadingView';
import { PaymentSheet } from '../components/PaymentSheet';
import { Typography } from '../theme/typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApi } from '../hooks/useApi';
import { accountsApi, paymentsApi } from '../services/api';

const PROVIDERS = [
  { id: 'hdfc_bank',   name: 'HDFC Bank',      type: 'Netbanking / UPI',      icon: 'business-outline' as const,      color: '#1E3A5F', accountType: 'BANK' },
  { id: 'zerodha',     name: 'Zerodha',         type: 'Kite Connect',           icon: 'trending-up-outline' as const,   color: '#EF6C00', accountType: 'BROKER' },
  { id: 'upstox',      name: 'Upstox',          type: 'Pro API',                icon: 'bar-chart-outline' as const,     color: '#7B1FA2', accountType: 'BROKER' },
  { id: 'sbi',         name: 'SBI',             type: 'YONO / Netbanking',      icon: 'business-outline' as const,      color: '#1565C0', accountType: 'BANK' },
  { id: 'groww',       name: 'Groww / CAMS',    type: 'Mutual Fund Folios',     icon: 'pie-chart-outline' as const,     color: '#00BFA5', accountType: 'MUTUAL_FUND' },
  { id: 'icici_bank',  name: 'ICICI Bank',      type: 'Netbanking',             icon: 'card-outline' as const,          color: '#E65100', accountType: 'BANK' },
  { id: 'axis_bank',   name: 'Axis Bank',       type: 'Netbanking / UPI',       icon: 'card-outline' as const,          color: '#880E4F', accountType: 'BANK' },
  { id: 'angelone',    name: 'Angel One',       type: 'Smart API',              icon: 'flash-outline' as const,         color: '#F44336', accountType: 'BROKER' },
];

const formatINR = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${n.toLocaleString('en-IN')}`;

export const ConnectAccountsScreen = ({ navigation }: any) => {
  const { theme, isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<typeof PROVIDERS[0] | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const { data: accounts, loading, error, refresh } = useApi<any[]>(() => accountsApi.list());

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [])
  );
  const onRefresh = () => { setRefreshing(true); refresh(); setTimeout(() => setRefreshing(false), 1000); };

  const connectedIds = (accounts ?? []).map((a: any) => a.provider);

  const handleConnectTap = (provider: typeof PROVIDERS[0]) => {
    const existing = (accounts ?? []).find((a: any) => a.provider === provider.id);
    if (existing) {
      Alert.alert('Disconnect', `Disconnect ${provider.name}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: async () => {
          try { await accountsApi.disconnect(existing.id); refresh(); }
          catch (e: any) { Alert.alert('Error', e.message); }
        }},
      ]);
    } else {
      setPendingProvider(provider);
      setShowPayment(true);
    }
  };

  const handlePaymentSuccess = async (transactionId: string) => {
    setShowPayment(false);
    if (!pendingProvider) return;
    // verifyPayment already connected the account and kicked off blockchain anchoring.
    // Just refresh the list.
    setTimeout(() => {
      refresh();
      Alert.alert(
        '✅ Connected!',
        pendingProvider.name + ' connected. Holdings are syncing and the integration is being anchored on Polygon blockchain.',
        [{ text: 'Great!' }]
      );
    }, 500);
    setPendingProvider(null);
  };

  const handleSync = async (accountId: string, name: string) => {
    try { await accountsApi.sync(accountId); refresh(); Alert.alert('Syncing', `${name} holdings are being updated.`); }
    catch (e: any) { Alert.alert('Error', e.message); }
  };

  if (loading && !accounts) return <LoadingView message="Loading accounts..." />;
  if (error && !accounts) return <ErrorView message={error} onRetry={refresh} />;

  const filtered = PROVIDERS.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <Header title="Connect Accounts" showBack onBack={() => navigation.goBack()} showThemeToggle />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />}
      >
        <View style={[styles.secBadge, { backgroundColor: isDark ? 'rgba(173,198,255,0.06)' : 'rgba(99,102,241,0.06)', borderColor: isDark ? 'rgba(173,198,255,0.15)' : 'rgba(99,102,241,0.15)' }]}>
          <Ionicons name="lock-closed" size={14} color={isDark ? '#ADC6FF' : '#6366F1'} />
          <Text style={[Typography.labelSM, { color: isDark ? '#ADC6FF' : '#6366F1', marginLeft: 6, letterSpacing: 1.2 }]}>256-BIT ENCRYPTED</Text>
        </View>

        <Text style={[Typography.headlineLG, { color: theme.colors.onSurface, marginBottom: 6 }]}>Connect Account</Text>
        <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, marginBottom: 20 }]}>
          Link your bank or broker. A ₹10 one-time fee applies per integration — this covers read-only portfolio sync and permanent blockchain anchoring.
        </Text>

        {/* Pricing callout */}
        <GlassCard style={{ marginBottom: 16, borderColor: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.2)' }} padding={14}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[styles.priceIcon, { backgroundColor: isDark ? 'rgba(173,198,255,0.1)' : 'rgba(99,102,241,0.1)' }]}>
              <Ionicons name="cube-outline" size={20} color={isDark ? '#ADC6FF' : '#6366F1'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600' }]}>₹10 one-time per integration</Text>
              <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 3, lineHeight: 17 }]}>
                Includes read-only sync + Polygon blockchain anchoring of your access list
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Search */}
        <View style={[styles.searchRow, { backgroundColor: theme.colors.surfaceContainerLow, borderColor: theme.colors.outlineVariant }]}>
          <Ionicons name="search-outline" size={18} color={theme.colors.outline} />
          <TextInput
            style={[Typography.bodyMD, styles.searchInput, { color: theme.colors.onSurface }]}
            placeholder="Search HDFC, Zerodha, Groww..."
            placeholderTextColor={theme.colors.outline}
            value={search} onChangeText={setSearch}
          />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <GlassCard style={{ flex: 1 }} padding={12}>
            <Text style={[Typography.headlineMD, { color: theme.colors.accent, fontSize: 20, textAlign: 'center' }]}>{connectedIds.length}</Text>
            <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 2 }]}>Connected</Text>
          </GlassCard>
          <GlassCard style={{ flex: 1 }} padding={12}>
            <Text style={[Typography.headlineMD, { color: theme.colors.onSurface, fontSize: 20, textAlign: 'center' }]}>{PROVIDERS.length - connectedIds.length}</Text>
            <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 2 }]}>Available</Text>
          </GlassCard>
        </View>

        {/* Connected with holdings */}
        {(accounts ?? []).length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }]}>Connected Accounts</Text>
            <View style={{ gap: 10 }}>
              {(accounts ?? []).map((acc: any) => {
                const prov = PROVIDERS.find(p => p.id === acc.provider);
                const holdings = acc.holdingsJson as any;
                return (
                  <GlassCard key={acc.id} padding={14} style={{ borderColor: theme.colors.accent + '20' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={[styles.instIcon, { backgroundColor: (prov?.color || '#14B8A6') + '18' }]}>
                        <Ionicons name={prov?.icon || 'wallet-outline'} size={22} color={prov?.color || '#14B8A6'} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600' }]}>{acc.providerName}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                          <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant }]}>
                            {acc.syncStatus === 'SYNCED' && holdings
                              ? formatINR((holdings.portfolioValue || 0) + (holdings.balance || 0))
                              : acc.syncStatus}
                          </Text>
                          {acc.syncStatus === 'SYNCED' && (
                            <Badge label="Blockchain Anchored" color={theme.colors.accent} backgroundColor={theme.colors.accent + '12'} borderColor={theme.colors.accent + '25'} iconName="cube-outline" />
                          )}
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[styles.syncBtn, { backgroundColor: theme.colors.accent + '15', borderColor: theme.colors.accent + '30' }]}
                        onPress={() => handleSync(acc.id, acc.providerName)}
                      >
                        <Ionicons name="refresh" size={14} color={theme.colors.accent} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.syncBtn, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)', marginLeft: 6 }]}
                        onPress={() => handleConnectTap(PROVIDERS.find(p => p.id === acc.provider) || PROVIDERS[0])}
                      >
                        <Ionicons name="trash-outline" size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </GlassCard>
                );
              })}
            </View>
          </View>
        )}

        {/* Available providers */}
        <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }]}>
          {connectedIds.length > 0 ? 'Add More' : 'Available Providers'}
        </Text>
        <View style={{ gap: 10, marginBottom: 16 }}>
          {filtered.filter(p => !connectedIds.includes(p.id)).map((inst) => (
            <GlassCard key={inst.id} style={styles.instCard} padding={16}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.instIcon, { backgroundColor: inst.color + '18' }]}>
                  <Ionicons name={inst.icon} size={24} color={inst.color} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600' }]}>{inst.name}</Text>
                  <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}>{inst.type}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.connectBtn, { backgroundColor: theme.colors.accent + '12', borderColor: theme.colors.accent + '30' }]}
                  onPress={() => handleConnectTap(inst)}
                >
                  <Ionicons name="add-circle-outline" size={15} color={theme.colors.accent} />
                  <Text style={[Typography.labelSM, { color: theme.colors.accent, marginLeft: 4, textTransform: 'uppercase' }]}>₹10</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          ))}
        </View>

        {/* Trust badge */}
        <GlassCard style={{ borderColor: isDark ? 'rgba(65,228,192,0.15)' : 'rgba(20,184,166,0.2)' }} padding={16}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
            <Ionicons name="shield-checkmark" size={22} color={theme.colors.accent} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600', marginBottom: 4 }]}>Read-Only + Blockchain Anchored</Text>
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, fontSize: 13, lineHeight: 20 }]}>
                We only fetch balances and holdings — we cannot move money or trade. Each integration is permanently recorded on Polygon with your access list.
              </Text>
            </View>
          </View>
        </GlassCard>
      </ScrollView>

      {/* Razorpay Payment Sheet */}
      <PaymentSheet
        visible={showPayment}
        purpose="API_INTEGRATION"
        onSuccess={handlePaymentSuccess}
        onCancel={() => { setShowPayment(false); setPendingProvider(null); }}
        metadata={{ provider: pendingProvider?.id || '', providerName: pendingProvider?.name || '' }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  secBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, marginTop: 16, marginBottom: 12 },
  searchRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16, gap: 8 },
  searchInput: { flex: 1, padding: 0 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  priceIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  instCard: { borderRadius: 16 },
  instIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  connectBtn: { flexDirection: 'row', alignItems: 'center', borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  syncBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
