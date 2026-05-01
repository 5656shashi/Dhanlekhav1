import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { GlassCard } from '../components/GlassCard';
import { Header } from '../components/Header';
import { PrimaryButton } from '../components/PrimaryButton';
import { Badge } from '../components/Badge';
import { Typography } from '../theme/typography';
import { SafeAreaView } from 'react-native-safe-area-context';

const EXTRACTED_FIELDS = [
  { key: 'Document Type', value: 'Life Insurance Policy', confidence: 99 },
  { key: 'Policy Number', value: 'POL-2023-8901X', confidence: 98, mono: true },
  { key: 'Holder Name', value: 'Arjun Mehta', confidence: 96 },
  { key: 'Expiry Date', value: '14 Oct 2045', confidence: 94 },
  { key: 'Sum Assured', value: '₹1,00,00,000', confidence: 97 },
  { key: 'Premium', value: '₹48,000 / year', confidence: 93 },
];

export const AIDocumentProcessingScreen = ({ navigation }: any) => {
  const { theme, isDark } = useTheme();
  const [processing, setProcessing] = useState(true);
  const [progress, setProgress] = useState(0);
  const scanAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Scanning line animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();

    // Pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    // Progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setProcessing(false);
          return 100;
        }
        return prev + 8;
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  const scanY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 220],
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <Header title="AI Processing" showBack onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={[Typography.headlineLG, { color: theme.colors.onSurface, marginTop: 16, marginBottom: 4 }]}>
          AI Processing
        </Text>
        <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, marginBottom: 20 }]}>
          Extracting structured data from your uploaded document using neural network models.
        </Text>

        {/* Document Preview with Scan Effect */}
        <GlassCard style={styles.docPreviewCard} padding={0}>
          <View style={styles.docPreviewInner}>
            {/* Simulated document */}
            <View style={[styles.simulatedDoc, { backgroundColor: theme.colors.surfaceContainerHigh }]}>
              {[...Array(8)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.docLine,
                    {
                      backgroundColor: theme.colors.outlineVariant + '80',
                      width: i % 3 === 0 ? '70%' : i % 3 === 1 ? '90%' : '55%',
                    },
                  ]}
                />
              ))}
              <View style={[styles.docSeal, { backgroundColor: theme.colors.accent + '20', borderColor: theme.colors.accent + '30' }]}>
                <Ionicons name="shield-checkmark" size={22} color={theme.colors.accent} />
              </View>
            </View>

            {/* Scan overlay */}
            {processing && (
              <>
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      backgroundColor: theme.colors.accent,
                      shadowColor: theme.colors.accent,
                      transform: [{ translateY: scanY }],
                    },
                  ]}
                />
                <View style={[styles.scanGlow, { backgroundColor: theme.colors.accent + '18' }]} />
              </>
            )}

            {/* Processing badge */}
            <View style={[styles.processingBadge, { backgroundColor: theme.colors.surfaceContainer, borderColor: theme.colors.outlineVariant }]}>
              <Ionicons name={processing ? 'scan-outline' : 'checkmark-circle'} size={14} color={processing ? theme.colors.accent : '#10B981'} />
              <Text style={[Typography.labelSM, { color: processing ? theme.colors.accent : '#10B981', marginLeft: 5, textTransform: 'uppercase', letterSpacing: 0.8 }]}>
                {processing ? 'Processing' : 'Complete'}
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={[styles.progressTrack, { backgroundColor: theme.colors.outlineVariant + '40' }]}>
            <Animated.View
              style={[
                styles.progressFill,
                { width: `${progress}%`, backgroundColor: theme.colors.accent },
              ]}
            />
          </View>
          <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant }]}>
                {processing ? 'Analyzing document...' : 'Extraction complete'}
              </Text>
              <Text style={[Typography.labelSM, { color: theme.colors.accent }]}>{progress}%</Text>
            </View>
          </View>
        </GlassCard>

        {/* Extracted Data */}
        {!processing && (
          <>
            <GlassCard style={{ marginTop: 16 }} padding={16}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.cardBorder, paddingBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="layers-outline" size={20} color={theme.colors.accent} />
                  <Text style={[Typography.headlineMD, { color: theme.colors.onSurface }]}>
                    Extracted Data
                  </Text>
                </View>
                <Badge
                  label="High Confidence"
                  color="#10B981"
                  backgroundColor="rgba(16,185,129,0.1)"
                  borderColor="rgba(16,185,129,0.2)"
                  iconName="checkmark-circle"
                />
              </View>

              <View style={styles.fieldsGrid}>
                {EXTRACTED_FIELDS.map((field) => (
                  <View
                    key={field.key}
                    style={[styles.fieldItem, { backgroundColor: theme.colors.surfaceContainer + '80', borderColor: theme.colors.cardBorder }]}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', flex: 1 }]}>
                        {field.key}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                        <Ionicons name="flash" size={10} color={theme.colors.accent} />
                        <Text style={[Typography.labelSM, { color: theme.colors.accent }]}>
                          {field.confidence}%
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        field.mono ? Typography.mono : Typography.bodyMD,
                        { color: theme.colors.onSurface, fontWeight: '600' },
                      ]}
                    >
                      {field.value}
                    </Text>
                  </View>
                ))}
              </View>
            </GlassCard>

            {/* Blockchain footer */}
            <View style={[styles.chainBadge, { backgroundColor: isDark ? 'rgba(173,198,255,0.06)' : 'rgba(99,102,241,0.06)', borderColor: isDark ? 'rgba(173,198,255,0.15)' : 'rgba(99,102,241,0.15)' }]}>
              <Ionicons name="lock-closed" size={16} color={isDark ? '#ADC6FF' : '#6366F1'} />
              <Text style={[Typography.bodyMD, { color: isDark ? '#ADC6FF' : '#6366F1', marginLeft: 8 }]}>
                Verified & Stored on Blockchain
              </Text>
            </View>

            <PrimaryButton
              label="Confirm Details"
              onPress={() => navigation.navigate('BlockchainVerification')}
              iconName="arrow-forward"
              style={{ marginBottom: 20 }}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 100 },
  docPreviewCard: { borderRadius: 20, overflow: 'hidden' },
  docPreviewInner: {
    height: 240,
    margin: 14,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  simulatedDoc: {
    width: '85%',
    height: '90%',
    borderRadius: 8,
    padding: 16,
    gap: 10,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  docLine: {
    height: 6,
    borderRadius: 3,
  },
  docSeal: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  scanGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 60,
    top: '30%',
  },
  processingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  progressTrack: {
    height: 4,
    marginHorizontal: 14,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: { height: '100%', borderRadius: 2 },
  fieldsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  fieldItem: {
    width: '48%',
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  chainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    marginVertical: 14,
  },
});
