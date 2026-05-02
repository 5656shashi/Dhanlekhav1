import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Animated, FlatList, ActivityIndicator, Alert, Share, Switch
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { GlassCard } from '../components/GlassCard';
import { Header } from '../components/Header';
import { PrimaryButton } from '../components/PrimaryButton';
import { Typography } from '../theme/typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { securityApi } from '../services/api';
import Slider from '@react-native-community/slider';

const ENDPOINTS = [
  { path: '/auth/send-otp', methods: ['POST'] },
  { path: '/auth/verify-otp', methods: ['POST'] },
  { path: '/documents', methods: ['GET', 'POST'] },
  { path: '/nominees', methods: ['GET', 'POST'] },
  { path: '/accounts', methods: ['GET', 'POST'] },
  { path: '/payments/history', methods: ['GET'] },
];

const CATEGORIES = [
  { id: 'sqlInjection', label: 'SQL Injection' },
  { id: 'xss', label: 'XSS Attacks' },
  { id: 'bufferOverflow', label: 'Buffer Overflow' },
  { id: 'typConfusion', label: 'Type Confusion' },
  { id: 'boundary', label: 'Boundary Values' },
  { id: 'malformedJson', label: 'Malformed JSON' },
  { id: 'authBypass', label: 'Auth Bypass' },
  { id: 'pathTraversal', label: 'Path Traversal' },
];

export const FuzzTestingScreen = ({ navigation }: any) => {
  const { theme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'config' | 'monitor' | 'analysis'>('config');
  
  // Tab 1: Config
  const [target, setTarget] = useState(ENDPOINTS[2]);
  const [method, setMethod] = useState('POST');
  const [iterations, setIterations] = useState(100);
  const [selectedCats, setSelectedCats] = useState<string[]>(CATEGORIES.map(c => c.id));
  const [shieldEnabled, setShieldEnabled] = useState(false);

  // Tab 2: Monitor
  const [session, setSession] = useState<any>(null);
  const [liveLogs, setLiveLogs] = useState<any[]>([]);
  
  // Tab 3: Analysis
  const [results, setResults] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const pollInterval = useRef<any>(null);

  useEffect(() => {
    return () => clearInterval(pollInterval.current);
  }, []);

  const startFuzzing = async () => {
    try {
      const { sessionId } = await securityApi.startSession({
        targetEndpoint: target.path,
        method,
        iterations,
        categories: selectedCats,
        shieldEnabled
      });
      setActiveTab('monitor');
      startPolling(sessionId);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const startPolling = (id: string) => {
    clearInterval(pollInterval.current);
    pollInterval.current = setInterval(async () => {
      try {
        const data = await securityApi.getSession(id);
        setSession(data);
        setLiveLogs(data.results || []);
        
        if (data.status === 'COMPLETED' || data.status === 'STOPPED') {
          clearInterval(pollInterval.current);
          fetchFullResults(id);
        }
      } catch (e) {
        clearInterval(pollInterval.current);
      }
    }, 2000);
  };

  const fetchFullResults = async (id: string) => {
    try {
      const data = await securityApi.getResults(id, { limit: 100 });
      setResults(data);
    } catch (e) {}
  };

  const stopFuzzing = async () => {
    if (!session) return;
    try {
      await securityApi.stopSession(session.id);
    } catch (e) {}
  };

  const handleExport = async () => {
    if (!session) return;
    const url = securityApi.exportReport(session.id);
    Alert.alert('Report Ready', 'The JSON report is available for download.', [
      { text: 'Copy Link', onPress: () => Share.share({ message: url }) },
      { text: 'Close' }
    ]);
  };

  const toggleCat = (id: string) => {
    setSelectedCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  // ── Tab 1: Config ─────────────────────────────────────────────────────────
  const renderConfig = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={[Typography.headlineMD, { color: theme.colors.onSurface, marginBottom: 20 }]}>Attack Configuration</Text>
      
      <Text style={styles.fieldLabel}>TARGET ENDPOINT</Text>
      <View style={styles.pickerRow}>
        {ENDPOINTS.map(e => (
          <TouchableOpacity 
            key={e.path} 
            style={[styles.chip, target.path === e.path && { backgroundColor: theme.colors.accent + '20', borderColor: theme.colors.accent }]} 
            onPress={() => { setTarget(e); setMethod(e.methods[0]); }}
          >
            <Text style={[styles.chipText, { color: target.path === e.path ? theme.colors.accent : theme.colors.onSurfaceVariant }]}>{e.path}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.fieldLabel}>HTTP METHOD</Text>
      <View style={styles.pickerRow}>
        {target.methods.map(m => (
          <TouchableOpacity 
            key={m} 
            style={[styles.chip, method === m && { backgroundColor: theme.colors.accent + '20', borderColor: theme.colors.accent }]} 
            onPress={() => setMethod(m)}
          >
            <Text style={[styles.chipText, { color: method === m ? theme.colors.accent : theme.colors.onSurfaceVariant }]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sliderRow}>
        <Text style={styles.fieldLabel}>ITERATIONS: {iterations}</Text>
        <Slider
          style={{ width: '100%', height: 40 }}
          minimumValue={10}
          maximumValue={500}
          step={10}
          value={iterations}
          onValueChange={setIterations}
          minimumTrackTintColor={theme.colors.accent}
          maximumTrackTintColor={theme.colors.outlineVariant}
        />
      </View>

      <Text style={styles.fieldLabel}>FUZZ CATEGORIES</Text>
      <View style={styles.catGrid}>
        {CATEGORIES.map(c => (
          <TouchableOpacity 
            key={c.id} 
            style={[styles.catCard, selectedCats.includes(c.id) && { borderColor: theme.colors.accent, backgroundColor: theme.colors.accent + '08' }]}
            onPress={() => toggleCat(c.id)}
          >
            <Ionicons name={selectedCats.includes(c.id) ? "checkbox" : "square-outline"} size={20} color={selectedCats.includes(c.id) ? theme.colors.accent : theme.colors.onSurfaceVariant} />
            <Text style={[styles.catText, { color: theme.colors.onSurface }]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.shieldRow, { backgroundColor: shieldEnabled ? theme.colors.accent + '10' : theme.colors.surfaceContainer, borderColor: shieldEnabled ? theme.colors.accent : theme.colors.cardBorder }]}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="shield-checkmark" size={18} color={shieldEnabled ? theme.colors.accent : theme.colors.onSurfaceVariant} />
            <Text style={[Typography.headlineSM, { color: theme.colors.onSurface }]}>DHANLEKHA SHIELD</Text>
          </View>
          <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 4 }]}>
            Enable Rate Limiting & Input Sanitization
          </Text>
        </View>
        <Switch 
          value={shieldEnabled} 
          onValueChange={setShieldEnabled}
          trackColor={{ false: '#30363D', true: theme.colors.accent + '60' }}
          thumbColor={shieldEnabled ? theme.colors.accent : '#8B949E'}
        />
      </View>

      <PrimaryButton label="Launch Fuzzer" onPress={startFuzzing} style={{ marginTop: 24 }} iconName="flash" />
    </ScrollView>
  );

  // ── Tab 2: Monitor ────────────────────────────────────────────────────────
  const renderMonitor = () => (
    <View style={styles.tabContent}>
      <View style={styles.monitorHeader}>
        <View>
          <Text style={[Typography.headlineMD, { color: theme.colors.onSurface }]}>Security Monitor</Text>
          <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant }]}>{target.path} ({method})</Text>
        </View>
        <Badge label={session?.status || 'IDLE'} color={session?.status === 'RUNNING' ? '#EF4444' : '#10B981'} />
      </View>

      <View style={styles.statsGrid}>
        <StatCard label="REQUESTS" value={`${session?.currentIteration || 0}/${session?.iterations || 0}`} color={theme.colors.onSurface} />
        <StatCard label="CRASHES" value={session?.crashes || 0} color="#EF4444" />
        <StatCard label="ANOMALIES" value={session?.anomalies || 0} color="#F59E0B" />
      </View>

      <View style={[styles.terminal, { backgroundColor: '#0D1117' }]}>
        <View style={styles.termTitle}><Text style={styles.monoText}>fuzzer@dhanlekha:~/live_stream</Text></View>
        <FlatList
          data={liveLogs}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.logLine}>
              <Text style={[styles.monoText, { color: item.severity === 'CRASH' ? '#EF4444' : item.severity === 'ANOMALY' ? '#F59E0B' : '#10B981' }]}>
                {item.statusCode} {item.category.toUpperCase()} {item.responseTime}ms
              </Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.monoText}>Initializing...</Text>}
        />
      </View>

      {session?.status === 'RUNNING' ? (
        <PrimaryButton label="Abort Session" onPress={stopFuzzing} variant="outline" style={{ marginTop: 16 }} iconName="stop-circle" />
      ) : (
        <PrimaryButton label="View Full Analysis" onPress={() => setActiveTab('analysis')} style={{ marginTop: 16 }} />
      )}
    </View>
  );

  // ── Tab 3: Analysis ───────────────────────────────────────────────────────
  const renderAnalysis = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.analysisHeader}>
        <Text style={[Typography.headlineMD, { color: theme.colors.onSurface }]}>Post-Attack Analysis</Text>
        <TouchableOpacity onPress={handleExport}><Ionicons name="download-outline" size={24} color={theme.colors.accent} /></TouchableOpacity>
      </View>

      <GlassCard style={styles.summaryCard} padding={16}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={[Typography.headlineLG, { color: '#EF4444' }]}>{Math.round((session?.crashes / session?.iterations) * 100) || 0}%</Text>
            <Text style={styles.fieldLabel}>CRASH RATE</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={[Typography.headlineLG, { color: '#F59E0B' }]}>{Math.round((session?.anomalies / session?.iterations) * 100) || 0}%</Text>
            <Text style={styles.fieldLabel}>ANOMALY RATE</Text>
          </View>
        </View>
      </GlassCard>

      <Text style={[styles.fieldLabel, { marginTop: 20 }]}>INPUT-TO-FAILURE CHAINS</Text>
      {results.map(res => (
        <TouchableOpacity key={res.id} onPress={() => setExpandedId(expandedId === res.id ? null : res.id)}>
          <View style={[styles.resultRow, { borderLeftColor: res.severity === 'CRASH' ? '#EF4444' : res.severity === 'ANOMALY' ? '#F59E0B' : '#10B981' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[styles.monoText, { color: theme.colors.onSurface }]}>{res.category}</Text>
              <Text style={[styles.monoText, { color: theme.colors.onSurfaceVariant }]}>{res.statusCode}</Text>
            </View>
            {expandedId === res.id && (
              <View style={styles.expanded}>
                <Text style={styles.codeLabel}>PAYLOAD:</Text>
                <Text style={styles.code}>{JSON.stringify(res.inputPayload.data)}</Text>
                {res.errorReason && (
                  <>
                    <Text style={[styles.codeLabel, { marginTop: 8 }]}>FAILURE REASON:</Text>
                    <Text style={[styles.code, { color: '#EF4444' }]}>{res.errorReason}</Text>
                  </>
                )}
                <Text style={[styles.codeLabel, { marginTop: 8 }]}>RESPONSE:</Text>
                <Text style={styles.code} numberOfLines={5}>{res.responseBody}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title="Fuzz Security Lab" showBack onBack={() => navigation.goBack()} />
      
      {/* Tab Switcher */}
      <View style={[styles.tabBar, { borderBottomColor: theme.colors.cardBorder }]}>
        {['config', 'monitor', 'analysis'].map((t: any) => (
          <TouchableOpacity key={t} style={[styles.tab, activeTab === t && { borderBottomColor: theme.colors.accent }]} onPress={() => setActiveTab(t)}>
            <Text style={[styles.tabText, { color: activeTab === t ? theme.colors.accent : theme.colors.onSurfaceVariant }]}>{t.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'config' && renderConfig()}
      {activeTab === 'monitor' && renderMonitor()}
      {activeTab === 'analysis' && renderAnalysis()}
    </View>
  );
};

const StatCard = ({ label, value, color }: any) => (
  <View style={styles.statCard}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={[styles.fieldLabel, { color: color + 'AA' }]}>{label}</Text>
  </View>
);

const Badge = ({ label, color }: any) => (
  <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color }]}>
    <Text style={[styles.badgeText, { color }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  tabContent: { flex: 1, padding: 20 },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: '#8B949E', letterSpacing: 1, marginBottom: 8 },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#30363D' },
  chipText: { fontSize: 12, fontWeight: '600' },
  sliderRow: { marginBottom: 24 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catCard: { width: '48%', flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#30363D' },
  catText: { fontSize: 13, fontWeight: '500' },
  monitorHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#161B22', padding: 12, borderRadius: 12, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: '#fff' },
  terminal: { flex: 1, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#30363D' },
  termTitle: { padding: 8, backgroundColor: '#161B22', borderBottomWidth: 1, borderBottomColor: '#30363D' },
  monoText: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11, color: '#64FFDA' },
  logLine: { paddingHorizontal: 12, paddingVertical: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  analysisHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  summaryCard: { marginBottom: 20 },
  resultRow: { padding: 12, borderLeftWidth: 4, backgroundColor: '#161B22', borderRadius: 8, marginBottom: 8 },
  expanded: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#30363D' },
  codeLabel: { fontSize: 9, fontWeight: '700', color: '#8B949E', marginBottom: 4 },
  code: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11, color: '#C9D1D9', backgroundColor: '#0D1117', padding: 8, borderRadius: 4 },
  shieldRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginTop: 24 },
});
