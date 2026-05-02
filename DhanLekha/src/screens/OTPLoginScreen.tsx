import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
  ActivityIndicator, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { Typography } from '../theme/typography';

type Step = 'phone' | 'otp';

export const OTPLoginScreen = () => {
  const { theme, isDark } = useTheme();
  const { login } = useAuth();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<Array<TextInput | null>>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [step]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length > 10) return `+${digits}`;
    if (digits.length === 10) return `+91${digits}`;
    return `+${digits}`;
  };

  const handleSendOTP = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) { Alert.alert('Invalid phone', 'Enter a valid 10-digit mobile number.'); return; }
    setLoading(true);
    try {
      await authApi.sendOTP(formatPhone(digits));
      fadeAnim.setValue(0);
      setStep('otp');
      setCountdown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 300);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (val: string, idx: number) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
    if (!val && idx > 0) otpRefs.current[idx - 1]?.focus();
    if (next.every((d) => d !== '') && next.join('').length === 6) {
      verifyOTP(next.join(''));
    }
  };

  const verifyOTP = async (code: string) => {
    setLoading(true);
    try {
      const res = await authApi.verifyOTP(formatPhone(phone.replace(/\D/g, '')), code);
      await login(res.accessToken, res.refreshToken, res.user as any);
    } catch (e: any) {
      Alert.alert('Invalid OTP', e.message);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={isDark ? ['#0B0F10', '#0A192F', '#101415'] : ['#EFF6FF', '#F0FDFA', '#F8FAFC']}
      style={styles.bg}
    >
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {/* Logo Section - Smaller on OTP step to save space */}
            <View style={[styles.logoSection, step === 'otp' && { marginBottom: 20, marginTop: 20 }]}>
              <View style={[
                styles.logoBox, 
                { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(10,25,47,0.08)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(10,25,47,0.12)' },
                step === 'otp' && { width: 60, height: 60, borderRadius: 18 }
              ]}>
                <MaterialIcons name="shield" size={step === 'otp' ? 30 : 40} color={isDark ? '#64FFDA' : '#0A192F'} />
              </View>
              <Text style={[Typography.displayXL, styles.appName, { color: isDark ? '#64FFDA' : '#0A192F', fontSize: step === 'otp' ? 22 : 28 }]}>DhanLekha</Text>
              <Text style={[Typography.labelSM, { color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(10,25,47,0.45)', letterSpacing: 2, fontSize: step === 'otp' ? 10 : 12 }]}>WEALTH VAULT</Text>
            </View>

            <Animated.View style={{ opacity: fadeAnim }}>
              {step === 'phone' ? (
                <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.cardBorder }]}>
                  <Text style={[Typography.headlineLG, { color: theme.colors.onSurface, marginBottom: 6 }]}>Welcome</Text>
                  <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, marginBottom: 24 }]}>Enter your mobile number to continue</Text>

                  <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }]}>Mobile Number</Text>
                  <View style={[styles.inputRow, { backgroundColor: theme.colors.surfaceContainerLow, borderColor: theme.colors.outlineVariant }]}>
                    <View style={[styles.countryCode, { borderRightColor: theme.colors.outlineVariant }]}>
                      <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600' }]}>🇮🇳 +91</Text>
                    </View>
                    <TextInput
                      style={[Typography.bodyMD, styles.input, { color: theme.colors.onSurface }]}
                      placeholder="Enter 10-digit number"
                      placeholderTextColor={theme.colors.outline}
                      value={phone}
                      onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 10))}
                      keyboardType="phone-pad"
                      returnKeyType="done"
                      onSubmitEditing={handleSendOTP}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: theme.colors.accent, opacity: loading ? 0.8 : 1 }]}
                    onPress={handleSendOTP}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading
                      ? <ActivityIndicator color={isDark ? '#0A192F' : '#fff'} />
                      : <Text style={[Typography.headlineMD, { color: isDark ? '#0A192F' : '#fff', fontSize: 15 }]}>Send OTP</Text>
                    }
                  </TouchableOpacity>

                  <Text style={[Typography.labelSM, styles.disclaimer, { color: theme.colors.onSurfaceVariant }]}>
                    By continuing, you agree to our Terms & Privacy Policy
                  </Text>
                </View>
              ) : (
                <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.cardBorder }]}>
                  <TouchableOpacity style={styles.backBtn} onPress={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); }}>
                    <Ionicons name="arrow-back" size={20} color={theme.colors.accent} />
                    <Text style={[Typography.labelSM, { color: theme.colors.accent, marginLeft: 6, textTransform: 'uppercase' }]}>Change Number</Text>
                  </TouchableOpacity>

                  <Text style={[Typography.headlineLG, { color: theme.colors.onSurface, marginBottom: 6, marginTop: 12 }]}>Verify OTP</Text>
                  <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, marginBottom: 28 }]}>
                    Sent to +91 {phone}
                  </Text>

                  {/* OTP Boxes */}
                  <View style={styles.otpRow}>
                    {otp.map((digit, idx) => (
                      <TextInput
                        key={idx}
                        ref={(r) => { otpRefs.current[idx] = r; }}
                        style={[
                          styles.otpBox,
                          {
                            backgroundColor: theme.colors.surfaceContainerLow,
                            borderColor: digit ? theme.colors.accent : theme.colors.outlineVariant,
                            color: theme.colors.onSurface,
                          },
                        ]}
                        value={digit}
                        onChangeText={(v) => handleOTPChange(v, idx)}
                        keyboardType="numeric"
                        maxLength={1}
                        textAlign="center"
                        selectTextOnFocus
                      />
                    ))}
                  </View>

                  {loading && (
                    <View style={{ alignItems: 'center', marginVertical: 16 }}>
                      <ActivityIndicator color={theme.colors.accent} />
                      <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 8 }]}>Verifying...</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.resendBtn, { opacity: countdown > 0 ? 0.4 : 1 }]}
                    disabled={countdown > 0}
                    onPress={handleSendOTP}
                  >
                    <Text style={[Typography.bodyMD, { color: theme.colors.accent }]}>
                      {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>

            {/* Trust signals */}
            <View style={styles.trustRow}>
              {[
                { icon: 'shield-checkmark-outline' as const, label: 'AES-256 Encrypted' },
                { icon: 'lock-closed-outline' as const, label: 'Zero-Knowledge' },
                { icon: 'cube-outline' as const, label: 'Blockchain Verified' },
              ].map((t) => (
                <View key={t.label} style={styles.trustItem}>
                  <Ionicons name={t.icon} size={16} color={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(10,25,47,0.35)'} />
                  <Text style={[Typography.labelSM, { color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(10,25,47,0.35)', marginLeft: 5, fontSize: 10 }]}>{t.label}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 40 },
  logoSection: { alignItems: 'center', marginBottom: 36 },
  logoBox: { width: 80, height: 80, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  appName: { textAlign: 'center', marginBottom: 4 },
  card: { borderRadius: 24, borderWidth: 1, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 20 },
  countryCode: { paddingHorizontal: 14, paddingVertical: 13, borderRightWidth: 1 },
  input: { flex: 1, paddingHorizontal: 14, paddingVertical: 13 },
  primaryBtn: { borderRadius: 999, paddingVertical: 15, alignItems: 'center', marginBottom: 16 },
  disclaimer: { textAlign: 'center', lineHeight: 18 },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  otpBox: { width: 46, height: 56, borderRadius: 12, borderWidth: 2, fontSize: 22, fontWeight: '700' },
  resendBtn: { alignItems: 'center', paddingVertical: 8 },
  trustRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 28 },
  trustItem: { flexDirection: 'row', alignItems: 'center' },
});
