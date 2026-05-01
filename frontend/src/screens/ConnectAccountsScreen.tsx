import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { GlassCard } from '../components/GlassCard';
import { Header } from '../components/Header';
import { PrimaryButton } from '../components/PrimaryButton';
import { Typography } from '../theme/typography';
import { SafeAreaView } from 'react-native-safe-area-context';

const INSTITUTIONS = [
  { id: '1', name: 'HDFC Bank', type: 'Netbanking / UPI', icon: 'business-outline' as const, color: '#1E3A5F', connected: true },
  { id: '2', name: 'Zerodha', type: 'Kite Connect', icon: 'trending-up-outline' as const, color: '#EF6C00', connected: false },
  { id: '3', name: 'Upstox', type: 'Pro API', icon: 'bar-chart-outline' as const, color: '#7B1FA2', connected: false },
  { id: '4', name: 'SBI', type: 'YONO / Netbanking', icon: 'business-outline' as const, color: '#1565C0', connected: false },
  { id: '5', name: 'Groww / CAMS', type: 'Mutual Fund Folios', icon: 'pie-chart-outline' as const, color: '#00BFA5', connected: true },
  { id: '6', name: 'ICICI Bank', type: 'Netbanking', icon: 'card-outline' as const, color: '#E65100', connected: false },
];

export const ConnectAccountsScreen = ({ navigation }: any) => {
  const { theme, isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [connected, setConnected] = useState<string[]>(['1', '5']);

  const filtered = INSTITUTIONS.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleConnect = (id: string, name: string) => {
    if (connected.includes(id)) {
      Alert.alert('Disconnect', `Disconnect ${name}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: () => setConnected(connected.filter((c) => c !== id)) },
      ]);
    } else {
      Alert.alert('Connect Account', `Connect to ${name}?\n\nWe only request read-only access.`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Connect',
          onPress: () => {
            setConnected([...connected, id]);
            Alert.alert('Success', `${name} connected successfully!`);
          },
        },
      ]);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <Header title="Connect Accounts" showBack onBack={() => navigation.goBack()} showThemeToggle />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Security Badge */}
        <View style={[styles.secBadge, { backgroundColor: isDark ? 'rgba(173,198,255,0.06)' : 'rgba(99,102,241,0.06)', borderColor: isDark ? 'rgba(173,198,255,0.15)' : 'rgba(99,102,241,0.15)' }]}>
          <Ionicons name="lock-closed" size={14} color={isDark ? '#ADC6FF' : '#6366F1'} />
          <Text style={[Typography.labelSM, { color: isDark ? '#ADC6FF' : '#6366F1', marginLeft: 6, letterSpacing: 1.2 }]}>
            256-BIT ENCRYPTED SESSION
          </Text>
        </View>

        <Text style={[Typography.headlineLG, { color: theme.colors.onSurface, marginBottom: 6 }]}>
          Connect Account
        </Text>
        <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, marginBottom: 20 }]}>
          Securely link your bank, broker, or mutual fund to automatically sync your portfolio in real-time.
        </Text>

        {/* Search */}
        <View style={[styles.searchRow, { backgroundColor: theme.colors.surfaceContainerLow, borderColor: theme.colors.outlineVariant }]}>
          <Ionicons name="search-outline" size={18} color={theme.colors.outline} />
          <TextInput
            style={[Typography.bodyMD, styles.searchInput, { color: theme.colors.onSurface }]}
            placeholder="Search for HDFC, Zerodha, Groww..."
            placeholderTextColor={theme.colors.outline}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <GlassCard style={{ flex: 1 }} padding={12}>
            <Text style={[Typography.headlineMD, { color: theme.colors.accent, fontSize: 20, textAlign: 'center' }]}>
              {connected.length}
            </Text>
            <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 2 }]}>Connected</Text>
          </GlassCard>
          <GlassCard style={{ flex: 1 }} padding={12}>
            <Text style={[Typography.headlineMD, { color: theme.colors.onSurface, fontSize: 20, textAlign: 'center' }]}>
              {INSTITUTIONS.length - connected.length}
            </Text>
            <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 2 }]}>Available</Text>
          </GlassCard>
          <GlassCard style={{ flex: 1 }} padding={12}>
            <Text style={[Typography.headlineMD, { color: '#14B8A6', fontSize: 20, textAlign: 'center' }]}>
              ₹1.2Cr
            </Text>
            <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 2 }]}>Synced</Text>
          </GlassCard>
        </View>

        {/* Institutions */}
        <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }]}>
          Popular Connections
        </Text>
        <View style={styles.grid}>
          {filtered.map((inst) => {
            const isConn = connected.includes(inst.id);
            return (
              <GlassCard
                key={inst.id}
                style={[
                  styles.instCard,
                  isConn && { borderColor: theme.colors.accent + '30' },
                ]}
                padding={16}
              >
                <View style={styles.instRow}>
                  <View style={[styles.instIcon, { backgroundColor: inst.color + '18' }]}>
                    <Ionicons name={inst.icon} size={24} color={inst.color} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600' }]}>
                      {inst.name}
                    </Text>
                    <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}>
                      {inst.type}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.connectBtn,
                      isConn
                        ? { backgroundColor: theme.colors.accent + '15', borderColor: theme.colors.accent + '30' }
                        : { backgroundColor: theme.colors.surfaceContainerHigh, borderColor: theme.colors.outlineVariant },
                    ]}
                    onPress={() => handleConnect(inst.id, inst.name)}
                  >
                    <Ionicons
                      name={isConn ? 'checkmark-circle' : 'add-circle-outline'}
                      size={16}
                      color={isConn ? theme.colors.accent : theme.colors.onSurfaceVariant}
                    />
                    <Text style={[Typography.labelSM, { color: isConn ? theme.colors.accent : theme.colors.onSurfaceVariant, marginLeft: 4, textTransform: 'uppercase' }]}>
                      {isConn ? 'Connected' : 'Connect'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>
            );
          })}
        </View>

        {/* Trust Badge */}
        <GlassCard style={{ marginTop: 4, borderColor: isDark ? 'rgba(65,228,192,0.15)' : 'rgba(20,184,166,0.2)' }} padding={16}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
            <Ionicons name="shield-checkmark" size={22} color={theme.colors.accent} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600', marginBottom: 4 }]}>
                Read-Only Access
              </Text>
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, fontSize: 13, lineHeight: 20 }]}>
                DhanLekha uses bank-grade APIs to fetch your balances and holdings. We cannot move your money, make trades, or view your full account numbers.
              </Text>
            </View>
          </View>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 100 },
  secBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 16,
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: { flex: 1, padding: 0 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  grid: { gap: 10, marginBottom: 16 },
  instCard: { borderRadius: 16 },
  instRow: { flexDirection: 'row', alignItems: 'center' },
  instIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});
