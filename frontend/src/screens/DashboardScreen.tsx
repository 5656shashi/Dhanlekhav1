import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { GlassCard } from '../components/GlassCard';
import { Header } from '../components/Header';
import { Typography } from '../theme/typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { getDashboardData, DashboardData } from '../api/services/dashboard.service';

const { width } = Dimensions.get('window');

const INITIAL_ASSETS = [
  { id: '1', label: 'Stocks', value: '₹56,02,500', percent: '45%', icon: 'trending-up' as const, color: '#14B8A6' },
  { id: '2', label: 'Mutual Funds', value: '₹37,35,000', percent: '30%', icon: 'pie-chart' as const, color: '#6366F1' },
  { id: '3', label: 'Fixed Deposits', value: '₹18,67,500', percent: '15%', icon: 'business' as const, color: '#3B82F6' },
  { id: '4', label: 'Insurance', value: '₹12,45,000', percent: '10%', icon: 'shield' as const, color: '#8B5CF6' },
];

const INITIAL_ACTIVITY = [
  { id: '1', title: 'Nominee Added', desc: 'Rohan Sharma added to HDFC Life Insurance.', time: '2 hrs ago', active: true },
  { id: '2', title: 'Document Uploaded', desc: 'Property deed linked to Vault.', time: 'Yesterday', active: false },
  { id: '3', title: 'Smart Contract Executed', desc: 'Quarterly asset verification completed.', time: 'Oct 12', active: false },
];

export const DashboardScreen = ({ navigation }: any) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const [balanceVisible, setBalanceVisible] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const data = await getDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    }
  };

  const assets = dashboardData?.assets || INITIAL_ASSETS;
  const activity = dashboardData?.recentActivity || INITIAL_ACTIVITY;
  const totalNetWorth = dashboardData?.totalNetWorth || '₹1,24,50,000';
  const growth = dashboardData?.growth || '+12.5%';
  const isVerified = dashboardData?.isVerified ?? true;

  const handleToggleBalance = async () => {
    if (balanceVisible) {
      setBalanceVisible(false);
      return;
    }

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    // Type 2 is Facial Recognition (Face ID)
    const hasFaceID = supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);

    if (hasHardware && isEnrolled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate with Face ID to view net worth',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        setBalanceVisible(true);
      } else {
        console.log('Auth failed:', result.error);
      }
    } else {
      // If biometrics aren't available or enrolled, show balance directly for now
      // so the user isn't blocked, but log the issue.
      console.log('Biometrics not available:', { hasHardware, isEnrolled, supportedTypes });
      setBalanceVisible(true);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <Header
        title="DhanLekha"
        showThemeToggle
        rightIcon="notifications-outline"
        rightAction={() => {}}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Net Worth Card */}
        <LinearGradient
          colors={isDark ? ['#0A192F', '#0D2241'] : ['#0A192F', '#0F2E55']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.worthCard}
        >
          <View style={styles.worthInner}>
            <Text style={[Typography.labelSM, { color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5, marginBottom: 6 }]}>
              TOTAL NET WORTH
            </Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[Typography.displayXL, { color: '#FFFFFF', fontSize: 30 }]}>
                {balanceVisible ? totalNetWorth : '₹ ••••••'}
              </Text>
              <TouchableOpacity onPress={handleToggleBalance} style={{ padding: 5 }}>
                <Ionicons name={balanceVisible ? 'eye-outline' : 'eye-off-outline'} size={24} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <View style={[styles.growthBadge, { marginTop: 0, backgroundColor: 'rgba(100,255,218,0.12)', borderColor: 'rgba(100,255,218,0.2)' }]}>
                <Ionicons name="trending-up" size={14} color="#64FFDA" />
                <Text style={[Typography.labelSM, { color: '#64FFDA', marginLeft: 4 }]}>{growth}</Text>
              </View>
              {isVerified && (
                <View style={[styles.verifiedBadge, { marginTop: 0 }]}>
                  <Ionicons name="shield-checkmark" size={14} color="#64FFDA" />
                  <Text style={[Typography.labelSM, { color: '#64FFDA', marginLeft: 5 }]}>
                    Blockchain Verified
                  </Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {[
            { icon: 'cloud-upload-outline' as const, label: 'Upload Doc', screen: 'DocumentVault' },
            { icon: 'person-add-outline' as const, label: 'Add Nominee', screen: 'NomineeManagement' },
            { icon: 'document-text-outline' as const, label: 'Gen. Proof', screen: 'GenerateReport' },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.quickBtn, { backgroundColor: theme.colors.surfaceContainer, borderColor: theme.colors.cardBorder }]}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.75}
            >
              <View style={[styles.quickIcon, { backgroundColor: isDark ? 'rgba(100,255,218,0.08)' : 'rgba(20,184,166,0.1)' }]}>
                <Ionicons name={item.icon} size={22} color={theme.colors.accent} />
              </View>
              <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 6 }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Asset Breakdown */}
        <View style={styles.section}>
          <Text style={[Typography.headlineMD, { color: theme.colors.onSurface, marginBottom: 12 }]}>
            Asset Breakdown
          </Text>
          <View style={styles.assetGrid}>
            {assets.map((asset) => (
              <GlassCard key={asset.id} style={styles.assetCard} padding={14}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <View style={[styles.assetIcon, { backgroundColor: asset.color + '18' }]}>
                    <Ionicons name={asset.icon as any} size={20} color={asset.color} />
                  </View>
                  <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant }]}>
                    {asset.percent}
                  </Text>
                </View>
                <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginBottom: 3 }]}>
                  {asset.label}
                </Text>
                <Text style={[Typography.headlineMD, { color: theme.colors.onSurface, fontSize: 16 }]}>
                  {balanceVisible ? asset.value : '₹ ••••••'}
                </Text>
              </GlassCard>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={[styles.section, { marginBottom: 8 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={[Typography.headlineMD, { color: theme.colors.onSurface }]}>
              Recent Activity
            </Text>
            <TouchableOpacity>
              <Text style={[Typography.labelSM, { color: theme.colors.accent, textTransform: 'uppercase' }]}>
                View All
              </Text>
            </TouchableOpacity>
          </View>
          <GlassCard padding={16}>
            {activity.map((item, idx) => (
              <View key={item.id} style={[styles.activityItem, idx < activity.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.colors.cardBorder }]}>
                <View style={styles.activityDotCol}>
                  <View style={[styles.activityDot, { backgroundColor: item.active ? theme.colors.accent : theme.colors.surfaceContainerHigh, borderColor: item.active ? theme.colors.accent : theme.colors.outlineVariant }]} />
                  {idx < activity.length - 1 && (
                    <View style={[styles.activityLine, { backgroundColor: theme.colors.cardBorder }]} />
                  )}
                </View>
                <View style={styles.activityContent}>
                  <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600', marginBottom: 2 }]}>
                    {item.title}
                  </Text>
                  <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, fontSize: 12 }]}>
                    {item.desc}
                  </Text>
                </View>
                <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant }]}>
                  {item.time}
                </Text>
              </View>
            ))}
          </GlassCard>
        </View>

        {/* Connect Accounts Banner */}
        <TouchableOpacity
          onPress={() => navigation.navigate('ConnectAccounts')}
          activeOpacity={0.85}
        >
          <GlassCard style={{ marginBottom: 16, borderColor: isDark ? 'rgba(100,255,218,0.15)' : 'rgba(20,184,166,0.2)' }} padding={16}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.connectIcon, { backgroundColor: isDark ? 'rgba(100,255,218,0.1)' : 'rgba(20,184,166,0.1)' }]}>
                  <MaterialIcons name="link" size={22} color={theme.colors.accent} />
                </View>
                <View>
                  <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600' }]}>
                    Connect Financial Accounts
                  </Text>
                  <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}>
                    Sync HDFC, Zerodha, SBI & more
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.onSurfaceVariant} />
            </View>
          </GlassCard>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 100 },
  worthCard: {
    borderRadius: 20,
    marginTop: 16,
    marginBottom: 16,
    padding: 20,
    overflow: 'hidden',
  },
  worthInner: {
    width: '100%',
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(100,255,218,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(100,255,218,0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  quickBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { marginBottom: 20 },
  assetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  assetCard: {
    width: (width - 42) / 2,
  },
  assetIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    gap: 10,
  },
  activityDotCol: {
    alignItems: 'center',
    width: 14,
    marginTop: 3,
  },
  activityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  activityLine: {
    width: 1,
    flex: 1,
    marginTop: 4,
    minHeight: 30,
  },
  activityContent: {
    flex: 1,
  },
  connectIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
