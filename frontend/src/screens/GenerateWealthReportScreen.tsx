import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { GlassCard } from '../components/GlassCard';
import { Header } from '../components/Header';
import { PrimaryButton } from '../components/PrimaryButton';
import { Badge } from '../components/Badge';
import { Typography } from '../theme/typography';
import { SafeAreaView } from 'react-native-safe-area-context';

const ASSET_SECTIONS = [
  {
    id: '1',
    title: 'Real Estate',
    icon: 'home-outline' as const,
    color: '#14B8A6',
    items: [
      { id: 'r1', name: '2BHK Flat, Bandra West, Mumbai', value: '₹1,20,00,000', checked: true },
      { id: 'r2', name: 'Plot, Lonavala', value: '₹45,00,000', checked: false },
    ],
  },
  {
    id: '2',
    title: 'Bank Accounts & FDs',
    icon: 'wallet-outline' as const,
    color: '#6366F1',
    items: [
      { id: 'b1', name: 'HDFC Savings Account', value: '₹8,42,500', checked: true },
      { id: 'b2', name: 'HDFC Fixed Deposit', value: '₹25,00,000', checked: true },
    ],
  },
  {
    id: '3',
    title: 'Investments',
    icon: 'trending-up-outline' as const,
    color: '#3B82F6',
    items: [
      { id: 'i1', name: 'Zerodha Demat Portfolio', value: '₹56,02,500', checked: true },
      { id: 'i2', name: 'Groww Mutual Funds', value: '₹37,35,000', checked: false },
    ],
  },
  {
    id: '4',
    title: 'Insurance',
    icon: 'shield-outline' as const,
    color: '#8B5CF6',
    items: [
      { id: 'in1', name: 'HDFC Term Life (₹1Cr cover)', value: '₹12,45,000', checked: true },
    ],
  },
];

export const GenerateWealthReportScreen = ({ navigation }: any) => {
  const { theme, isDark } = useTheme();
  const [sections, setSections] = useState(ASSET_SECTIONS);
  const [expiryDays, setExpiryDays] = useState(30);
  const [includeNetworth, setIncludeNetworth] = useState(true);
  const [generating, setGenerating] = useState(false);

  const toggleItem = (sectionId: string, itemId: string) => {
    setSections(sections.map((s) =>
      s.id === sectionId
        ? { ...s, items: s.items.map((i) => i.id === itemId ? { ...i, checked: !i.checked } : i) }
        : s
    ));
  };

  const selectAllSection = (sectionId: string) => {
    setSections(sections.map((s) =>
      s.id === sectionId
        ? { ...s, items: s.items.map((i) => ({ ...i, checked: true })) }
        : s
    ));
  };

  const selectedCount = sections.reduce((acc, s) => acc + s.items.filter((i) => i.checked).length, 0);
  const totalItems = sections.reduce((acc, s) => acc + s.items.length, 0);

  const handleGenerate = () => {
    if (selectedCount === 0) {
      Alert.alert('Select Assets', 'Please select at least one asset to include.');
      return;
    }
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      Alert.alert(
        '✅ Report Generated',
        `Your wealth report has been generated and secured with blockchain verification.\n\nShare link: dlekha.app/report/AB4C8D\n\nExpires in ${expiryDays} days.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }, 2000);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <Header title="Wealth Report" showBack onBack={() => navigation.goBack()} showThemeToggle />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Security badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 6 }}>
          <Ionicons name="shield-checkmark" size={14} color={theme.colors.accent} />
          <Text style={[Typography.labelSM, { color: theme.colors.accent, textTransform: 'uppercase', letterSpacing: 1 }]}>
            End-to-End Encrypted
          </Text>
        </View>
        <Text style={[Typography.headlineLG, { color: theme.colors.onSurface, marginBottom: 4 }]}>
          Generate Wealth Report
        </Text>
        <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, marginBottom: 20 }]}>
          Create a verified, secure snapshot of your assets for loan applications, visa processing, or financial planning.
        </Text>

        {/* Selection summary */}
        <GlassCard style={{ marginBottom: 16, borderColor: selectedCount > 0 ? theme.colors.accent + '30' : theme.colors.cardBorder }} padding={14}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={[Typography.headlineMD, { color: selectedCount > 0 ? theme.colors.accent : theme.colors.onSurfaceVariant, fontSize: 22 }]}>
                {selectedCount}/{totalItems}
              </Text>
              <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}>
                Assets selected
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.selectAllBtn, { backgroundColor: theme.colors.accent + '15', borderColor: theme.colors.accent + '25' }]}
              onPress={() => setSections(sections.map((s) => ({ ...s, items: s.items.map((i) => ({ ...i, checked: true })) })))}
            >
              <Text style={[Typography.labelSM, { color: theme.colors.accent, textTransform: 'uppercase' }]}>
                Select All
              </Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Asset Sections */}
        {sections.map((section) => (
          <GlassCard key={section.id} style={{ marginBottom: 12 }} padding={16}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: section.color + '18' }]}>
                <Ionicons name={section.icon} size={20} color={section.color} />
              </View>
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600', flex: 1, marginLeft: 10 }]}>
                {section.title}
              </Text>
              <TouchableOpacity onPress={() => selectAllSection(section.id)}>
                <Text style={[Typography.labelSM, { color: section.color, textTransform: 'uppercase' }]}>
                  Select All
                </Text>
              </TouchableOpacity>
            </View>

            {section.items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.itemRow, { borderTopColor: theme.colors.cardBorder }]}
                onPress={() => toggleItem(section.id, item.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: item.checked ? section.color : 'transparent',
                      borderColor: item.checked ? section.color : theme.colors.outlineVariant,
                    },
                  ]}
                >
                  {item.checked && <Ionicons name="checkmark" size={12} color="#fff" />}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontSize: 13 }]}>
                    {item.name}
                  </Text>
                </View>
                <Text style={[Typography.bodyMD, { color: item.checked ? section.color : theme.colors.onSurfaceVariant, fontWeight: '600', fontSize: 13 }]}>
                  {item.value}
                </Text>
              </TouchableOpacity>
            ))}
          </GlassCard>
        ))}

        {/* Report Options */}
        <GlassCard style={{ marginBottom: 16 }} padding={16}>
          <Text style={[Typography.headlineMD, { color: theme.colors.onSurface, marginBottom: 14 }]}>
            Report Options
          </Text>

          <View style={[styles.optionRow, { borderBottomColor: theme.colors.cardBorder }]}>
            <View>
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurface }]}>Include Net Worth Summary</Text>
              <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}>Visible to recipient</Text>
            </View>
            <Switch
              value={includeNetworth}
              onValueChange={setIncludeNetworth}
              trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.accent + '60' }}
              thumbColor={includeNetworth ? theme.colors.accent : theme.colors.onSurface}
            />
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }]}>
              Link Expiry
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[7, 15, 30, 60].map((days) => (
                <TouchableOpacity
                  key={days}
                  style={[
                    styles.expiryBtn,
                    {
                      backgroundColor: expiryDays === days ? theme.colors.accent : theme.colors.surfaceContainerHigh,
                      borderColor: expiryDays === days ? theme.colors.accent : theme.colors.outlineVariant,
                    },
                  ]}
                  onPress={() => setExpiryDays(days)}
                >
                  <Text style={[Typography.labelSM, { color: expiryDays === days ? (isDark ? '#0A192F' : '#fff') : theme.colors.onSurfaceVariant }]}>
                    {days}d
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </GlassCard>

        <PrimaryButton
          label={generating ? 'Generating...' : `Generate Report (${selectedCount} assets)`}
          onPress={handleGenerate}
          loading={generating}
          iconName="document-text-outline"
          style={{ marginBottom: 20 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 100 },
  selectAllBtn: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  expiryBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
});
