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
import { PrimaryButton } from '../components/PrimaryButton';
import { Badge } from '../components/Badge';
import { Typography } from '../theme/typography';
import { SafeAreaView } from 'react-native-safe-area-context';

const NGOS = [
  {
    id: '1',
    name: 'GiveIndia',
    description: "India's largest and most trusted giving platform, supporting multiple causes including education, health, and poverty alleviation.",
    cause: 'Multi-cause',
    icon: 'heart' as const,
    color: '#EF4444',
    trusted: true,
    rating: 4.9,
  },
  {
    id: '2',
    name: 'CRY India',
    description: 'Child Rights and You — working for the rights and welfare of children across India through education and health programmes.',
    cause: "Children's Rights",
    icon: 'people' as const,
    color: '#F59E0B',
    trusted: true,
    rating: 4.8,
  },
  {
    id: '3',
    name: 'Goonj',
    description: 'Transforming urban surplus into a resource and a tool for rural development, disaster relief, and community development.',
    cause: 'Rural Development',
    icon: 'leaf' as const,
    color: '#10B981',
    trusted: true,
    rating: 4.7,
  },
  {
    id: '4',
    name: 'HelpAge India',
    description: 'Dedicated to improving the quality of life of disadvantaged older persons in India through various programs.',
    cause: 'Elder Care',
    icon: 'person' as const,
    color: '#6366F1',
    trusted: true,
    rating: 4.8,
  },
  {
    id: '5',
    name: 'Teach For India',
    description: "Building a movement of leaders working towards educational equity and excellence in India's most under-resourced schools.",
    cause: 'Education',
    icon: 'school' as const,
    color: '#3B82F6',
    trusted: true,
    rating: 4.9,
  },
];

export const NGONomineeScreen = ({ navigation }: any) => {
  const { theme, isDark } = useTheme();
  const [selected, setSelected] = useState<string | null>(null);
  const [allocation, setAllocation] = useState('10');

  const handleConfirm = () => {
    if (!selected) {
      Alert.alert('Select NGO', 'Please select an NGO nominee first.');
      return;
    }
    const ngo = NGOS.find((n) => n.id === selected);
    Alert.alert(
      'NGO Nominee Added',
      `${ngo?.name} has been added as an NGO nominee with ${allocation}% allocation.\n\nThis will be recorded on the blockchain.`,
      [{ text: 'Done', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <Header title="NGO Nominee" showBack onBack={() => navigation.goBack()} showThemeToggle />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header section */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 6 }}>
          <Ionicons name="heart" size={16} color={theme.colors.accent} />
          <Text style={[Typography.labelSM, { color: theme.colors.accent, textTransform: 'uppercase', letterSpacing: 1.2 }]}>
            Philanthropic Allocation
          </Text>
        </View>
        <Text style={[Typography.headlineLG, { color: theme.colors.onSurface, marginBottom: 6 }]}>
          Select NGO Nominee
        </Text>
        <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, marginBottom: 16 }]}>
          Designate a trusted non-governmental organization to inherit a portion of your digital vault assets.
        </Text>

        {/* Verification Notice */}
        <View style={[styles.verifyRow, { backgroundColor: isDark ? 'rgba(100,255,218,0.05)' : 'rgba(20,184,166,0.06)', borderColor: isDark ? 'rgba(100,255,218,0.15)' : 'rgba(20,184,166,0.2)' }]}>
          <Ionicons name="shield-checkmark" size={14} color={theme.colors.accent} />
          <Text style={[Typography.labelSM, { color: theme.colors.accent, marginLeft: 6, flex: 1, lineHeight: 18 }]}>
            All listed NGOs are verified and compliant with DhanLekha Trust Standards.
          </Text>
        </View>

        {/* NGO Cards */}
        <View style={styles.ngoGrid}>
          {NGOS.map((ngo) => {
            const isSelected = selected === ngo.id;
            return (
              <TouchableOpacity
                key={ngo.id}
                onPress={() => setSelected(isSelected ? null : ngo.id)}
                activeOpacity={0.85}
              >
                <GlassCard
                  style={[
                    styles.ngoCard,
                    isSelected && {
                      borderColor: ngo.color + '50',
                      borderWidth: 2,
                    },
                  ]}
                  padding={16}
                >
                  <View style={styles.ngoHeader}>
                    <View style={[styles.ngoIcon, { backgroundColor: ngo.color + '18' }]}>
                      <Ionicons name={ngo.icon} size={24} color={ngo.color} />
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                      {ngo.trusted && (
                        <Badge
                          label="Trusted"
                          color={isDark ? '#B9C7E4' : '#0A192F'}
                          backgroundColor={isDark ? 'rgba(185,199,228,0.1)' : 'rgba(10,25,47,0.06)'}
                          borderColor={isDark ? 'rgba(185,199,228,0.2)' : 'rgba(10,25,47,0.12)'}
                          iconName="shield-checkmark"
                        />
                      )}
                      {isSelected && (
                        <View style={[styles.selectedCheck, { backgroundColor: ngo.color }]}>
                          <Ionicons name="checkmark" size={12} color="#fff" />
                        </View>
                      )}
                    </View>
                  </View>

                  <Text style={[Typography.headlineMD, { color: theme.colors.onSurface, marginTop: 12, marginBottom: 6 }]}>
                    {ngo.name}
                  </Text>
                  <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, fontSize: 13, lineHeight: 20, marginBottom: 12 }]}>
                    {ngo.description}
                  </Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Badge
                      label={ngo.cause}
                      color={ngo.color}
                      backgroundColor={ngo.color + '12'}
                      borderColor={ngo.color + '25'}
                    />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="star" size={12} color="#F59E0B" />
                      <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant }]}>
                        {ngo.rating}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Allocation input */}
        {selected && (
          <GlassCard style={{ marginTop: 8, marginBottom: 16, borderColor: theme.colors.accent + '25' }} padding={16}>
            <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }]}>
              Allocation for {NGOS.find((n) => n.id === selected)?.name}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {['5', '10', '15', '20', '25'].map((pct) => (
                <TouchableOpacity
                  key={pct}
                  style={[
                    styles.allocBtn,
                    {
                      backgroundColor: allocation === pct ? theme.colors.accent : theme.colors.surfaceContainerHigh,
                      borderColor: allocation === pct ? theme.colors.accent : theme.colors.outlineVariant,
                    },
                  ]}
                  onPress={() => setAllocation(pct)}
                >
                  <Text style={[Typography.labelSM, { color: allocation === pct ? (isDark ? '#0A192F' : '#fff') : theme.colors.onSurfaceVariant }]}>
                    {pct}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassCard>
        )}

        <PrimaryButton
          label={selected ? `Confirm NGO Nominee • ${allocation}%` : 'Select an NGO to Continue'}
          onPress={handleConfirm}
          disabled={!selected}
          iconName="arrow-forward"
          style={{ marginBottom: 20 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 100 },
  verifyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 6,
  },
  ngoGrid: { gap: 12, marginBottom: 16 },
  ngoCard: { borderRadius: 16, borderWidth: 1 },
  ngoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  ngoIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allocBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
});
