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
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { GlassCard } from '../components/GlassCard';
import { Header } from '../components/Header';
import { PrimaryButton } from '../components/PrimaryButton';
import { Typography } from '../theme/typography';
import { SafeAreaView } from 'react-native-safe-area-context';

const STEPS = [
  { id: 1, label: 'Identity', icon: 'person-outline' as const, done: true },
  { id: 2, label: 'Documents', icon: 'document-text-outline' as const, done: false, active: true },
  { id: 3, label: 'Biometric', icon: 'finger-print' as const, done: false },
];

export const KYCVerificationScreen = ({ navigation }: any) => {
  const { theme, isDark } = useTheme();
  const [form, setForm] = useState({
    aadhaar: '',
    pan: '',
    dob: '',
  });
  const [uploading, setUploading] = useState(false);

  const handleNext = () => {
    if (!form.aadhaar || !form.pan) {
      Alert.alert('Required', 'Please fill Aadhaar and PAN number.');
      return;
    }
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      Alert.alert(
        'KYC Submitted',
        'Your KYC documents have been submitted for verification. You will be notified within 24 hours.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }, 1500);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <Header title="Identity Vault" showBack onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Progress Steps */}
        <View style={styles.stepsRow}>
          {STEPS.map((step, idx) => (
            <React.Fragment key={step.id}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    step.done
                      ? { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent }
                      : step.active
                      ? { backgroundColor: 'transparent', borderColor: theme.colors.accent, borderWidth: 2 }
                      : { backgroundColor: theme.colors.surfaceContainerHigh, borderColor: theme.colors.outlineVariant, borderWidth: 1 },
                  ]}
                >
                  {step.done ? (
                    <Ionicons name="checkmark" size={16} color={isDark ? '#0A192F' : '#fff'} />
                  ) : (
                    <Ionicons name={step.icon} size={16} color={step.active ? theme.colors.accent : theme.colors.onSurfaceVariant} />
                  )}
                </View>
                <Text style={[Typography.labelSM, { color: step.done || step.active ? theme.colors.accent : theme.colors.onSurfaceVariant, marginTop: 4, textTransform: 'uppercase' }]}>
                  {step.label}
                </Text>
              </View>
              {idx < STEPS.length - 1 && (
                <View style={[styles.stepLine, { backgroundColor: idx === 0 ? theme.colors.accent : theme.colors.outlineVariant }]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Form Card */}
        <GlassCard style={{ marginBottom: 16 }} padding={20}>
          <Text style={[Typography.headlineMD, { color: theme.colors.onSurface, marginBottom: 4, textAlign: 'center' }]}>
            Upload KYC Documents
          </Text>
          <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, textAlign: 'center', marginBottom: 20 }]}>
            Please provide your government-issued identity details
          </Text>

          {/* Aadhaar */}
          <View style={{ marginBottom: 16 }}>
            <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }]}>
              Aadhaar Number *
            </Text>
            <View style={[styles.inputRow, { backgroundColor: theme.colors.surfaceContainerLow, borderColor: theme.colors.outlineVariant }]}>
              <Ionicons name="card-outline" size={18} color={theme.colors.outline} />
              <TextInput
                style={[Typography.bodyMD, styles.input, { color: theme.colors.onSurface }]}
                placeholder="XXXX XXXX XXXX"
                placeholderTextColor={theme.colors.outline}
                value={form.aadhaar}
                onChangeText={(v) => setForm({ ...form, aadhaar: v })}
                keyboardType="numeric"
                maxLength={14}
              />
            </View>
          </View>

          {/* PAN */}
          <View style={{ marginBottom: 16 }}>
            <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }]}>
              PAN Number *
            </Text>
            <View style={[styles.inputRow, { backgroundColor: theme.colors.surfaceContainerLow, borderColor: theme.colors.outlineVariant }]}>
              <Ionicons name="document-outline" size={18} color={theme.colors.outline} />
              <TextInput
                style={[Typography.bodyMD, styles.input, { color: theme.colors.onSurface }]}
                placeholder="ABCDE1234F"
                placeholderTextColor={theme.colors.outline}
                value={form.pan}
                onChangeText={(v) => setForm({ ...form, pan: v.toUpperCase() })}
                autoCapitalize="characters"
                maxLength={10}
              />
            </View>
          </View>

          {/* DOB */}
          <View style={{ marginBottom: 16 }}>
            <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }]}>
              Date of Birth
            </Text>
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

          {/* Upload buttons */}
          <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }]}>
            Document Photos
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
            {['Aadhaar Front', 'Aadhaar Back', 'PAN Card'].map((doc) => (
              <TouchableOpacity
                key={doc}
                style={[styles.uploadBtn, { backgroundColor: theme.colors.surfaceContainer, borderColor: theme.colors.outlineVariant }]}
                onPress={() => Alert.alert('Upload', `Tap to upload ${doc}`)}
              >
                <Ionicons name="cloud-upload-outline" size={20} color={theme.colors.onSurfaceVariant} />
                <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 4, textAlign: 'center' }]}>
                  {doc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        {/* Security Notice */}
        <GlassCard style={{ marginBottom: 20, borderColor: isDark ? 'rgba(100,255,218,0.15)' : 'rgba(20,184,166,0.2)' }} padding={14}>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            <Ionicons name="shield-checkmark" size={18} color={theme.colors.accent} style={{ marginTop: 1 }} />
            <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, fontSize: 13, lineHeight: 20, flex: 1 }]}>
              Your documents are encrypted with AES-256 and stored in a zero-knowledge architecture. We never share your KYC data with third parties.
            </Text>
          </View>
        </GlassCard>

        <PrimaryButton
          label="Submit KYC Documents"
          onPress={handleNext}
          loading={uploading}
          iconName="arrow-forward"
          style={{ marginBottom: 20 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 100, paddingTop: 16 },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  stepItem: { alignItems: 'center', width: 70 },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginBottom: 20,
    maxWidth: 40,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  input: { flex: 1, padding: 0 },
  uploadBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingVertical: 14,
    gap: 4,
  },
});
