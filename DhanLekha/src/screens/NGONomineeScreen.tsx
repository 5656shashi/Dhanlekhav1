import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, LayoutAnimation, Platform, UIManager, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { GlassCard } from '../components/GlassCard';
import { Header } from '../components/Header';
import { PrimaryButton } from '../components/PrimaryButton';
import { Badge } from '../components/Badge';
import { LoadingView, ErrorView } from '../components/LoadingView';
import { Typography } from '../theme/typography';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApi } from '../hooks/useApi';
import { nomineesApi } from '../services/api';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const NGO_META: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; cause: string; description: string }> = {
  'GiveIndia':      { icon: 'heart',         color: '#EF4444', cause: 'Multi-cause', description: 'India\'s largest and most trusted giving platform.' },
  'CRY India':      { icon: 'people',        color: '#F59E0B', cause: "Children's Rights", description: 'Ensuring happy, healthy, and creative childhoods for all children.' },
  'Goonj':          { icon: 'leaf',          color: '#10B981', cause: 'Rural Development', description: 'Using discarded urban material as a tool for rural development.' },
  'HelpAge India':  { icon: 'person',        color: '#6366F1', cause: 'Elder Care', description: 'Advocating for the rights of India\'s elderly for over four decades.' },
  'Teach For India':{ icon: 'school-outline' as any, color: '#3B82F6', cause: 'Education', description: 'Ending educational inequity in India through leadership development.' },
};

export const NGONomineeScreen = ({ navigation }: any) => {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<any>(null);
  const [allocation, setAllocation] = useState('10');
  const [saving, setSaving] = useState(false);
  const sliderWidth = React.useRef(280);
  const sliderX = React.useRef(0);
  const sliderRef = React.useRef<View>(null);

  const { data: ngos, loading, error } = useApi(() => nomineesApi.listNGOs());
  const { data: existingData } = useApi(() => nomineesApi.list());
  const totalAlloc = existingData?.totalAllocation ?? 0;

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
        const maxPossible = 100 - totalAlloc;
        let pct = Math.round((x / sliderWidth.current) * 100);
        if (pct > maxPossible) pct = Math.max(0, maxPossible);
        setAllocation(String(pct));
      },
    })
  ).current;

  const handleSelect = (ngo: any) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelected(selected?.id === ngo.id ? null : ngo);
  };

  const handleConfirm = async () => {
    if (!selected) { Alert.alert('Select NGO', 'Please select an NGO to continue.'); return; }
    setSaving(true);
    try {
      await nomineesApi.create({
        name: selected.name,
        relation: 'NGO',
        nomineeType: 'NGO',
        ngoName: selected.name,
        ngoRegNo: selected.regNo,
        accessType: 'READ_ONLY',
        allocationPct: parseFloat(allocation),
      });
      Alert.alert('NGO Nominee Added', `${selected.name} added with ${allocation}% allocation. Recorded on blockchain.`, [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingView message="Loading NGO partners..." />;
  if (error) return <ErrorView message={error} onRetry={() => {}} />;

  return (
    <View style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <Header title="NGO Nominee" showBack onBack={() => navigation.goBack()} showThemeToggle />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 40) + 60 }]}>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 6 }}>
          <Ionicons name="heart" size={16} color={theme.colors.accent} />
          <Text style={[Typography.labelSM, { color: theme.colors.accent, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '800' }]}>Philanthropic Allocation</Text>
        </View>
        <Text style={[Typography.headlineLG, { color: theme.colors.onSurface, marginBottom: 6 }]}>Choose Charity Nominee</Text>
        <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, marginBottom: 16, lineHeight: 22 }]}>
          Designate a trusted organization to inherit a portion of your digital vault assets and continue your legacy of giving.
        </Text>

        <View style={[styles.verifyRow, { backgroundColor: isDark ? '#14B8A610' : '#14B8A608', borderColor: isDark ? '#14B8A630' : '#14B8A620' }]}>
          <View style={[styles.shieldCircle, { backgroundColor: theme.colors.accent }]}>
            <Ionicons name="shield-checkmark" size={14} color="#fff" />
          </View>
          <Text style={[Typography.labelSM, { color: theme.colors.onSurface, marginLeft: 10, flex: 1, lineHeight: 18, fontWeight: '600' }]}>
            All listed NGOs are verified for 80G compliance and DhanLekha Trust Standards.
          </Text>
        </View>

        <View style={{ gap: 14, marginBottom: 20 }}>
          {(ngos ?? []).map((ngo: any) => {
            const meta = NGO_META[ngo.name] || { icon: 'heart', color: '#EF4444', cause: 'Charity', description: 'A verified charitable organization.' };
            const isSel = selected?.id === ngo.id;
            return (
              <TouchableOpacity key={ngo.id} onPress={() => handleSelect(ngo)} activeOpacity={0.9}>
                <GlassCard style={[styles.ngoCard, isSel && { borderColor: meta.color, borderWidth: 1.5, backgroundColor: meta.color + '05' }]} padding={18}>
                  <View style={styles.ngoHeader}>
                    <View style={[styles.ngoIcon, { backgroundColor: meta.color + (isDark ? '25' : '15') }]}>
                      <Ionicons name={meta.icon} size={28} color={meta.color} />
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      {ngo.trusted && <Badge label="Verified" color="#14B8A6" backgroundColor="#14B8A615" borderColor="#14B8A630" iconName="shield-checkmark" />}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="star" size={14} color="#F59E0B" />
                        <Text style={[Typography.labelSM, { color: theme.colors.onSurface, fontWeight: '700' }]}>{ngo.rating}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={{ marginTop: 14 }}>
                    <Text style={[Typography.headlineMD, { color: theme.colors.onSurface, fontSize: 20 }]}>{ngo.name}</Text>
                    <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, fontSize: 13, marginTop: 6, lineHeight: 18 }]}>{meta.description}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
                    <Badge label={ngo.cause || meta.cause} color={meta.color} backgroundColor={meta.color + '12'} borderColor={meta.color + '25'} />
                    {isSel && (
                      <View style={[styles.checkIndicator, { backgroundColor: meta.color }]}>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      </View>
                    )}
                  </View>

                  {isSel && (
                    <View style={[styles.allocContainer, { borderTopColor: theme.colors.outlineVariant }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' }]}>Set Allocation %</Text>
                        <Text style={[Typography.headlineMD, { color: meta.color }]}>{allocation}%</Text>
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
                          <View pointerEvents="none" style={[styles.sliderFill, { width: `${allocation}%`, backgroundColor: meta.color, shadowColor: meta.color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 5 }]} />
                          <View pointerEvents="none" style={[styles.sliderThumb, { left: `${allocation}%`, backgroundColor: '#fff', borderColor: meta.color, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 8 }]} />
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                        <Text style={[Typography.labelSM, { color: theme.colors.outline, fontSize: 10 }]}>Available: {100 - totalAlloc}%</Text>
                        <Text style={[Typography.labelSM, { color: theme.colors.outline, fontSize: 10 }]}>Total: {totalAlloc + parseInt(allocation || '0')}%</Text>
                      </View>
                    </View>
                  )}
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>

        <PrimaryButton
          label={selected ? `Confirm ${selected.name} • ${allocation}%` : 'Select a Partner NGO'}
          onPress={handleConfirm}
          disabled={!selected}
          loading={saving}
          iconName="arrow-forward"
          style={{ marginBottom: 32 }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  verifyRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 20 },
  shieldCircle: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  ngoCard: { borderRadius: 20, borderWidth: 1 },
  ngoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  ngoIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  checkIndicator: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  allocContainer: { marginTop: 18, paddingTop: 18, borderTopWidth: 1 },
  sliderContainer: { height: 40, justifyContent: 'center', marginVertical: 10, paddingHorizontal: 13 },
  sliderTrack: { height: 12, borderRadius: 6, width: '100%', position: 'relative', overflow: 'visible' },
  sliderFill: { height: '100%', borderRadius: 6 },
  sliderThumb: { width: 26, height: 26, borderRadius: 13, borderWidth: 3, position: 'absolute', top: -7, marginLeft: -13 },
});
