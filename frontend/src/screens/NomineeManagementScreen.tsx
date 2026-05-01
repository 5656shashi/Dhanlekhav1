import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { GlassCard } from '../components/GlassCard';
import { Header } from '../components/Header';
import { Badge } from '../components/Badge';
import { PrimaryButton } from '../components/PrimaryButton';
import { Typography } from '../theme/typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as NomineeService from '../api/services/nominee.service';

interface Nominee {
  id: string;
  name: string;
  relation: string;
  phone: string;
  access: string;
  allocation: string;
  verified: boolean;
}

const INITIAL_NOMINEES: Nominee[] = [
  {
    id: '1',
    name: 'Rohan Sharma',
    relation: 'Son',
    phone: '+91 98765 43210',
    access: 'Full Vault Access',
    allocation: '60%',
    verified: true,
  },
  {
    id: '2',
    name: 'Priya Mehta',
    relation: 'Spouse',
    phone: '+91 87654 32109',
    access: 'Partial Access',
    allocation: '30%',
    verified: true,
  },
  {
    id: '3',
    name: 'Anil Kumar',
    relation: 'Brother',
    phone: '+91 76543 21098',
    access: 'Read Only',
    allocation: '10%',
    verified: false,
  },
];

const ACCESS_COLORS: Record<string, string> = {
  'Full Vault Access': '#14B8A6',
  'Partial Access': '#6366F1',
  'Read Only': '#8B5CF6',
};

export const NomineeManagementScreen = ({ navigation }: any) => {
  const { theme, isDark } = useTheme();
  const [nominees, setNominees] = useState<Nominee[]>(INITIAL_NOMINEES);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', relation: '', phone: '', allocation: '' });

  const totalAlloc = nominees.reduce((sum, n) => {
    const val = parseInt(n.allocation.replace('%', '')) || 0;
    return sum + val;
  }, 0);

  useEffect(() => {
    loadNominees();
  }, []);

  const loadNominees = async () => {
    try {
      setIsLoading(true);
      const data = await NomineeService.getNominees();
      if (data && data.length > 0) setNominees(data);
    } catch (error) {
      console.error('Failed to load nominees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!form.name || !form.relation) {
      Alert.alert('Required Fields', 'Please fill Name and Relation.');
      return;
    }
    try {
      const newNom: any = {
        name: form.name,
        relation: form.relation,
        phone: form.phone,
        allocationPct: parseFloat(form.allocation) || 0,
      };
      const saved = await NomineeService.addNominee(newNom);
      setNominees([...nominees, saved as any]);
      setForm({ name: '', relation: '', phone: '', allocation: '' });
      setShowModal(false);
    } catch (error) {
      console.error('Failed to add nominee:', error);
      Alert.alert('Error', 'Could not add nominee to the vault.');
    }
  };

  const handleRemove = (id: string) => {
    Alert.alert('Remove Nominee', 'Are you sure you want to remove this nominee?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await NomineeService.removeNominee(id);
            setNominees(nominees.filter((n) => n.id !== id));
          } catch (e) {
            Alert.alert('Error', 'Failed to revoke nominee access.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <Header title="Nominees" showThemeToggle />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Title */}
        <Text style={[Typography.headlineLG, { color: theme.colors.onSurface, marginTop: 16, marginBottom: 4 }]}>
          Manage Nominees
        </Text>
        <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, marginBottom: 20 }]}>
          Securely assign beneficiaries and dictate access levels to your digital vault assets.
        </Text>

        {/* CTA Buttons */}
        <View style={styles.ctaRow}>
          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: theme.colors.accent }]}
            onPress={() => setShowModal(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="person-add-outline" size={20} color={isDark ? '#0A192F' : '#fff'} />
            <Text style={[Typography.labelSM, { color: isDark ? '#0A192F' : '#fff', marginLeft: 8, textTransform: 'uppercase', letterSpacing: 1 }]}>
              Add New Nominee
            </Text>
            <Ionicons name="arrow-forward" size={16} color={isDark ? '#0A192F' : '#fff'} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: theme.colors.glassBackground, borderWidth: 1, borderColor: theme.colors.cardBorder }]}
            onPress={() => navigation.navigate('NGONominee')}
            activeOpacity={0.85}
          >
            <Ionicons name="heart-outline" size={20} color={isDark ? '#ADC6FF' : '#6366F1'} />
            <Text style={[Typography.labelSM, { color: theme.colors.onSurface, marginLeft: 8, textTransform: 'uppercase', letterSpacing: 1 }]}>
              Add NGO Nominee
            </Text>
            <Ionicons name="arrow-forward" size={16} color={theme.colors.onSurfaceVariant} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        {/* Allocation Summary */}
        <GlassCard style={{ marginBottom: 16 }} padding={16}>
          <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }]}>
            Allocation Summary
          </Text>
          <View style={[styles.allocBar, { backgroundColor: theme.colors.surfaceContainerHigh }]}>
            {nominees.map((n, idx) => (
              <View
                key={n.id}
                style={[
                  styles.allocSegment,
                  {
                    width: `${parseInt(n.allocation)}%`,
                    backgroundColor: ['#14B8A6', '#6366F1', '#8B5CF6', '#3B82F6'][idx % 4],
                    borderRightWidth: idx < nominees.length - 1 ? 2 : 0,
                    borderRightColor: theme.colors.background,
                  },
                ]}
              />
            ))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
            {nominees.map((n, idx) => (
              <View key={n.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={[styles.dot, { backgroundColor: ['#14B8A6', '#6366F1', '#8B5CF6', '#3B82F6'][idx % 4] }]} />
                <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant }]}>
                  {n.name.split(' ')[0]}: {n.allocation}
                </Text>
              </View>
            ))}
          </View>
          {totalAlloc !== 100 && (
            <View style={[styles.allocWarning, { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }]}>
              <Ionicons name="warning-outline" size={14} color="#EF4444" />
              <Text style={[Typography.labelSM, { color: '#EF4444', marginLeft: 6 }]}>
                Total allocation is {totalAlloc}% — should be 100%
              </Text>
            </View>
          )}
        </GlassCard>

        {/* Nominee Cards */}
        <Text style={[Typography.headlineMD, { color: theme.colors.onSurface, marginBottom: 12 }]}>
          Your Nominees
        </Text>
        <View style={{ gap: 12 }}>
          {nominees.map((nom) => {
            const accessColor = ACCESS_COLORS[nom.access] || '#14B8A6';
            return (
              <GlassCard key={nom.id} padding={16}>
                <View style={styles.nomHeader}>
                  <View style={[styles.avatar, { backgroundColor: accessColor + '20' }]}>
                    <Text style={[Typography.headlineMD, { color: accessColor, fontSize: 18 }]}>
                      {nom.name.charAt(0)}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600' }]}>
                        {nom.name}
                      </Text>
                      {nom.verified && (
                        <Ionicons name="checkmark-circle" size={14} color={theme.colors.accent} />
                      )}
                    </View>
                    <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}>
                      {nom.relation} • {nom.phone}
                    </Text>
                  </View>
                  <Text style={[Typography.headlineMD, { color: accessColor, fontSize: 18 }]}>
                    {nom.allocation}
                  </Text>
                </View>

                <View style={[styles.nomMeta, { borderTopColor: theme.colors.cardBorder }]}>
                  <Badge
                    label={nom.access}
                    color={accessColor}
                    backgroundColor={accessColor + '18'}
                    borderColor={accessColor + '30'}
                  />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.surfaceContainerHigh }]}>
                      <Ionicons name="pencil-outline" size={14} color={theme.colors.onSurfaceVariant} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.1)' }]}
                      onPress={() => handleRemove(nom.id)}
                    >
                      <Ionicons name="trash-outline" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </GlassCard>
            );
          })}
        </View>

        {/* Legacy Shield Info */}
        <GlassCard style={{ marginTop: 16, marginBottom: 8, borderColor: isDark ? 'rgba(173,198,255,0.15)' : 'rgba(99,102,241,0.15)' }} padding={16}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Ionicons name="information-circle-outline" size={22} color={isDark ? '#ADC6FF' : '#6366F1'} />
            <View style={{ flex: 1 }}>
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600', marginBottom: 4 }]}>
                Legacy Shield
              </Text>
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, fontSize: 13, lineHeight: 20 }]}>
                If your account is inactive for 180 days, nominees will automatically receive access notifications. Configurable in Security Settings.
              </Text>
            </View>
          </View>
        </GlassCard>
      </ScrollView>

      {/* Add Nominee Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.colors.surface, borderColor: theme.colors.cardBorder }]}>
            <View style={styles.modalHandle} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={[Typography.headlineMD, { color: theme.colors.onSurface }]}>Add Nominee</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={22} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            {[
              { key: 'name', label: 'Full Name *', placeholder: 'e.g. Rohan Sharma' },
              { key: 'relation', label: 'Relation *', placeholder: 'e.g. Son, Spouse, Brother' },
              { key: 'phone', label: 'Phone Number', placeholder: '+91 XXXXX XXXXX' },
              { key: 'allocation', label: 'Allocation %', placeholder: 'e.g. 50%' },
            ].map((field) => (
              <View key={field.key} style={{ marginBottom: 14 }}>
                <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }]}>
                  {field.label}
                </Text>
                <TextInput
                  style={[
                    Typography.bodyMD,
                    styles.modalInput,
                    { backgroundColor: theme.colors.surfaceContainer, borderColor: theme.colors.outlineVariant, color: theme.colors.onSurface },
                  ]}
                  placeholder={field.placeholder}
                  placeholderTextColor={theme.colors.outline}
                  value={(form as any)[field.key]}
                  onChangeText={(v) => setForm({ ...form, [field.key]: v })}
                />
              </View>
            ))}
            <PrimaryButton label="Add Nominee" onPress={handleAdd} style={{ marginTop: 8 }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 100 },
  ctaRow: { gap: 10, marginBottom: 16 },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  allocBar: {
    height: 10,
    borderRadius: 5,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  allocSegment: { height: '100%' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  allocWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 10,
  },
  nomHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nomMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(150,150,150,0.4)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
