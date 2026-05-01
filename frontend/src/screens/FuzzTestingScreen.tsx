import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { GlassCard } from '../components/GlassCard';
import { Header } from '../components/Header';
import { Typography } from '../theme/typography';
import { SafeAreaView } from 'react-native-safe-area-context';

const FUZZ_SECTIONS = [
  {
    id: 'api',
    title: 'API Integrations',
    subtitle: 'Banks, MF, Insurance',
    accentColor: '#6366F1',
    icon: 'server-outline' as const,
    fuzzLabel: 'Random inputs tested:',
    fuzzItems: [
      { icon: 'code-slash-outline' as const, label: 'Broken JSON' },
      { icon: 'cube-outline' as const,       label: 'Missing fields' },
      { icon: 'infinite-outline' as const,   label: 'Huge numbers' },
      { icon: 'person-remove-outline' as const, label: 'Invalid account IDs' },
    ],
    ensuresLabel: 'Ensures:',
    ensureItems: [
      { icon: 'shield-outline' as const,     label: 'No crashes' },
      { icon: 'document-outline' as const,   label: 'No wrong asset data' },
      { icon: 'lock-closed-outline' as const, label: 'No security leaks' },
    ],
  },
  {
    id: 'blockchain',
    title: 'Blockchain Smart Contracts',
    subtitle: 'Polygon network layer',
    accentColor: '#14B8A6',
    icon: 'git-network-outline' as const,
    fuzzLabel: 'Fuzz inputs like:',
    fuzzItems: [
      { icon: 'swap-horizontal-outline' as const, label: 'Invalid transactions' },
      { icon: 'people-outline' as const,           label: 'Edge-case nominee triggers' },
      { icon: 'bar-chart-outline' as const,        label: 'Manipulated asset values' },
    ],
    ensuresLabel: 'Ensures:',
    ensureItems: [
      { icon: 'wallet-outline' as const,     label: 'No fund misallocation' },
      { icon: 'pencil-outline' as const,     label: 'No bypass of rules' },
      { icon: 'person-outline' as const,     label: 'No contract exploits' },
    ],
  },
  {
    id: 'vault',
    title: 'User Input & Vault System',
    subtitle: 'Document & nominee layer',
    accentColor: '#8B5CF6',
    icon: 'library-outline' as const,
    fuzzLabel: 'Fuzz:',
    fuzzItems: [
      { icon: 'cloud-upload-outline' as const, label: 'Upload data' },
      { icon: 'link-outline' as const,          label: 'Asset linking' },
      { icon: 'people-circle-outline' as const, label: 'Nominee settings' },
    ],
    ensuresLabel: 'Ensures:',
    ensureItems: [
      { icon: 'settings-outline' as const,       label: "System doesn't break" },
      { icon: 'trending-up-outline' as const,    label: 'Data stays consistent' },
    ],
  },
];

export const FuzzTestingScreen = ({ navigation }: any) => {
  const { theme, isDark } = useTheme();
  const [runningId, setRunningId] = useState<string | null>(null);

  const simulateTest = (id: string, title: string) => {
    setRunningId(id);
    setTimeout(() => {
      setRunningId(null);
      Alert.alert(
        '✅ All Tests Passed',
        `Fuzz simulation for "${title}" completed.\n\n0 crashes · 0 leaks · 0 exploits detected.`,
      );
    }, 1800);
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <Header
        title="Fuzz Testing"
        showBack
        onBack={() => navigation.goBack()}
        showThemeToggle
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Title block — same pattern as SecuritySettingsScreen */}
        <View style={[styles.encryptBadge, {
          backgroundColor: isDark ? 'rgba(185,199,228,0.08)' : 'rgba(10,25,47,0.06)',
          borderColor:     isDark ? 'rgba(185,199,228,0.15)' : 'rgba(10,25,47,0.12)',
        }]}>
          <Ionicons name="shield-checkmark" size={14} color={isDark ? '#B9C7E4' : '#0A192F'} />
          <Text style={[
            Typography.labelSM,
            { color: isDark ? '#B9C7E4' : '#0A192F', marginLeft: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
          ]}>
            Security &amp; Reliability
          </Text>
        </View>

        <Text style={[Typography.headlineLG, { color: theme.colors.onSurface, marginBottom: 6 }]}>
          How DhanLekha Uses{'\n'}Fuzz Testing
        </Text>
        <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, marginBottom: 24, lineHeight: 22 }]}>
          Aggressively testing our financial APIs, blockchain contracts, and data
          pipelines by sending random and malformed inputs to detect crashes,
          security flaws, and incorrect asset data handling.
        </Text>

        {/* One GlassCard per section — mirrors SecuritySettingsScreen section layout */}
        {FUZZ_SECTIONS.map(section => {
          const isRunning = runningId === section.id;
          return (
            <GlassCard
              key={section.id}
              padding={16}
              style={[
                styles.card,
                { borderColor: isRunning ? section.accentColor + '50' : theme.colors.cardBorder },
              ]}
            >
              {/* Section header */}
              <View style={styles.sectionHeader}>
                <View style={[styles.iconWrap, { backgroundColor: section.accentColor + '18' }]}>
                  <Ionicons name={section.icon} size={20} color={section.accentColor} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '700' }]}>
                    {section.title}
                  </Text>
                  <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}>
                    {section.subtitle}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.colors.cardBorder }]} />

              {/* Fuzz inputs */}
              <Text style={[Typography.labelSM, {
                color: theme.colors.onSurfaceVariant,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                marginBottom: 8,
              }]}>
                {section.fuzzLabel}
              </Text>
              {section.fuzzItems.map(item => (
                <View key={item.label} style={styles.listRow}>
                  <View style={[styles.smallIcon, { backgroundColor: section.accentColor + '12' }]}>
                    <Ionicons name={item.icon} size={14} color={section.accentColor} />
                  </View>
                  <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, marginLeft: 10, fontSize: 13 }]}>
                    {item.label}
                  </Text>
                </View>
              ))}

              <View style={[styles.divider, { backgroundColor: theme.colors.cardBorder, marginTop: 12 }]} />

              {/* Ensures */}
              <Text style={[Typography.labelSM, {
                color: theme.colors.onSurfaceVariant,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                marginBottom: 8,
                marginTop: 4,
              }]}>
                {section.ensuresLabel}
              </Text>
              {section.ensureItems.map(item => (
                <View key={item.label} style={styles.listRow}>
                  <View style={[styles.smallIcon, { backgroundColor: '#10B98118' }]}>
                    <Ionicons name={item.icon} size={14} color="#10B981" />
                  </View>
                  <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, marginLeft: 10, fontSize: 13 }]}>
                    {item.label}
                  </Text>
                </View>
              ))}

              {/* Simulate button — same style as revokeBtn in SecuritySettingsScreen */}
              <TouchableOpacity
                style={[
                  styles.simulateBtn,
                  {
                    backgroundColor: isRunning ? section.accentColor + '20' : 'transparent',
                    borderColor:     section.accentColor + '50',
                  },
                ]}
                onPress={() => !isRunning && simulateTest(section.id, section.title)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={isRunning ? 'sync' : 'play-circle-outline'}
                  size={16}
                  color={section.accentColor}
                />
                <Text style={[
                  Typography.labelSM,
                  { color: section.accentColor, marginLeft: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
                ]}>
                  {isRunning ? 'Running test...' : 'Simulate Fuzz Test'}
                </Text>
              </TouchableOpacity>
            </GlassCard>
          );
        })}

        {/* Summary strip — mirrors encryptBadge pattern */}
        <GlassCard
          padding={14}
          style={{ borderColor: isDark ? 'rgba(100,255,218,0.15)' : 'rgba(20,184,166,0.2)' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="checkmark-done-circle" size={22} color={theme.colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600' }]}>
                All systems hardened
              </Text>
              <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}>
                Continuous fuzz runs on every deployment · 0 critical issues open
              </Text>
            </View>
          </View>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  scroll:  { paddingHorizontal: 16, paddingBottom: 100 },
  encryptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 10,
    marginBottom: 16,
  },
  card:        { marginBottom: 16, borderWidth: 1, borderRadius: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  iconWrap:    { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  smallIcon:   { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  listRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  divider:     { height: 1, marginBottom: 12 },
  simulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    marginTop: 14,
  },
});
