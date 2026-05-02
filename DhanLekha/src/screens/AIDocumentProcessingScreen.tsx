import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated, Alert, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { GlassCard } from '../components/GlassCard';
import { Header } from '../components/Header';
import { PrimaryButton } from '../components/PrimaryButton';
import { Badge } from '../components/Badge';
import { PaymentSheet } from '../components/PaymentSheet';
import { Typography } from '../theme/typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { documentsApi } from '../services/api';
import * as DocumentPicker from 'expo-document-picker';

const DOC_TYPES = [
  { id: 'INSURANCE', label: 'Life Insurance', icon: 'shield-outline' as const, color: '#8B5CF6' },
  { id: 'FIXED_DEPOSIT', label: 'Fixed Deposit', icon: 'wallet-outline' as const, color: '#14B8A6' },
  { id: 'PROPERTY', label: 'Property Deed', icon: 'home-outline' as const, color: '#3B82F6' },
  { id: 'MUTUAL_FUND', label: 'Mutual Fund', icon: 'pie-chart-outline' as const, color: '#6366F1' },
  { id: 'STOCK_CERTIFICATE', label: 'Stock Cert.', icon: 'trending-up-outline' as const, color: '#F59E0B' },
  { id: 'WILL', label: 'Will / Testament', icon: 'document-text-outline' as const, color: '#EF4444' },
  { id: 'OTHER', label: 'Other', icon: 'document-outline' as const, color: '#94A3B8' },
];

const TITLE_MAP: Record<string, string> = {
  INSURANCE: 'Life Insurance Policy', FIXED_DEPOSIT: 'Fixed Deposit Receipt',
  PROPERTY: 'Property Deed', MUTUAL_FUND: 'Mutual Fund Statement',
  STOCK_CERTIFICATE: 'Stock Certificate', WILL: 'Will / Testament', OTHER: 'Document',
};

export const AIDocumentProcessingScreen = ({ navigation, route }: any) => {
  const { theme, isDark } = useTheme();
  const documentId: string | undefined = route?.params?.documentId;

  const [phase, setPhase] = useState<'select' | 'uploading' | 'processing' | 'done' | 'failed'>('select');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);
  const [ocrData, setOcrData] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [docId, setDocId] = useState<string | undefined>(documentId);
  const [showPayment, setShowPayment] = useState(false);
  const [anchoring, setAnchoring] = useState(false);

  const scanAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (phase !== 'uploading' && phase !== 'processing') return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(scanAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
      Animated.timing(scanAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [phase]);

  useEffect(() => {
    Animated.timing(progressAnim, { toValue: progress / 100, duration: 300, useNativeDriver: false }).start();
  }, [progress]);

  useEffect(() => {
    if (documentId) { setPhase('processing'); pollOCR(documentId); }
  }, []);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled) {
        setSelectedFile(result);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not pick document');
    }
  };

  const handleInitialUpload = async () => {
    if (!selectedFile || selectedFile.canceled) return;
    
    setPhase('uploading');
    setProgress(10);
    try {
      const file = selectedFile.assets[0];
      const formData = new FormData();
      formData.append('title', TITLE_MAP[selectedType || 'OTHER']);
      formData.append('docType', selectedType || 'OTHER');
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
      } as any);

      setProgress(40);
      const result = await documentsApi.upload(formData);
      setDocId(result.id);
      setPhase('processing');
      setProgress(60);
      pollOCR(result.id);
    } catch (e: any) {
      Alert.alert('Upload Error', e.message);
      setPhase('select');
    }
  };

  const pollOCR = (id: string) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      setProgress(Math.min(95, 60 + attempts * 5));
      try {
        const result = await documentsApi.getOCR(id);
        if (result.ocrStatus === 'COMPLETED') {
          clearInterval(interval);
          setProgress(100);
          setOcrData(result.ocrData);
          setPhase('done');
        } else if (result.ocrStatus === 'FAILED') {
          clearInterval(interval);
          Alert.alert('Processing Failed', 'AI could not read this document clearly.');
          setPhase('select');
        }
      } catch {
        if (attempts > 20) { clearInterval(interval); setPhase('select'); }
      }
    }, 2000);
  };

  const handlePaymentSuccess = async (transactionId: string) => {
    setShowPayment(false);
    setAnchoring(true);
    try {
      // Trigger blockchain anchoring with the payment link
      await documentsApi.submitToBlockchain(docId!);
      Alert.alert('Success', 'Payment verified! Document is being permanently anchored to Polygon.');
      navigation.navigate('BlockchainVerification', { documentId: docId! });
    } catch (e: any) {
      Alert.alert('Anchoring Error', e.message);
    } finally {
      setAnchoring(false);
    }
  };

  const handlePaymentFailure = (error: string) => {
    setShowPayment(false);
    setErrorMsg(error);
    setPhase('failed');
  };

  const scanY = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 200] });
  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <Header title="AI Processing" showBack onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <Text style={[Typography.headlineLG, { color: theme.colors.onSurface, marginTop: 16, marginBottom: 4 }]}>
          AI Document Vault
        </Text>
        <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, marginBottom: 20 }]}>
          Upload your document to extract data using LM Studio LLM and anchor it permanently to the blockchain.
        </Text>

        {/* Phase: Failed */}
        {phase === 'failed' && (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#EF444415', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <Ionicons name="alert-circle" size={64} color="#EF4444" />
            </View>
            <Text style={[Typography.headlineLG, { color: '#EF4444', textAlign: 'center' }]}>Infrastructure Failure</Text>
            <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 12, paddingHorizontal: 20 }]}>
              The payment gateway connection was terminated due to a detected security anomaly. The vault remains locked.
            </Text>
            
            <GlassCard padding={16} style={{ marginTop: 24, width: '100%', borderColor: '#EF444440', borderWidth: 1 }}>
              <Text style={[styles.mono, { color: '#EF4444', fontSize: 11 }]}>{errorMsg}</Text>
            </GlassCard>

            <PrimaryButton 
              label="Return to Security Lab" 
              onPress={() => navigation.navigate('SecurityLab')}
              style={{ marginTop: 32, width: '100%' }}
            />
          </View>
        )}

        {/* Phase: Select */}
        {phase === 'select' && phase !== 'failed' && (
          <>
            <Text style={[Typography.headlineMD, { color: theme.colors.onSurface, marginBottom: 12 }]}>1. Select Document Type</Text>
            <View style={styles.typeGrid}>
              {DOC_TYPES.map((dt) => {
                const sel = selectedType === dt.id;
                return (
                  <TouchableOpacity
                    key={dt.id}
                    style={[styles.typeCard, {
                      backgroundColor: sel ? dt.color + '15' : theme.colors.surfaceContainer,
                      borderColor: sel ? dt.color : theme.colors.cardBorder,
                      borderWidth: sel ? 2 : 1,
                    }]}
                    onPress={() => setSelectedType(dt.id)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.typeIcon, { backgroundColor: dt.color + '18' }]}>
                      <Ionicons name={dt.icon} size={22} color={dt.color} />
                    </View>
                    <Text style={[Typography.labelSM, { color: sel ? dt.color : theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8, lineHeight: 16 }]}>
                      {dt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[Typography.headlineMD, { color: theme.colors.onSurface, marginBottom: 12 }]}>2. Choose File</Text>
            <TouchableOpacity 
              style={[styles.picker, { borderColor: selectedFile ? theme.colors.accent : theme.colors.cardBorder, backgroundColor: theme.colors.surfaceContainer }]} 
              onPress={pickDocument}
            >
              <Ionicons name={selectedFile ? 'document-text' : 'cloud-upload-outline'} size={32} color={selectedFile ? theme.colors.accent : theme.colors.onSurfaceVariant} />
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, marginTop: 8, fontWeight: '600' }]}>
                {selectedFile && !selectedFile.canceled ? selectedFile.assets[0].name : 'Select PDF or Image'}
              </Text>
              <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 4 }]}>Max 10MB</Text>
            </TouchableOpacity>

            <PrimaryButton
              label="Upload & AI Process →"
              onPress={handleInitialUpload}
              disabled={!selectedType || !selectedFile}
              style={{ marginTop: 20 }}
            />
          </>
        )}

        {/* Phase: Uploading / Processing */}
        {(phase === 'uploading' || phase === 'processing') && phase !== 'failed' && (
          <GlassCard style={styles.previewCard} padding={0}>
            <View style={styles.previewInner}>
              <View style={[styles.simDoc, { backgroundColor: theme.colors.surfaceContainerHigh }]}>
                {[...Array(8)].map((_, i) => (
                  <View key={i} style={[styles.docLine, { backgroundColor: theme.colors.outlineVariant + '80', width: i % 3 === 0 ? '70%' : i % 3 === 1 ? '90%' : '55%' }]} />
                ))}
              </View>
              <Animated.View style={[styles.scanLine, { backgroundColor: theme.colors.accent, transform: [{ translateY: scanY }] }]} />
              <View style={[styles.processBadge, { backgroundColor: theme.colors.surfaceContainer, borderColor: theme.colors.outlineVariant }]}>
                <Ionicons name="scan-outline" size={14} color={theme.colors.accent} />
                <Text style={[Typography.labelSM, { color: theme.colors.accent, marginLeft: 5 }]}>
                  {phase === 'uploading' ? 'UPLOADING...' : 'AI PARSING (LM STUDIO)...'}
                </Text>
              </View>
            </View>
            <View style={styles.progTrack}>
              <Animated.View style={[styles.progFill, { width: progressWidth, backgroundColor: theme.colors.accent }]} />
            </View>
            <View style={{ padding: 14 }}>
              <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant }]}>
                Processing with LM Studio Local LLM...
              </Text>
            </View>
          </GlassCard>
        )}

        {/* Phase: Done */}
        {phase === 'done' && phase !== 'failed' && (
          <>
            {/* Inference Decision Block */}
            <View style={{ marginBottom: 20 }}>
              <GlassCard padding={16} style={{ borderColor: ocrData.isValid ? '#10B981' : '#EF4444', borderWidth: 1.5 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <Ionicons 
                    name={ocrData.isValid ? "checkmark-circle" : "warning"} 
                    size={24} 
                    color={ocrData.isValid ? "#10B981" : "#EF4444"} 
                  />
                  <Text style={[Typography.headlineMD, { marginLeft: 8, color: theme.colors.onSurface }]}>
                    AI Audit Inference
                  </Text>
                </View>
                <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, fontStyle: 'italic', marginBottom: 12 }]}>
                  "{ocrData.reasoning || ocrData.summary || "No specific reasoning provided by AI."}"
                </Text>
                
                {/* Logical Warning for Nulls */}
                {ocrData.isValid && (!ocrData.extractedData?.name || ocrData.extractedData?.name === 'null') && (
                  <View style={{ backgroundColor: 'rgba(245,158,11,0.1)', padding: 10, borderRadius: 8, marginTop: 4 }}>
                    <Text style={[Typography.labelSM, { color: '#F59E0B' }]}>
                      ⚠️ PARTIAL EXTRACTION: Critical fields (Name/ID) missing. Manual oversight recommended.
                    </Text>
                  </View>
                )}
              </GlassCard>
            </View>

            <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }]}>
              Extracted Identity Data
            </Text>
            <GlassCard padding={16} style={{ marginBottom: 16 }}>
              {ocrData.extractedData ? (
                <View style={styles.fieldsGrid}>
                  {Object.entries(ocrData.extractedData).map(([subK, subV]) => {
                    if (subK === 'summary') return null; // Show elsewhere
                    const isMissing = !subV || subV === 'null';
                    return (
                      <View key={subK} style={[styles.fieldItem, { 
                        backgroundColor: isMissing ? 'rgba(239,68,68,0.05)' : theme.colors.surfaceContainer + '50', 
                        borderColor: isMissing ? 'rgba(239,68,68,0.2)' : theme.colors.cardBorder 
                      }]}>
                        <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', fontSize: 10 }]}>{subK.replace(/_/g, ' ')}</Text>
                        <Text style={[Typography.bodyMD, { color: isMissing ? theme.colors.outline : theme.colors.onSurface, fontWeight: '600', marginTop: 2 }]}>
                          {isMissing ? 'NOT FOUND' : String(subV)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant }]}>No identity data extracted</Text>
              )}
            </GlassCard>

            <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }]}>
              Audit Metadata
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
              <View style={[styles.metaSmall, { backgroundColor: theme.colors.surfaceContainer }]}>
                <Text style={Typography.labelSM}>Confidence</Text>
                <Text style={[Typography.headlineMD, { color: theme.colors.accent }]}>{ocrData.confidence || '0.5'}</Text>
              </View>
              <View style={[styles.metaSmall, { flex: 2, backgroundColor: theme.colors.surfaceContainer }]}>
                <Text style={Typography.labelSM}>AI Model Used</Text>
                <Text style={Typography.bodyMD} numberOfLines={1}>{ocrData.modelUsed || 'LM-Studio'}</Text>
              </View>
            </View>

            <View style={{ gap: 12 }}>
              <PrimaryButton
                label={anchoring ? 'Anchoring...' : 'Approve & Anchor (₹5)'}
                onPress={() => setShowPayment(true)}
                disabled={anchoring}
                iconName="shield-checkmark-outline"
              />
              <TouchableOpacity 
                style={[styles.outlineBtn, { borderColor: theme.colors.outline }]} 
                onPress={() => setPhase('select')}
              >
                <Text style={[Typography.bodyMD, { color: theme.colors.onSurface }]}>Reject & Re-upload</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      <PaymentSheet
        visible={showPayment}
        purpose="DOCUMENT_UPLOAD"
        onSuccess={handlePaymentSuccess}
        onFailure={handlePaymentFailure}
        onCancel={() => setShowPayment(false)}
        metadata={{ documentId: docId! }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  typeCard: { width: '31%', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1 },
  typeIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  picker: { height: 120, borderRadius: 16, borderStyle: 'dashed', borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  previewCard: { borderRadius: 20, overflow: 'hidden' },
  previewInner: { height: 200, margin: 14, borderRadius: 12, overflow: 'hidden', position: 'relative', alignItems: 'center', justifyContent: 'center' },
  simDoc: { width: '80%', height: '85%', borderRadius: 8, padding: 16, gap: 10 },
  docLine: { height: 6, borderRadius: 3 },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 2, opacity: 0.8 },
  processBadge: { position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center', borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  progTrack: { height: 4, marginHorizontal: 14, borderRadius: 2, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.1)' },
  progFill: { height: '100%', borderRadius: 2 },
  fieldsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fieldItem: { width: '48%', borderRadius: 10, borderWidth: 1, padding: 12 },
  priceIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  metaSmall: { flex: 1, padding: 12, borderRadius: 12 },
  outlineBtn: { paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  mono: { fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: -0.5 },
});
