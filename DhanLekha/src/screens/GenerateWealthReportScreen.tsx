import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Switch, Alert, RefreshControl, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { GlassCard } from '../components/GlassCard';
import { Header } from '../components/Header';
import { PrimaryButton } from '../components/PrimaryButton';
import { LoadingView, ErrorView } from '../components/LoadingView';
import { Typography } from '../theme/typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApi } from '../hooks/useApi';
import { documentsApi, reportsApi, accountsApi } from '../services/api';

const DOC_TYPE_LABELS: Record<string, string> = {
  INSURANCE: 'Insurance', FIXED_DEPOSIT: 'Fixed Deposit',
  PROPERTY: 'Property', MUTUAL_FUND: 'Mutual Fund',
  STOCK_CERTIFICATE: 'Stocks', WILL: 'Will', BANK_STATEMENT: 'Bank Statement', OTHER: 'Other',
};

const EXPIRY_OPTIONS = [7, 15, 30, 60];

export const GenerateWealthReportScreen = ({ navigation }: any) => {
  const { theme, isDark } = useTheme();
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [includeNetworth, setIncludeNetworth] = useState(true);
  const [expiryDays, setExpiryDays] = useState(30);
  const [generating, setGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data: docs, loading, error, refresh } = useApi<any[]>(() => documentsApi.list());

  const onRefresh = () => { setRefreshing(true); refresh(); setTimeout(() => setRefreshing(false), 1000); };

  const toggleDoc = (id: string) => {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (docs) setSelectedDocIds(new Set(docs.map((d: any) => d.id)));
  };

  const handleGenerate = async () => {
    if (selectedDocIds.size === 0) { Alert.alert('Select Assets', 'Please select at least one document.'); return; }
    setGenerating(true);
    try {
      // Map connected account holdings to doc types for value estimation
      const accountValueMap: Record<string, number> = {};
      try {
        const accounts = await accountsApi.list();
        for (const acc of accounts) {
          const h = acc.holdingsJson as any;
          if (!h) continue;
          const v = (h.portfolioValue || 0) + (h.balance || 0) + (h.coverAmount || 0);
          if (acc.accountType === 'BROKER') accountValueMap['STOCK_CERTIFICATE'] = (accountValueMap['STOCK_CERTIFICATE'] || 0) + v;
          if (acc.accountType === 'MUTUAL_FUND') accountValueMap['MUTUAL_FUND'] = (accountValueMap['MUTUAL_FUND'] || 0) + v;
          if (acc.accountType === 'BANK') accountValueMap['FIXED_DEPOSIT'] = (accountValueMap['FIXED_DEPOSIT'] || 0) + v;
          if (acc.accountType === 'INSURANCE') accountValueMap['INSURANCE'] = (accountValueMap['INSURANCE'] || 0) + v;
        }
      } catch {}

      const assets = (docs ?? [])
        .filter((d: any) => selectedDocIds.has(d.id))
        .map((d: any) => ({
          name: d.title,
          type: d.docType,
          value: accountValueMap[d.docType] || 0,
          documentId: d.id,
        }));

      const report = await reportsApi.create({
        title: 'Wealth Report',
        includeNetworth,
        expiryDays,
        assets,
      });
      setGeneratedReport(report);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!generatedReport?.shareUrl) return;
    try {
      await Share.share({
        message: `View my verified wealth report: ${generatedReport.shareUrl}`,
        url: generatedReport.shareUrl,
        title: 'DhanLekha Wealth Report',
      });
    } catch (e: any) {
      Alert.alert('Share Error', e.message);
    }
  };

  if (loading && !docs) return <LoadingView message="Loading documents..." />;
  if (error && !docs) return <ErrorView message={error} onRetry={refresh} />;

  // Group docs by type
  const grouped: Record<string, any[]> = {};
  (docs ?? []).forEach((d: any) => {
    const key = DOC_TYPE_LABELS[d.docType] || 'Other';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(d);
  });

  const TYPE_COLORS: Record<string, string> = {
    'Property': '#14B8A6', 'Fixed Deposit': '#6366F1', 'Insurance': '#8B5CF6',
    'Mutual Fund': '#3B82F6', 'Stocks': '#F59E0B', 'Will': '#EF4444',
    'Bank Statement': '#10B981', 'Other': '#94A3B8',
  };

  if (generatedReport) {
    return (
      <View style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <Header title="Report Ready" showBack onBack={() => { setGeneratedReport(null); navigation.goBack(); }} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={[styles.successIcon, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
            <Ionicons name="checkmark-circle" size={56} color="#10B981" />
          </View>
          <Text style={[Typography.headlineLG, { color: theme.colors.onSurface, textAlign: 'center', marginBottom: 8 }]}>Report Generated!</Text>
          <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, textAlign: 'center', marginBottom: 24 }]}>
            Your wealth report is ready. Share it securely with a time-limited link.
          </Text>

          <GlassCard padding={20} style={{ marginBottom: 16 }}>
            <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }]}>Share URL</Text>
            <View style={[styles.urlRow, { backgroundColor: theme.colors.surfaceContainerLow, borderColor: theme.colors.outlineVariant }]}>
              <Text style={[Typography.mono, { flex: 1, color: theme.colors.onSurface, fontSize: 12 }]} numberOfLines={1} ellipsizeMode="middle">
                {generatedReport.shareUrl}
              </Text>
            </View>
            <View style={styles.reportMeta}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="time-outline" size={14} color={theme.colors.onSurfaceVariant} />
                <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant }]}>
                  Expires: {new Date(generatedReport.expiresAt).toLocaleDateString('en-IN')}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="document-text-outline" size={14} color={theme.colors.onSurfaceVariant} />
                <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant }]}>
                  {generatedReport.items?.length ?? 0} assets included
                </Text>
              </View>
            </View>
          </GlassCard>

          {generatedReport.securityAudit && (
            <GlassCard padding={20} style={{ marginBottom: 20, borderColor: '#14B8A640', backgroundColor: isDark ? '#14B8A608' : '#14B8A605' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <View style={[styles.shieldBadge, { backgroundColor: '#14B8A6' }]}>
                  <Ionicons name="shield-checkmark" size={18} color="#fff" />
                </View>
                <View>
                  <Text style={[Typography.headlineMD, { color: theme.colors.onSurface, fontSize: 18 }]}>Security Resilience</Text>
                  <Text style={[Typography.labelSM, { color: '#14B8A6', fontWeight: '700' }]}>SHIELD ACTIVE • AUDIT PASSED</Text>
                </View>
              </View>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <View>
                  <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, fontSize: 10 }]}>THREATS NEUTRALIZED</Text>
                  <Text style={[Typography.headlineLG, { color: theme.colors.onSurface, fontSize: 24 }]}>{generatedReport.securityAudit.threatsNeutralized}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, fontSize: 10 }]}>RESILIENCE SCORE</Text>
                  <Text style={[Typography.headlineLG, { color: '#14B8A6', fontSize: 24 }]}>{generatedReport.securityAudit.resilienceScore}</Text>
                </View>
              </View>

              <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, fontSize: 10, marginBottom: 6 }]}>INTERCEPTED VECTORS</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {generatedReport.securityAudit.interceptedVectors.map((v: string) => (
                  <View key={v} style={{ backgroundColor: isDark ? '#14B8A615' : '#14B8A608', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#14B8A625' }}>
                    <Text style={{ color: '#14B8A6', fontSize: 10, fontWeight: '600' }}>{v}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>
          )}

          <PrimaryButton label="Share Report" onPress={handleShare} iconName="share-outline" style={{ marginBottom: 12 }} />
          <PrimaryButton label="Done" onPress={() => navigation.goBack()} variant="outline" />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <Header title="Wealth Report" showBack onBack={() => navigation.goBack()} showThemeToggle />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 6 }}>
          <Ionicons name="shield-checkmark" size={14} color={theme.colors.accent} />
          <Text style={[Typography.labelSM, { color: theme.colors.accent, textTransform: 'uppercase', letterSpacing: 1 }]}>End-to-End Encrypted</Text>
        </View>
        <Text style={[Typography.headlineLG, { color: theme.colors.onSurface, marginBottom: 4 }]}>Generate Wealth Report</Text>
        <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, marginBottom: 20 }]}>
          Create a verified, shareable snapshot of your assets for loans, visa or financial planning.
        </Text>

        {/* Selection summary */}
        <GlassCard style={{ marginBottom: 16, borderColor: selectedDocIds.size > 0 ? theme.colors.accent + '30' : theme.colors.cardBorder }} padding={14}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={[Typography.headlineMD, { color: selectedDocIds.size > 0 ? theme.colors.accent : theme.colors.onSurfaceVariant, fontSize: 22 }]}>
                {selectedDocIds.size}/{(docs ?? []).length}
              </Text>
              <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}>Documents selected</Text>
            </View>
            <TouchableOpacity style={[styles.selectAllBtn, { backgroundColor: theme.colors.accent + '15', borderColor: theme.colors.accent + '25' }]} onPress={selectAll}>
              <Text style={[Typography.labelSM, { color: theme.colors.accent, textTransform: 'uppercase' }]}>Select All</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Documents grouped by type */}
        {Object.entries(grouped).map(([typeName, typeDocs]) => {
          const color = TYPE_COLORS[typeName] || '#94A3B8';
          return (
            <GlassCard key={typeName} style={{ marginBottom: 12 }} padding={16}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: color + '18' }]}>
                  <Ionicons name="folder-outline" size={18} color={color} />
                </View>
                <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600', flex: 1, marginLeft: 10 }]}>{typeName}</Text>
                <TouchableOpacity onPress={() => typeDocs.forEach((d) => setSelectedDocIds((p) => { const n = new Set(p); n.add(d.id); return n; }))}>
                  <Text style={[Typography.labelSM, { color, textTransform: 'uppercase' }]}>All</Text>
                </TouchableOpacity>
              </View>
              {typeDocs.map((doc: any) => (
                <TouchableOpacity key={doc.id} style={[styles.itemRow, { borderTopColor: theme.colors.cardBorder }]} onPress={() => toggleDoc(doc.id)} activeOpacity={0.7}>
                  <View style={[styles.checkbox, { backgroundColor: selectedDocIds.has(doc.id) ? color : 'transparent', borderColor: selectedDocIds.has(doc.id) ? color : theme.colors.outlineVariant }]}>
                    {selectedDocIds.has(doc.id) && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <Text style={[Typography.bodyMD, { flex: 1, color: theme.colors.onSurface, fontSize: 13, marginLeft: 12 }]}>{doc.title}</Text>
                  {doc.issuedBy && (
                    <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant }]}>{doc.issuedBy}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </GlassCard>
          );
        })}

        {(docs ?? []).length === 0 && (
          <GlassCard padding={24}>
            <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, textAlign: 'center' }]}>
              No documents in vault. Upload documents first.
            </Text>
          </GlassCard>
        )}

        {/* Report Options */}
        <GlassCard style={{ marginBottom: 16 }} padding={16}>
          <Text style={[Typography.headlineMD, { color: theme.colors.onSurface, marginBottom: 14 }]}>Report Options</Text>
          <View style={[styles.optionRow, { borderBottomColor: theme.colors.cardBorder }]}>
            <View>
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurface }]}>Include Net Worth Summary</Text>
              <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}>Visible to recipient</Text>
            </View>
            <Switch value={includeNetworth} onValueChange={setIncludeNetworth} trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.accent + '60' }} thumbColor={includeNetworth ? theme.colors.accent : theme.colors.onSurface} />
          </View>
          <View style={{ marginTop: 14 }}>
            <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }]}>Link Expiry</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {EXPIRY_OPTIONS.map((days) => (
                <TouchableOpacity
                  key={days}
                  style={[styles.expiryBtn, { backgroundColor: expiryDays === days ? theme.colors.accent : theme.colors.surfaceContainerHigh, borderColor: expiryDays === days ? theme.colors.accent : theme.colors.outlineVariant }]}
                  onPress={() => setExpiryDays(days)}
                >
                  <Text style={[Typography.labelSM, { color: expiryDays === days ? (isDark ? '#0A192F' : '#fff') : theme.colors.onSurfaceVariant }]}>{days}d</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </GlassCard>

        <PrimaryButton
          label={generating ? 'Generating...' : `Generate Report (${selectedDocIds.size} docs)`}
          onPress={handleGenerate}
          loading={generating}
          iconName="document-text-outline"
          style={{ marginBottom: 20 }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  selectAllBtn: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottomWidth: 1 },
  expiryBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  successIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 32, marginBottom: 20 },
  urlRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  reportMeta: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  shieldBadge: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
