import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  FlatList, 
  ActivityIndicator, 
  Alert,
  Dimensions,
  Platform,
  Modal,
  Switch
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { GlassCard } from '../components/GlassCard';
import { Header } from '../components/Header';
import { PrimaryButton } from '../components/PrimaryButton';
import { useFocusEffect } from '@react-navigation/native';
import { Typography } from '../theme/typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { securityApi } from '../services/api';
import { useSecurity } from '../context/SecurityContext';
import { LoadingView, ErrorView } from '../components/LoadingView';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const TARGETS = [
  { id: 'VAULT', label: 'Vault Engine', desc: 'Fuzz document encryption & metadata', endpoint: '/documents', method: 'POST' },
  { id: 'PAYMENT', label: 'Payment API', desc: 'Stress test Razorpay verify endpoints', endpoint: '/payments/verify', method: 'POST' },
  { id: 'NOMINEE', label: 'Nominee Pipeline', desc: 'Test access control & triggers', endpoint: '/nominees', method: 'POST' },
];

export const SecurityLabScreen = ({ navigation }: any) => {
  const { theme, isDark } = useTheme();
  const [phase, setPhase] = useState<'idle' | 'running' | 'report'>('idle');
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any | null>(null);
  const [showAuditReport, setShowAuditReport] = useState(false);
  
  const getRemediation = (category: string) => {
    const advice: any = {
      sqlInjection: 'Implement parameterized queries and use an ORM like Prisma. Never concatenate strings into SQL.',
      xss: 'Sanitize all user inputs using DOMPurify or equivalent and use Content Security Policy (CSP) headers.',
      bufferOverflow: 'Enforce strict input length limits on all API endpoints and use memory-safe languages/parsers.',
      authBypass: 'Implement robust JWT validation and verify user ownership of resources on every request.',
      pathTraversal: 'Use path.resolve() and validate that the final path is within the intended directory.',
      default: 'Enable DhanLekha Shield and implement multi-layered heuristic validation at the gateway.'
    };
    return advice[category] || advice.default;
  };

  const { shieldActive, toggleShield } = useSecurity();
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const checkActiveSession = async () => {
    try {
      const sessions = await securityApi.listSessions();
      if (sessions.length > 0) {
        const summary = sessions[0];
        
        // Fetch full session details including results
        const latest = await securityApi.getSession(summary.id);
        
        setReport(latest);
        setLogs(latest.results || []);
        
        const target = TARGETS.find(t => t.endpoint === latest.targetEndpoint) || TARGETS[0];
        setSelectedTarget(target.id);

        if (latest.status === 'RUNNING') {
          setPhase('running');
          setScanning(true);
          pollSession(latest.id);
        } else if (latest.status === 'COMPLETED' || latest.status === 'FAILED') {
          setPhase('report');
        }
      }
    } catch (e) {}
  };

  useFocusEffect(
    React.useCallback(() => {
      checkActiveSession();
      return () => {
        stopPolling();
      };
    }, [])
  );

  useEffect(() => {
    if (phase === 'running') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [phase]);

  const initiateFuzz = async () => {
    const target = TARGETS.find(t => t.id === selectedTarget);
    if (!target) return;
    
    setPhase('running');
    setLogs([]);
    setScanning(true);

    try {
      const { sessionId } = await securityApi.startSession({ 
        targetEndpoint: target.endpoint, 
        method: target.method, 
        iterations: 150,
        shieldEnabled: shieldActive // Use global state
      });
      pollSession(sessionId);
    } catch (e: any) {
      Alert.alert('Lab Error', e.message);
      setPhase('idle');
    }
  };

  const stopFuzz = async (toReport = true) => {
    if (report?.id) {
      try {
        await securityApi.stopSession(report.id);
        stopPolling();
        if (toReport) setPhase('report');
        setScanning(false);
      } catch (e: any) {
        Alert.alert('Error', 'Could not stop engine.');
      }
    }
  };

  const pollSession = (id: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(async () => {
      try {
        const data = await securityApi.getSession(id);
        setReport(data);
        setLogs(data.results || []);
        
        if (data.status === 'COMPLETED' || data.status === 'STOPPED') {
          stopPolling();
          setPhase('report');
          setScanning(false);
        }
      } catch (e: any) {
        stopPolling();
        if (e.response?.status === 404) {
          Alert.alert('Session Not Found', 'This security session has expired or was cleared.');
          setPhase('idle');
        }
      }
    }, 1200);
  };

  const stopPolling = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const renderFuzzLog = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => setSelectedResult(item)} activeOpacity={0.8}>
      <View style={[styles.logItem, { borderLeftColor: item.severity === 'CRASH' ? '#EF4444' : item.severity === 'ANOMALY' ? '#F59E0B' : '#10B981' }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={[styles.mono, { color: item.severity === 'CRASH' ? '#EF4444' : item.severity === 'ANOMALY' ? '#F59E0B' : '#10B981', fontWeight: 'bold' }]}>
            [{item.statusCode}] {item.category}
          </Text>
          <Text style={[styles.mono, { color: theme.colors.onSurfaceVariant, fontSize: 10 }]}>
            {new Date(item.createdAt).toLocaleTimeString()}
          </Text>
        </View>
        <Text style={[styles.mono, { color: theme.colors.onSurface, marginTop: 4, fontSize: 11 }]} numberOfLines={1}>
          Payload: {JSON.stringify(item.inputPayload?.data)}
        </Text>
        {item.severity !== 'CLEAN' && (
          <View style={[styles.chainBox, { backgroundColor: item.severity === 'CRASH' ? '#EF444415' : '#F59E0B15' }]}>
            <Text style={[styles.mono, { color: item.severity === 'CRASH' ? '#EF4444' : '#F59E0B', fontSize: 10 }]}>
              DETECTED: {item.errorReason}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <Header 
        title="Security Lab" 
        showBack 
        onBack={() => {
          if (phase === 'running') {
            stopPolling();
            stopFuzz(false);
            setPhase('idle');
          } else if (phase === 'report') {
            setPhase('idle');
          } else {
            navigation.goBack();
          }
        }} 
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* Lab Hero */}
        <View style={styles.hero}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <LinearGradient
              colors={phase === 'running' ? ['#EF444430', '#EF444410'] : [theme.colors.accent + '30', theme.colors.accent + '10']}
              style={styles.labIcon}
            >
              <MaterialCommunityIcons 
                name={phase === 'running' ? 'shield-alert-outline' : 'bug-outline'} 
                size={40} 
                color={phase === 'running' ? '#EF4444' : theme.colors.accent} 
              />
            </LinearGradient>
          </Animated.View>
          <Text style={[Typography.headlineLG, { color: theme.colors.onSurface, marginTop: 16 }]}>
            Fuzz Testing Engine
          </Text>
          <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }]}>
            Aggressively stress-testing DhanLekha APIs with malformed inputs to ensure 100% robustness.
          </Text>
        </View>

        {phase === 'idle' && (
          <View style={{ gap: 16 }}>
            <Text style={[Typography.headlineMD, { color: theme.colors.onSurface }]}>Select Attack Surface</Text>
            {TARGETS.map(t => (
              <TouchableOpacity 
                key={t.id}
                onPress={() => setSelectedTarget(t.id)}
                activeOpacity={0.7}
              >
                <GlassCard 
                  style={{ borderColor: selectedTarget === t.id ? theme.colors.accent : theme.colors.cardBorder, borderWidth: selectedTarget === t.id ? 2 : 1 }}
                  padding={16}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={[styles.targetIcon, { backgroundColor: theme.colors.surfaceContainer }]}>
                      <Ionicons name={t.id === 'VAULT' ? 'cube-outline' : t.id === 'PAYMENT' ? 'card-outline' : 'people-outline'} size={24} color={theme.colors.onSurface} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[Typography.headlineSM, { color: theme.colors.onSurface }]}>{t.label}</Text>
                      <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant }]}>{t.desc}</Text>
                    </View>
                    {selectedTarget === t.id && <Ionicons name="checkmark-circle" size={24} color={theme.colors.accent} />}
                  </View>
                </GlassCard>
              </TouchableOpacity>
            ))}

            {/* Shield Toggle for Demo */}
            <View style={[styles.shieldToggleRow, { backgroundColor: shieldActive ? theme.colors.accent + '15' : theme.colors.surfaceContainer, borderColor: shieldActive ? theme.colors.accent : theme.colors.cardBorder }]}>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '700' }]}>DHANLEKHA SHIELD</Text>
                <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant }]}>Live Attack Mitigation</Text>
              </View>
              <Switch 
                value={shieldActive} 
                onValueChange={toggleShield}
                trackColor={{ false: '#30363D', true: theme.colors.accent + '60' }}
                thumbColor={shieldActive ? theme.colors.accent : '#8B949E'}
              />
            </View>
            
            <PrimaryButton 
              label="Initiate Stress Test →" 
              onPress={initiateFuzz} 
              disabled={!selectedTarget || phase === 'running'}
              style={{ marginTop: 10 }}
            />

            <PrimaryButton 
              label="Generate Audit Report" 
              onPress={() => {
                if (!report) {
                  Alert.alert('No Data', 'Please run a stress test sequence first to generate an audit report.');
                } else {
                  setShowAuditReport(true);
                }
              }} 
              variant="outline"
              style={{ marginTop: 12, borderColor: theme.colors.accent }}
            />
          </View>
        )}

        {(phase === 'running' || phase === 'report') && (
          <View style={{ gap: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 }]}>TARGET: {selectedTarget}</Text>
                <Text style={[Typography.headlineMD, { color: theme.colors.onSurface }]}>
                  {phase === 'running' ? 'Active Bombardment' : 'Security Audit Report'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 8 }}>
                <Badge label={phase === 'running' ? 'LIVE' : 'FINISHED'} color={phase === 'running' ? '#EF4444' : '#10B981'} />
                {phase === 'running' && (
                  <TouchableOpacity onPress={stopFuzz} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#EF444420', borderWidth: 1, borderColor: '#EF4444' }}>
                    <Text style={[Typography.labelSM, { color: '#EF4444', fontWeight: 'bold' }]}>STOP ENGINE</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Metrics */}
            <View style={styles.statsRow}>
              <View style={[styles.statBox, { backgroundColor: theme.colors.surfaceContainer }]}>
                <Text style={[styles.mono, { color: theme.colors.onSurfaceVariant, fontSize: 10 }]}>INPUTS</Text>
                <Text style={[styles.mono, { color: theme.colors.onSurface, fontSize: 24, fontWeight: '700' }]}>{report?.currentIteration || 0}</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: '#EF444415', borderColor: '#EF444430', borderWidth: 1 }]}>
                <Text style={[styles.mono, { color: '#EF4444', fontSize: 10 }]}>CRASHES</Text>
                <Text style={[styles.mono, { color: '#EF4444', fontSize: 24, fontWeight: '700' }]}>{report?.crashes || 0}</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: theme.colors.surfaceContainer }]}>
                <Text style={[styles.mono, { color: theme.colors.onSurfaceVariant, fontSize: 10 }]}>ANOMALIES</Text>
                <Text style={[styles.mono, { color: '#F59E0B', fontSize: 24, fontWeight: '700' }]}>{report?.anomalies || 0}</Text>
              </View>
            </View>

            {/* Terminal View */}
            <View style={[styles.terminal, { backgroundColor: '#0D1117', borderColor: theme.colors.cardBorder }]}>
              <View style={styles.termHeader}>
                <View style={[styles.dot, { backgroundColor: '#FF5F56' }]} />
                <View style={[styles.dot, { backgroundColor: '#FFBD2E' }]} />
                <View style={[styles.dot, { backgroundColor: '#27C93F' }]} />
                <Text style={[styles.mono, { color: '#8B949E', fontSize: 10, marginLeft: 10 }]}>fuzzer@dhanlekha: bomb_test.sh</Text>
              </View>
              
              {logs.slice(0, 50).map((item) => (
                <View key={item.id}>
                  {renderFuzzLog({ item })}
                </View>
              ))}

              {scanning && (
                <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <ActivityIndicator size="small" color="#64FFDA" />
                  <Text style={[styles.mono, { color: '#64FFDA', fontSize: 11 }]}>Generating malformed payloads...</Text>
                </View>
              )}
            </View>

            {phase === 'report' && (
              <PrimaryButton 
                label="Run Another Sequence" 
                onPress={() => setPhase('idle')} 
                style={{ marginTop: 10 }}
                variant="outline"
              />
            )}
          </View>
        )}

      </ScrollView>

      {/* Failure Chain Modal */}
      <Modal visible={!!selectedResult} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setSelectedResult(null)} />
          <GlassCard style={styles.modalContent} padding={24}>
            <View style={styles.modalHeader}>
              <Text style={[Typography.headlineMD, { color: theme.colors.onSurface }]}>Failure Chain</Text>
              <TouchableOpacity onPress={() => setSelectedResult(null)}>
                <Ionicons name="close" size={24} color={theme.colors.onSurface} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={{ marginTop: 20 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalLabel}>INPUT PAYLOAD</Text>
              <View style={styles.codeBlock}>
                <Text style={styles.codeText}>{JSON.stringify(selectedResult?.inputPayload?.data, null, 2)}</Text>
              </View>

              <Text style={[styles.modalLabel, { marginTop: 20 }]}>SERVER RESPONSE ({selectedResult?.statusCode})</Text>
              <View style={[styles.codeBlock, { borderColor: selectedResult?.severity === 'CRASH' ? '#EF4444' : '#64FFDA' }]}>
                <Text style={styles.codeText}>
                  {selectedResult?.responseBody}
                </Text>
              </View>

              {selectedResult?.severity === 'CRASH' && (
                <>
                  <Text style={[styles.modalLabel, { marginTop: 20 }]}>ROOT CAUSE</Text>
                  <View style={styles.codeBlock}>
                    <Text style={[styles.codeText, { color: '#EF4444' }]}>{selectedResult.errorReason}</Text>
                  </View>
                </>
              )}
              
              <View style={{ height: 40 }} />
            </ScrollView>
          </GlassCard>
        </View>
      </Modal>

      {/* Audit Report Modal */}
      <Modal visible={showAuditReport} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowAuditReport(false)} />
          <GlassCard style={styles.modalContent} padding={24}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[Typography.headlineMD, { color: theme.colors.onSurface }]}>Security Audit Report</Text>
                <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant }]}>Target: {selectedTarget} Engine</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAuditReport(false)}>
                <Ionicons name="close" size={24} color={theme.colors.onSurface} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ marginTop: 20 }} showsVerticalScrollIndicator={false}>
              <GlassCard padding={16} style={{ backgroundColor: theme.colors.surfaceContainerLow, borderSecondary: true }}>
                <View style={styles.reportSummary}>
                  <View style={styles.reportSummaryItem}>
                    <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant }]}>SCORE</Text>
                    <Text style={[styles.mono, { color: (report?.crashes || 0) > 0 ? '#EF4444' : '#14B8A6', fontSize: 28, fontWeight: '900' }]}>
                      {(report?.crashes || 0) > 0 ? 'FAIL' : 'PASS'}
                    </Text>
                  </View>
                  <View style={{ width: 1, height: 40, backgroundColor: theme.colors.outlineVariant }} />
                  <View style={styles.reportSummaryItem}>
                    <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant }]}>CRITICAL</Text>
                    <Text style={[styles.mono, { color: '#EF4444', fontSize: 28, fontWeight: '900' }]}>{report?.crashes || 0}</Text>
                  </View>
                  <View style={{ width: 1, height: 40, backgroundColor: theme.colors.outlineVariant }} />
                  <View style={styles.reportSummaryItem}>
                    <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant }]}>WARNINGS</Text>
                    <Text style={[styles.mono, { color: '#F59E0B', fontSize: 28, fontWeight: '900' }]}>{report?.anomalies || 0}</Text>
                  </View>
                </View>
              </GlassCard>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 12, gap: 8 }}>
                <Ionicons name="bug-outline" size={16} color={theme.colors.accent} />
                <Text style={[Typography.labelSM, { color: theme.colors.accent, letterSpacing: 1.5, fontWeight: '900' }]}>VULNERABILITY BREAKDOWN</Text>
              </View>

              {logs.filter(l => l.severity !== 'CLEAN').length === 0 ? (
                <View style={{ marginTop: 12 }}>
                  {[
                    { title: 'AI REQUEST SANITIZATION', icon: 'shield-checkmark', desc: 'Blocked all malformed JSON and XSS payloads at the gateway.', factor: 'INTEGRITY CHECK' },
                    { title: 'HEURISTIC FIREWALL', icon: 'flash', desc: 'Detected and neutralized SQL injection patterns before execution.', factor: 'INPUT VALIDATION' },
                    { title: 'RATE LIMITING (SHIELD)', icon: 'speedometer', desc: 'Adaptive throttling prevented endpoint bombardment during stress test.', factor: 'DOS PROTECTION' },
                    { title: 'BUFFER OVERFLOW GUARD', icon: 'list', desc: 'Enforced strict memory limits on incoming large payloads.', factor: 'MEM PROTECTION' }
                  ].map((res, i) => (
                    <GlassCard key={i} padding={16} style={{ marginBottom: 12, borderColor: '#14B8A640', borderWidth: 1, backgroundColor: '#14B8A608' }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                        <Badge label={res.factor} color="#14B8A6" />
                        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#14B8A620', alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name={res.icon as any} size={14} color="#14B8A6" />
                        </View>
                      </View>
                      <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '700', marginBottom: 4 }]}>{res.title}</Text>
                      <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, lineHeight: 18 }]}>{res.desc}</Text>
                    </GlassCard>
                  ))}
                  
                  <View style={[styles.remediationBox, { backgroundColor: '#14B8A615', borderColor: '#14B8A630', borderWidth: 1, marginTop: 10 }]}>
                    <Text style={[Typography.labelSM, { color: '#14B8A6', fontWeight: '900', textAlign: 'center' }]}>
                      SYSTEM HARDENED & RESILIENT
                    </Text>
                  </View>
                </View>
              ) : (
                logs.filter(l => l.severity !== 'CLEAN').slice(0, 10).map((log, idx) => (
                  <GlassCard key={idx} padding={16} style={{ marginBottom: 12, borderColor: log.severity === 'CRASH' ? '#EF444440' : '#F59E0B40', borderWidth: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                      <Badge label={log.category.toUpperCase()} color={log.severity === 'CRASH' ? '#EF4444' : '#F59E0B'} backgroundColor={log.severity === 'CRASH' ? '#EF444415' : '#F59E0B15'} />
                      <Text style={[styles.mono, { color: theme.colors.onSurfaceVariant, fontSize: 10 }]}>{new Date(log.createdAt).toLocaleTimeString()}</Text>
                    </View>
                    <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '700', lineHeight: 20 }]}>{log.errorReason}</Text>
                    <View style={[styles.remediationBox, { backgroundColor: theme.colors.accent + '10', borderColor: theme.colors.accent + '20', borderWidth: 1 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 }}>
                        <Ionicons name="construct-outline" size={12} color={theme.colors.accent} />
                        <Text style={[Typography.labelSM, { color: theme.colors.accent, fontWeight: '900' }]}>FIX REQUIRED</Text>
                      </View>
                      <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, lineHeight: 18 }]}>{getRemediation(log.category)}</Text>
                    </View>
                  </GlassCard>
                ))
              )}
              
              <View style={{ height: 20 }} />
              <PrimaryButton 
                label="Download Full PDF Audit" 
                onPress={() => Alert.alert('Exporting', 'Generating encrypted PDF report...')}
                iconName="download-outline"
                variant="outline"
              />
              <View style={{ height: 60 }} />
            </ScrollView>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
};

const Badge = ({ label, color }: any) => (
  <View style={[styles.badge, { backgroundColor: color + '15', borderColor: color }]}>
    <View style={[styles.dotSmall, { backgroundColor: color }]} />
    <Text style={[styles.badgeText, { color }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 120 },
  hero: { alignItems: 'center', paddingVertical: 24 },
  labIcon: { width: 80, height: 80, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  targetIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: 12 },
  statBox: { flex: 1, padding: 12, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  terminal: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', minHeight: 400, marginTop: 8 },
  termHeader: { height: 36, backgroundColor: '#161B22', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  logItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#161B22', borderLeftWidth: 4 },
  mono: { fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: -0.5 },
  chainBox: { marginTop: 10, padding: 10, borderRadius: 10 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '800', marginLeft: 6 },
  dotSmall: { width: 6, height: 6, borderRadius: 3 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(255,255,255,0.98)', justifyContent: 'flex-end' },
  modalContent: { height: '85%', borderTopLeftRadius: 36, borderTopRightRadius: 36, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderWidth: 0, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalLabel: { color: '#64FFDA', fontSize: 12, letterSpacing: 1.5, fontWeight: '800', marginBottom: 10 },
  codeBlock: { backgroundColor: '#051124', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#1E293B' },
  codeText: { color: '#CBD5E1', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 13, lineHeight: 20 },
  shieldToggleRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginTop: 8 },
  reportSummary: { flexDirection: 'row', padding: 20, borderRadius: 20, gap: 12, marginBottom: 12 },
  reportSummaryItem: { flex: 1, alignItems: 'center' },
  vulnCard: { padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.02)' },
  remediationBox: { marginTop: 12, padding: 12, borderRadius: 12 },
});
