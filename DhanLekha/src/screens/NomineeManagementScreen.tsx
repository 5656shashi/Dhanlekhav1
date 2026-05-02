import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, RefreshControl, ActivityIndicator,
  Platform, KeyboardAvoidingView, PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { GlassCard } from '../components/GlassCard';
import { Header } from '../components/Header';
import { Badge } from '../components/Badge';
import { PrimaryButton } from '../components/PrimaryButton';
import { LoadingView, ErrorView } from '../components/LoadingView';
import { Typography } from '../theme/typography';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApi } from '../hooks/useApi';
import { nomineesApi } from '../services/api';

const ACCESS_COLORS: Record<string, string> = {
  FULL_VAULT: '#14B8A6', PARTIAL: '#6366F1', READ_ONLY: '#8B5CF6',
};
const ACCESS_LABELS: Record<string, string> = {
  FULL_VAULT: 'Full Vault Access', PARTIAL: 'Partial Access', READ_ONLY: 'Read Only',
};

export const NomineeManagementScreen = ({ navigation }: any) => {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState({ name: '', relation: '', phone: '', allocation: '0', accessType: 'READ_ONLY' });

  const { data, loading, error, refresh } = useApi(() => nomineesApi.list());
  const sliderWidth = React.useRef(280);
  const sliderX = React.useRef(0);
  const sliderRef = React.useRef<View>(null);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (evt) => {
        sliderX.current = evt.nativeEvent.pageX - evt.nativeEvent.locationX;
        sliderRef.current?.measureInWindow((x, y, w) => {
          sliderWidth.current = w || sliderWidth.current;
        });
      },
      onPanResponderMove: (evt, gestureState) => {
        const x = Math.max(0, Math.min(evt.nativeEvent.pageX - sliderX.current, sliderWidth.current));
        const totalOther = data?.totalAllocation ?? 0;
        const maxPossible = 100 - totalOther;
        let pct = Math.round((x / sliderWidth.current) * 100);
        if (pct > maxPossible) pct = Math.max(0, maxPossible);
        setForm(prev => ({ ...prev, allocation: String(pct) }));
      },
    })
  ).current;

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [])
  );

  const nominees = data?.nominees ?? [];
  const totalAlloc = data?.totalAllocation ?? 0;

  const onRefresh = () => { setRefreshing(true); refresh(); setTimeout(() => setRefreshing(false), 1000); };

  const handleAdd = async () => {
    if (!form.name || !form.relation) { Alert.alert('Required', 'Name and Relation are required.'); return; }
    setSaving(true);
    try {
      await nomineesApi.create({
        name: form.name, relation: form.relation, phone: form.phone || undefined,
        accessType: form.accessType, allocationPct: parseFloat(form.allocation) || 0,
      });
      setForm({ name: '', relation: '', phone: '', allocation: '', accessType: 'READ_ONLY' });
      setShowModal(false);
      refresh();
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSaving(false); }
  };

  const handleRevoke = (id: string, name: string) => {
    Alert.alert('Revoke Nominee', `Remove ${name} as a nominee?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Revoke', style: 'destructive', onPress: async () => {
        try { await nomineesApi.revoke(id); refresh(); }
        catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  if (loading && !data) return <LoadingView message="Loading nominees..." />;
  if (error && !data) return <ErrorView message={error} onRetry={refresh} />;

  return (
    <View style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <Header title="Nominees" showThemeToggle />
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 20) + 120 }]} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />}
      >
        <Text style={[Typography.headlineLG, { color: theme.colors.onSurface, marginTop: 16, marginBottom: 4 }]}>Manage Nominees</Text>
        <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, marginBottom: 20 }]}>
          Assign beneficiaries and control their access to your vault assets.
        </Text>

        {/* CTAs */}
        <View style={{ gap: 10, marginBottom: 16 }}>
          <TouchableOpacity style={[styles.ctaBtn, { backgroundColor: theme.colors.accent }]} onPress={() => setShowModal(true)} activeOpacity={0.85}>
            <Ionicons name="person-add-outline" size={20} color={isDark ? '#0A192F' : '#fff'} />
            <Text style={[Typography.labelSM, { color: isDark ? '#0A192F' : '#fff', marginLeft: 8, textTransform: 'uppercase', letterSpacing: 1 }]}>Add New Nominee</Text>
            <View style={{ flex: 1 }} /><Ionicons name="arrow-forward" size={16} color={isDark ? '#0A192F' : '#fff'} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.ctaBtn, { backgroundColor: theme.colors.glassBackground, borderWidth: 1, borderColor: theme.colors.cardBorder }]} onPress={() => navigation.navigate('NGONominee')} activeOpacity={0.85}>
            <Ionicons name="heart-outline" size={20} color={isDark ? '#ADC6FF' : '#6366F1'} />
            <Text style={[Typography.labelSM, { color: theme.colors.onSurface, marginLeft: 8, textTransform: 'uppercase', letterSpacing: 1 }]}>Add NGO Nominee</Text>
            <View style={{ flex: 1 }} /><Ionicons name="arrow-forward" size={16} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {/* Allocation Summary */}
        <GlassCard style={{ marginBottom: 16 }} padding={16}>
          <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }]}>Allocation Summary</Text>
          <View style={[styles.allocBar, { backgroundColor: theme.colors.surfaceContainerHigh }]}>
            {nominees.map((n: any, idx: number) => (
              <View key={n.id} style={[styles.allocSeg, {
                width: `${n.allocationPct}%`,
                backgroundColor: ['#14B8A6', '#6366F1', '#8B5CF6', '#3B82F6', '#F59E0B'][idx % 5],
              }]} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
            {nominees.map((n: any, idx: number) => (
              <View key={n.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={[styles.dot, { backgroundColor: ['#14B8A6', '#6366F1', '#8B5CF6', '#3B82F6', '#F59E0B'][idx % 5] }]} />
                <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant }]}>{n.name.split(' ')[0]}: {n.allocationPct}%</Text>
              </View>
            ))}
          </View>
          {totalAlloc !== 100 && nominees.length > 0 && (
            <View style={[styles.allocWarn, { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }]}>
              <Ionicons name="warning-outline" size={14} color="#EF4444" />
              <Text style={[Typography.labelSM, { color: '#EF4444', marginLeft: 6 }]}>Total is {totalAlloc}% — should be 100%</Text>
            </View>
          )}
        </GlassCard>

        {/* Nominees */}
        <Text style={[Typography.headlineMD, { color: theme.colors.onSurface, marginBottom: 12 }]}>Your Nominees</Text>
        <View style={{ gap: 12, marginBottom: 16 }}>
          {nominees.length === 0 && (
            <GlassCard padding={24}><Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, textAlign: 'center' }]}>No nominees added yet.</Text></GlassCard>
          )}
          {nominees.map((nom: any) => {
            const c = ACCESS_COLORS[nom.accessType] || '#14B8A6';
            const isNGO = nom.nomineeType === 'NGO';
            return (
              <GlassCard key={nom.id} padding={16}>
                <View style={styles.nomHeader}>
                  <View style={[styles.avatar, { backgroundColor: c + '20' }]}>
                    <Text style={[Typography.headlineMD, { color: c, fontSize: 18 }]}>{isNGO ? '🏢' : nom.name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600' }]}>{nom.name}</Text>
                      {nom.isVerified && <Ionicons name="checkmark-circle" size={14} color={theme.colors.accent} />}
                      {isNGO && <Badge label="NGO" color="#6366F1" backgroundColor="rgba(99,102,241,0.1)" borderColor="rgba(99,102,241,0.2)" />}
                    </View>
                    <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}>
                      {nom.relation}{nom.phone ? ` • ${nom.phone}` : ''}
                    </Text>
                  </View>
                  <Text style={[Typography.headlineMD, { color: c, fontSize: 18 }]}>{nom.allocationPct}%</Text>
                </View>
                <View style={[styles.nomMeta, { borderTopColor: theme.colors.cardBorder }]}>
                  <Badge label={ACCESS_LABELS[nom.accessType] || nom.accessType} color={c} backgroundColor={c + '18'} borderColor={c + '30'} />
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.1)' }]} onPress={() => handleRevoke(nom.id, nom.name)}>
                    <Ionicons name="trash-outline" size={14} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </GlassCard>
            );
          })}
        </View>

        {/* Legacy Switch Info */}
        <GlassCard style={{ marginBottom: 8, borderColor: isDark ? 'rgba(173,198,255,0.15)' : 'rgba(99,102,241,0.15)' }} padding={16}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Ionicons name="information-circle-outline" size={22} color={isDark ? '#ADC6FF' : '#6366F1'} />
            <View style={{ flex: 1 }}>
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600', marginBottom: 4 }]}>Legacy Switch</Text>
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, fontSize: 13, lineHeight: 20 }]}>
                If inactive for your set period, nominees receive automatic notifications. Configure in Security Settings.
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SecuritySettings')} style={{ marginTop: 8 }}>
                <Text style={[Typography.labelSM, { color: isDark ? '#ADC6FF' : '#6366F1', textTransform: 'uppercase' }]}>Configure →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </GlassCard>
      </ScrollView>

      {/* Add Nominee Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowModal(false)}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={{ width: '100%' }}
          >
            <TouchableOpacity activeOpacity={1}>
              <View style={[styles.modalSheet, { backgroundColor: theme.colors.surface, borderColor: theme.colors.cardBorder }]}>
                <View style={styles.handle} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <Text style={[Typography.headlineMD, { color: theme.colors.onSurface }]}>Add Nominee</Text>
                  <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={22} color={theme.colors.onSurfaceVariant} /></TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                  {[
                    { key: 'name', label: 'Full Name *', placeholder: 'e.g. Rohan Sharma' },
                    { key: 'relation', label: 'Relation *', placeholder: 'Son, Spouse, Brother...' },
                    { key: 'phone', label: 'Phone Number', placeholder: '+91 XXXXX XXXXX' },
                  ].map((f) => (
                    <View key={f.key} style={{ marginBottom: 14 }}>
                      <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }]}>{f.label}</Text>
                      <TextInput
                        style={[Typography.bodyMD, styles.modalInput, { backgroundColor: theme.colors.surfaceContainer, borderColor: theme.colors.outlineVariant, color: theme.colors.onSurface }]}
                        placeholder={f.placeholder} placeholderTextColor={theme.colors.outline}
                        value={(form as any)[f.key]}
                        onChangeText={(v) => setForm({ ...form, [f.key]: v })}
                      />
                    </View>
                  ))}
                  <View style={{ marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8 }]}>Allocation %</Text>
                      <Text style={[Typography.headlineMD, { color: theme.colors.accent }]}>{form.allocation}%</Text>
                    </View>
                    <View style={styles.sliderContainer}>
                      <View 
                        ref={sliderRef}
                        style={[styles.sliderTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                        onLayout={(e) => {
                          sliderWidth.current = e.nativeEvent.layout.width;
                        }}
                        {...panResponder.panHandlers}
                      >
                        <View pointerEvents="none" style={[styles.sliderFill, { width: `${form.allocation}%`, backgroundColor: theme.colors.accent, shadowColor: theme.colors.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 5 }]} />
                        <View pointerEvents="none" style={[styles.sliderThumb, { left: `${form.allocation}%`, backgroundColor: '#fff', borderColor: theme.colors.accent, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 8 }]} />
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                      <Text style={[Typography.labelSM, { color: theme.colors.outline, fontSize: 10 }]}>Available: {100 - totalAlloc}%</Text>
                      <Text style={[Typography.labelSM, { color: theme.colors.outline, fontSize: 10 }]}>Total: {totalAlloc + parseInt(form.allocation || '0')}%</Text>
                    </View>
                  </View>
                  <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }]}>Access Type</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                    {['READ_ONLY', 'PARTIAL', 'FULL_VAULT'].map((a) => (
                      <TouchableOpacity key={a} style={[styles.accessChip, { backgroundColor: form.accessType === a ? theme.colors.accent : theme.colors.surfaceContainerHigh, borderColor: form.accessType === a ? theme.colors.accent : theme.colors.outlineVariant }]} onPress={() => setForm({ ...form, accessType: a })}>
                        <Text style={[Typography.labelSM, { color: form.accessType === a ? '#fff' : theme.colors.onSurfaceVariant, fontSize: 10 }]}>{ACCESS_LABELS[a]}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <PrimaryButton label="Add Nominee" onPress={handleAdd} loading={saving} />
                </ScrollView>
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 120 },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16 },
  allocBar: { height: 10, borderRadius: 5, flexDirection: 'row', overflow: 'hidden' },
  allocSeg: { height: '100%' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  allocWarn: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, marginTop: 10 },
  nomHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  nomMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, paddingTop: 10 },
  actionBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, padding: 24, paddingBottom: 40 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(150,150,150,0.4)', alignSelf: 'center', marginBottom: 16 },
  modalInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  accessChip: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  sliderContainer: { height: 40, justifyContent: 'center', marginVertical: 10, paddingHorizontal: 13 },
  sliderTrack: { height: 12, borderRadius: 6, width: '100%', position: 'relative', overflow: 'visible' },
  sliderFill: { height: '100%', borderRadius: 6 },
  sliderThumb: { width: 26, height: 26, borderRadius: 13, borderWidth: 3, position: 'absolute', top: -7, marginLeft: -13 },
});
