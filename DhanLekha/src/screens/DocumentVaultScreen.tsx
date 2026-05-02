import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { GlassCard } from '../components/GlassCard';
import { Header } from '../components/Header';
import { Badge } from '../components/Badge';
import { LoadingView, ErrorView } from '../components/LoadingView';
import { Typography } from '../theme/typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApi } from '../hooks/useApi';
import { documentsApi } from '../services/api';

const STATUS_CFG: Record<string, { text: string; color: string; bg: string; border: string; icon: keyof typeof Ionicons.glyphMap }> = {
  VERIFIED:   { text: 'Verified',      color: '#14B8A6', bg: 'rgba(20,184,166,0.1)',  border: 'rgba(20,184,166,0.25)',  icon: 'checkmark-circle' },
  PENDING_TX: { text: 'Pending',       color: '#6366F1', bg: 'rgba(99,102,241,0.1)',  border: 'rgba(99,102,241,0.25)',  icon: 'time-outline' },
  UNVERIFIED: { text: 'Not Verified',  color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', icon: 'alert-circle-outline' },
  FAILED:     { text: 'Failed',        color: '#EF4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)',  icon: 'warning-outline' },
};

const DOC_ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  INSURANCE:         { icon: 'shield-outline', color: '#8B5CF6' },
  FIXED_DEPOSIT:     { icon: 'wallet-outline', color: '#14B8A6' },
  PROPERTY:          { icon: 'home-outline', color: '#14B8A6' },
  MUTUAL_FUND:       { icon: 'pie-chart-outline', color: '#3B82F6' },
  STOCK_CERTIFICATE: { icon: 'trending-up-outline', color: '#F59E0B' },
  WILL:              { icon: 'document-text-outline', color: '#6366F1' },
  BANK_STATEMENT:    { icon: 'card-outline', color: '#EF4444' },
  OTHER:             { icon: 'document-outline', color: '#94A3B8' },
};

const FILTERS = ['All', 'VERIFIED', 'PENDING_TX'];

export const DocumentVaultScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const { data: docs, loading, error, refresh } = useApi<any[]>(() => documentsApi.list());

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [])
  );

  const onRefresh = () => { setRefreshing(true); refresh(); setTimeout(() => setRefreshing(false), 1000); };

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Delete Document', `Delete "${title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await documentsApi.delete(id); refresh(); }
        catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  const filtered = (docs ?? []).filter((d: any) => {
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase()) ||
      (d.issuedBy ?? '').toLowerCase().includes(search.toLowerCase());
    
    // Hard logic: Only show documents that are being processed or verified (Paid)
    const isPaid = d.blockchainStatus === 'VERIFIED' || d.blockchainStatus === 'PENDING_TX';
    
    if (activeFilter === 'All') return matchSearch && isPaid;
    return matchSearch && d.blockchainStatus === activeFilter;
  });

  if (loading && !docs) return <LoadingView message="Loading vault..." />;
  if (error && !docs) return <ErrorView message={error} onRetry={refresh} />;

  return (
    <View style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <Header title="Document Vault" showThemeToggle />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />}
      >
        <View style={styles.secRow}>
          <Ionicons name="lock-closed" size={13} color={theme.colors.primary} />
          <Text style={[Typography.labelSM, { color: theme.colors.primary, marginLeft: 5, letterSpacing: 1 }]}>ENCRYPTED VAULT SESSION</Text>
        </View>
        <Text style={[Typography.headlineLG, { color: theme.colors.onSurface, marginBottom: 4 }]}>Document Vault</Text>
        <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, marginBottom: 16 }]}>
          {filtered.length} document{filtered.length !== 1 ? 's' : ''} stored securely
        </Text>

        {/* Search */}
        <View style={[styles.searchRow, { backgroundColor: theme.colors.surfaceContainerLow, borderColor: theme.colors.outlineVariant }]}>
          <Ionicons name="search-outline" size={18} color={theme.colors.outline} />
          <TextInput
            style={[Typography.bodyMD, styles.searchInput, { color: theme.colors.onSurface }]}
            placeholder="Search documents..."
            placeholderTextColor={theme.colors.outline}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={18} color={theme.colors.outline} /></TouchableOpacity>}
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8 }}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFilter(f)}
              style={[styles.filterChip, { backgroundColor: activeFilter === f ? theme.colors.accent : theme.colors.surfaceContainer, borderColor: activeFilter === f ? theme.colors.accent : theme.colors.outlineVariant }]}
            >
              <Text style={[Typography.labelSM, { color: activeFilter === f ? '#fff' : theme.colors.onSurfaceVariant, textTransform: 'uppercase' }]}>
                {f === 'All' ? 'All' : STATUS_CFG[f]?.text ?? f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Document Cards */}
        <View style={{ gap: 12 }}>
          {filtered.map((doc: any) => {
            const sc = STATUS_CFG[doc.blockchainStatus] ?? STATUS_CFG.UNVERIFIED;
            const di = DOC_ICONS[doc.docType] ?? DOC_ICONS.OTHER;
            return (
              <TouchableOpacity key={doc.id} activeOpacity={0.8} onPress={() => navigation.navigate('BlockchainVerification', { documentId: doc.id })}>
                <GlassCard padding={16}>
                  <View style={styles.docHeader}>
                    <View style={[styles.docIcon, { backgroundColor: di.color + '18' }]}>
                      <Ionicons name={di.icon} size={24} color={di.color} />
                    </View>
                    <Badge label={sc.text} color={sc.color} backgroundColor={sc.bg} borderColor={sc.border} iconName={sc.icon} />
                  </View>
                  <Text style={[Typography.headlineMD, { color: theme.colors.onSurface, marginTop: 12, marginBottom: 4 }]}>{doc.title}</Text>
                  <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, fontSize: 13 }]}>
                    {doc.issuedBy ?? doc.docType} {doc.expiryDate ? `• Expires ${new Date(doc.expiryDate).toLocaleDateString('en-IN')}` : ''}
                  </Text>
                  <View style={[styles.docFooter, { borderTopColor: theme.colors.cardBorder }]}>
                    <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant }]}>
                      Added {new Date(doc.createdAt).toLocaleDateString('en-IN')}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      {doc.blockchainStatus === 'UNVERIFIED' && (
                        <TouchableOpacity onPress={async () => {
                          try { await documentsApi.submitToBlockchain(doc.id); refresh(); Alert.alert('Submitted', 'Document submitted to blockchain.'); }
                          catch (e: any) { Alert.alert('Error', e.message); }
                        }}>
                          <Ionicons name="cube-outline" size={18} color={theme.colors.accent} />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity onPress={() => handleDelete(doc.id, doc.title)}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                      <Ionicons name="arrow-forward" size={18} color={theme.colors.onSurfaceVariant} />
                    </View>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>

        {filtered.length === 0 && !loading && (
          <View style={styles.empty}>
            <Ionicons name="folder-open-outline" size={48} color={theme.colors.onSurfaceVariant} />
            <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, marginTop: 12 }]}>No documents found</Text>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={[styles.fab, { backgroundColor: theme.colors.accent, shadowColor: theme.colors.accent }]} onPress={() => navigation.navigate('AIDocumentProcessing')} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 120 },
  secRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 6 },
  searchRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, gap: 8 },
  searchInput: { flex: 1, padding: 0 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  docHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  docIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  docFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 10, borderTopWidth: 1 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  fab: { position: 'absolute', bottom: 110, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
});
