import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { GlassCard } from '../components/GlassCard';
import { Header } from '../components/Header';
import { PrimaryButton } from '../components/PrimaryButton';
import { Badge } from '../components/Badge';
import { Typography } from '../theme/typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApi } from '../hooks/useApi';
import { kycApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STEPS = [
  { id: 1, label: 'Identity', icon: 'person-outline' as const },
  { id: 2, label: 'Documents', icon: 'document-text-outline' as const },
  { id: 3, label: 'Verify', icon: 'shield-checkmark-outline' as const },
];

export const KYCVerificationScreen = ({ navigation }: any) => {
  const { theme, isDark } = useTheme();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState(2);
  const [form, setForm] = useState({ aadhaar: '', pan: '', dob: '' });
  const [submitting, setSubmitting] = useState(false);

  const { data: kycStatus, refresh: refreshStatus } = useApi(() => kycApi.getStatus());

  const isVerified = kycStatus?.kycStatus === 'VERIFIED';
  const isSubmitted = kycStatus?.kycStatus === 'SUBMITTED';

  const handleSubmit = async () => {
    const aadhaarClean = form.aadhaar.replace(/\s/g, '');
    if (aadhaarClean.length !== 12) { Alert.alert('Invalid Aadhaar', 'Please enter a valid 12-digit Aadhaar number.'); return; }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(form.pan.toUpperCase())) { Alert.alert('Invalid PAN', 'Please enter a valid PAN (e.g. ABCDE1234F).'); return; }

    setSubmitting(true);
    try {
      await kycApi.submit({ aadhaar: form.aadhaar, pan: form.pan.toUpperCase(), dob: form.dob });
      refreshStatus();
      await refreshUser();
      setStep(3);
    } catch (e: any) {
      Alert.alert('Submission Failed', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <Header title="Identity Vault" showBack onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Step progress */}
        <View style={styles.stepsRow}>
          {STEPS.map((s, idx) => {
            const done = s.id < step || isVerified;
            const active = s.id === step && !isVerified;
            return (
              <React.Fragment key={s.id}>
                <View style={styles.stepItem}>
                  <View style={[styles.stepCircle,
                    done ? { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent }
                    : active ? { backgroundColor: 'transparent', borderColor: theme.colors.accent, borderWidth: 2 }
                    : { backgroundColor: theme.colors.surfaceContainerHigh, borderColor: theme.colors.outlineVariant, borderWidth: 1 }
                  ]}>
                    {done
                      ? <Ionicons name="checkmark" size={16} color={isDark ? '#0A192F' : '#fff'} />
                      : <Ionicons name={s.icon} size={16} color={active ? theme.colors.accent : theme.colors.onSurfaceVariant} />
                    }
                  </View>
                  <Text style={[Typography.labelSM, { color: done || active ? theme.colors.accent : theme.colors.onSurfaceVariant, marginTop: 4, textTransform: 'uppercase', fontSize: 10 }]}>
                    {s.label}
                  </Text>
                </View>
                {idx < STEPS.length - 1 && (
                  <View style={[styles.stepLine, { backgroundColor: s.id < step ? theme.colors.accent : theme.colors.outlineVariant }]} />
                )}
              </React.Fragment>
            );
          })}
        </View>

        {/* Already verified */}
        {isVerified && (
          <GlassCard style={{ marginBottom: 20, borderColor: theme.colors.accent + '30' }} padding={24}>
            <View style={{ alignItems: 'center' }}>
              <View style={[styles.successIcon, { backgroundColor: theme.colors.accent + '15' }]}>
                <Ionicons name="shield-checkmark" size={40} color={theme.colors.accent} />
              </View>
              <Text style={[Typography.headlineMD, { color: theme.colors.onSurface, marginTop: 16, textAlign: 'center' }]}>KYC Verified</Text>
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, marginTop: 6, textAlign: 'center' }]}>
                Your identity has been verified successfully.
              </Text>
              {kycStatus?.kycVerifiedAt && (
                <Badge label={`Verified ${new Date(kycStatus.kycVerifiedAt).toLocaleDateString('en-IN')}`} color={theme.colors.accent} backgroundColor={theme.colors.accent + '15'} borderColor={theme.colors.accent + '25'} iconName="checkmark-circle" style={{ marginTop: 12 }} />
              )}
            </View>
          </GlassCard>
        )}

        {/* Pending */}
        {isSubmitted && !isVerified && (
          <GlassCard style={{ marginBottom: 20, borderColor: '#F59E0B30' }} padding={20}>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
              <Ionicons name="time-outline" size={22} color="#F59E0B" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600', marginBottom: 4 }]}>KYC Under Review</Text>
                <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, fontSize: 13, lineHeight: 20 }]}>
                  Your documents are being verified. This typically takes up to 24 hours. You'll be notified once complete.
                </Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* Form */}
        {!isVerified && !isSubmitted && (
          <GlassCard style={{ marginBottom: 16 }} padding={20}>
            <Text style={[Typography.headlineMD, { color: theme.colors.onSurface, marginBottom: 4, textAlign: 'center' }]}>Upload KYC Documents</Text>
            <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, textAlign: 'center', marginBottom: 20 }]}>
              Enter your government-issued identity details
            </Text>

            {/* Aadhaar */}
            <View style={{ marginBottom: 16 }}>
              <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }]}>Aadhaar Number *</Text>
              <View style={[styles.inputRow, { backgroundColor: theme.colors.surfaceContainerLow, borderColor: theme.colors.outlineVariant }]}>
                <Ionicons name="card-outline" size={18} color={theme.colors.outline} />
                <TextInput
                  style={[Typography.bodyMD, styles.input, { color: theme.colors.onSurface }]}
                  placeholder="XXXX XXXX XXXX"
                  placeholderTextColor={theme.colors.outline}
                  value={form.aadhaar}
                  onChangeText={(v) => {
                    const digits = v.replace(/\D/g, '').slice(0, 12);
                    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
                    setForm({ ...form, aadhaar: formatted });
                  }}
                  keyboardType="numeric"
                  maxLength={14}
                />
              </View>
            </View>

            {/* PAN */}
            <View style={{ marginBottom: 16 }}>
              <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }]}>PAN Number *</Text>
              <View style={[styles.inputRow, { backgroundColor: theme.colors.surfaceContainerLow, borderColor: theme.colors.outlineVariant }]}>
                <Ionicons name="document-outline" size={18} color={theme.colors.outline} />
                <TextInput
                  style={[Typography.bodyMD, styles.input, { color: theme.colors.onSurface }]}
                  placeholder="ABCDE1234F"
                  placeholderTextColor={theme.colors.outline}
                  value={form.pan}
                  onChangeText={(v) => setForm({ ...form, pan: v.toUpperCase().slice(0, 10) })}
                  autoCapitalize="characters"
                  maxLength={10}
                />
              </View>
            </View>

            {/* DOB */}
            <View style={{ marginBottom: 20 }}>
              <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }]}>Date of Birth</Text>
              <View style={[styles.inputRow, { backgroundColor: theme.colors.surfaceContainerLow, borderColor: theme.colors.outlineVariant }]}>
                <Ionicons name="calendar-outline" size={18} color={theme.colors.outline} />
                <TextInput
                  style={[Typography.bodyMD, styles.input, { color: theme.colors.onSurface }]}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor={theme.colors.outline}
                  value={form.dob}
                  onChangeText={(v) => setForm({ ...form, dob: v })}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <PrimaryButton label="Submit KYC Documents" onPress={handleSubmit} loading={submitting} iconName="arrow-forward" />
          </GlassCard>
        )}

        {/* Step 3 success state */}
        {step === 3 && !isVerified && (
          <GlassCard padding={20} style={{ marginBottom: 16 }}>
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="time" size={40} color="#F59E0B" />
              <Text style={[Typography.headlineMD, { color: theme.colors.onSurface, marginTop: 12, marginBottom: 6, textAlign: 'center' }]}>Documents Submitted</Text>
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, textAlign: 'center', lineHeight: 22 }]}>
                Your KYC is under review. You'll be notified once verified.
              </Text>
            </View>
          </GlassCard>
        )}

        {/* Security notice */}
        <GlassCard style={{ marginBottom: 20, borderColor: isDark ? 'rgba(100,255,218,0.15)' : 'rgba(20,184,166,0.2)' }} padding={14}>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            <Ionicons name="shield-checkmark" size={18} color={theme.colors.accent} style={{ marginTop: 1 }} />
            <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, fontSize: 13, lineHeight: 20, flex: 1 }]}>
              Your documents are encrypted with AES-256 and stored in a zero-knowledge architecture. We never share your KYC data with third parties.
            </Text>
          </View>
        </GlassCard>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 16 },
  stepsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  stepItem: { alignItems: 'center', width: 80 },
  stepCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  stepLine: { flex: 1, height: 2, marginBottom: 20, maxWidth: 36 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  input: { flex: 1, padding: 0 },
  successIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
});
