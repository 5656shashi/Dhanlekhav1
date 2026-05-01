import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Image,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { GlassCard } from '../components/GlassCard';
import { Header } from '../components/Header';
import { Badge } from '../components/Badge';
import { Typography } from '../theme/typography';
import { SafeAreaView } from 'react-native-safe-area-context';

const MENU_ITEMS = [
  { id: '1', group: 'Account', items: [
    { icon: 'shield-checkmark-outline' as const, label: 'KYC Verification', screen: 'KYCVerification', badge: 'Verified' as const },
    { icon: 'card-outline' as const, label: 'Subscription Plan', screen: null, badge: 'Pro' as const },
    { icon: 'settings-outline' as const, label: 'Security Settings', screen: 'SecuritySettings', badge: null },
  ]},
  { id: '2', group: 'Assets', items: [
    { icon: 'link-outline' as const, label: 'Connected Accounts', screen: 'ConnectAccounts', badge: null },
    { icon: 'wallet-outline' as const, label: 'Blockchain Wallet', screen: 'BlockchainVerification', badge: null },
    { icon: 'document-text-outline' as const, label: 'Generate Wealth Report', screen: 'GenerateReport', badge: null },
  ]},
  { id: '3', group: 'Support', items: [
    { icon: 'help-circle-outline' as const, label: 'Help & Support', screen: null, badge: null },
    { icon: 'information-circle-outline' as const, label: 'About DhanLekha', screen: null, badge: null },
    { icon: 'log-out-outline' as const, label: 'Sign Out', screen: null, badge: null },
  ]},
];

export const ProfileScreen = ({ navigation }: any) => {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <Header title="Profile" showThemeToggle />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Profile Hero */}
        <GlassCard style={styles.heroCard} padding={20}>
          <LinearGradient
            colors={isDark ? ['rgba(100,255,218,0.08)', 'transparent'] : ['rgba(20,184,166,0.06)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.avatarRow}>
            <View style={styles.avatarWrap}>
              <View style={[styles.avatarCircle, { backgroundColor: theme.colors.accent + '20', borderColor: theme.colors.accent }]}>
                <Ionicons name="person" size={40} color={theme.colors.accent} />
              </View>
              <View style={[styles.verifiedIcon, { backgroundColor: theme.colors.accent }]}>
                <Ionicons name="checkmark" size={12} color={isDark ? '#0A192F' : '#fff'} />
              </View>
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={[Typography.headlineMD, { color: theme.colors.onSurface }]}>
                Arjun Mehta
              </Text>
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}>
                arjun.mehta@example.com
              </Text>
              <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}>
                +91 98765 43210
              </Text>
            </View>
          </View>

          {/* Badges */}
          <View style={styles.badgeRow}>
            <Badge
              label="Pro Member"
              color={theme.colors.accent}
              backgroundColor={theme.colors.accent + '15'}
              borderColor={theme.colors.accent + '30'}
              iconName="star"
            />
            <Badge
              label="KYC Verified"
              color={isDark ? '#ADC6FF' : '#6366F1'}
              backgroundColor={isDark ? 'rgba(173,198,255,0.12)' : 'rgba(99,102,241,0.1)'}
              borderColor={isDark ? 'rgba(173,198,255,0.2)' : 'rgba(99,102,241,0.2)'}
              iconName="shield-checkmark"
            />
            <Badge
              label="Blockchain Linked"
              color="#14B8A6"
              backgroundColor="rgba(20,184,166,0.1)"
              borderColor="rgba(20,184,166,0.2)"
              iconName="link"
            />
          </View>
        </GlassCard>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Documents', value: '12', icon: 'document-text-outline' as const },
            { label: 'Nominees', value: '3', icon: 'people-outline' as const },
            { label: 'Accounts', value: '4', icon: 'wallet-outline' as const },
          ].map((stat) => (
            <GlassCard key={stat.label} style={{ flex: 1 }} padding={14}>
              <View style={{ alignItems: 'center' }}>
                <Ionicons name={stat.icon} size={20} color={theme.colors.accent} />
                <Text style={[Typography.headlineMD, { color: theme.colors.onSurface, marginTop: 6, fontSize: 22 }]}>
                  {stat.value}
                </Text>
                <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}>
                  {stat.label}
                </Text>
              </View>
            </GlassCard>
          ))}
        </View>

        {/* Dark mode toggle */}
        <GlassCard style={{ marginBottom: 16 }} padding={16}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.menuIconWrap, { backgroundColor: isDark ? 'rgba(255,218,68,0.12)' : 'rgba(99,102,241,0.1)' }]}>
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
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.accent + '60' }}
              thumbColor={isDark ? theme.colors.accent : theme.colors.onSurface}
            />
          </View>
        </GlassCard>

        {/* Menu groups */}
        {MENU_ITEMS.map((group) => (
          <View key={group.id} style={{ marginBottom: 16 }}>
            <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, paddingLeft: 4 }]}>
              {group.group}
            </Text>
            <GlassCard padding={0}>
              {group.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.menuItem,
                    {
                      borderBottomWidth: idx < group.items.length - 1 ? 1 : 0,
                      borderBottomColor: theme.colors.cardBorder,
                    },
                  ]}
                  onPress={() => item.screen && navigation.navigate(item.screen)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuIconWrap, { backgroundColor: theme.colors.surfaceContainerHigh }]}>
                    <Ionicons name={item.icon} size={18} color={theme.colors.onSurfaceVariant} />
                  </View>
                  <Text style={[Typography.bodyMD, { flex: 1, color: item.label === 'Sign Out' ? '#EF4444' : theme.colors.onSurface, marginLeft: 12 }]}>
                    {item.label}
                  </Text>
                  {item.badge && (
                    <Badge
                      label={item.badge}
                      color={item.badge === 'Pro' ? theme.colors.accent : '#14B8A6'}
                      backgroundColor={item.badge === 'Pro' ? theme.colors.accent + '15' : 'rgba(20,184,166,0.1)'}
                      borderColor={item.badge === 'Pro' ? theme.colors.accent + '25' : 'rgba(20,184,166,0.2)'}
                      style={{ marginRight: 8 }}
                    />
                  )}
                  <Ionicons name="chevron-forward" size={16} color={theme.colors.onSurfaceVariant} />
                </TouchableOpacity>
              ))}
            </GlassCard>
          </View>
        ))}

        {/* Version */}
        <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textAlign: 'center', marginBottom: 16 }]}>
          DhanLekha v1.0.0 • All data end-to-end encrypted
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 100 },
  heroCard: { marginTop: 16, marginBottom: 12, overflow: 'hidden' },
  avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatarWrap: { position: 'relative' },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
