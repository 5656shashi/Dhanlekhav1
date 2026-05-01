import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { GlassCard } from '../components/GlassCard';
import { Header } from '../components/Header';
import { Badge } from '../components/Badge';
import { Typography } from '../theme/typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentService from '../api/services/document.service';

const { width } = Dimensions.get('window');

const INITIAL_DOCS: any[] = [
  {
    id: '1',
    title: 'Property Deed',
    subtitle: 'Residential • ID: 4920-AB',
    added: 'Added Oct 12, 2023',
    status: 'verified',
    statusLabel: 'Verified',
    icon: 'home-outline' as const,
    iconColor: '#14B8A6',
    accentColor: '#14B8A6',
  },
  {
    id: '2',
    title: 'Term Life Policy',
    subtitle: 'HDFC Life • Pol #99218',
    added: 'Awaiting Signature',
    status: 'pending',
    statusLabel: 'Pending',
    icon: 'shield-outline' as const,
    iconColor: '#6366F1',
    accentColor: '#6366F1',
  },
  {
    id: '3',
    title: 'Demat Holdings',
    subtitle: 'Zerodha • e-Cert Missing',
    added: 'Update Required',
    status: 'action',
    statusLabel: 'Action Needed',
    icon: 'document-text-outline' as const,
    iconColor: '#EF4444',
    accentColor: '#EF4444',
  },
];

const STATUS_CONFIG: Record<string, { iconName: keyof typeof Ionicons.glyphMap; bg: string; border: string; text: string }> = {
  verified: { iconName: 'checkmark-circle', bg: 'rgba(20,184,166,0.1)', border: 'rgba(20,184,166,0.25)', text: '#14B8A6' },
  pending: { iconName: 'time-outline', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.25)', text: '#6366F1' },
  action: { iconName: 'warning-outline', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', text: '#EF4444' },
};

export const DocumentVaultScreen = ({ navigation }: any) => {
  const { theme, isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [documents, setDocuments] = useState<any[]>(INITIAL_DOCS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      setIsLoading(true);
      const data = await DocumentService.getDocuments();
      if (data && data.length > 0) setDocuments(data);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filters = ['All', 'Verified', 'Pending', 'Action'];

  const filtered = documents.filter((d) => {
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase());
    if (activeFilter === 'All') return matchSearch;
    return matchSearch && d.statusLabel.toLowerCase().startsWith(activeFilter.toLowerCase());
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <Header
        title="Document Vault"
        showThemeToggle
        rightIcon="notifications-outline"
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Security label */}
        <View style={styles.secRow}>
          <Ionicons name="lock-closed" size={14} color={theme.colors.primary} />
          <Text style={[Typography.labelSM, { color: theme.colors.primary, marginLeft: 5, letterSpacing: 1 }]}>
            ENCRYPTED VAULT SESSION
          </Text>
        </View>
        <Text style={[Typography.headlineLG, { color: theme.colors.onSurface, marginBottom: 4 }]}>
          Document Vault
        </Text>
        <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, marginBottom: 16 }]}>
          Securely manage and verify your critical financial and legal records.
        </Text>

        {/* Search */}
        <View style={[styles.searchRow, { backgroundColor: theme.colors.surfaceContainerLow, borderColor: theme.colors.outlineVariant }]}>
          <Ionicons name="search-outline" size={18} color={theme.colors.outline} />
          <TextInput
            style={[Typography.bodyMD, styles.searchInput, { color: theme.colors.onSurface }]}
            placeholder="Search documents, policies..."
            placeholderTextColor={theme.colors.outline}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={theme.colors.outline} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ gap: 8 }}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFilter(f)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: activeFilter === f ? theme.colors.accent : theme.colors.surfaceContainer,
                  borderColor: activeFilter === f ? theme.colors.accent : theme.colors.outlineVariant,
                },
              ]}
            >
              <Text style={[Typography.labelSM, { color: activeFilter === f ? (isDark ? '#0A192F' : '#fff') : theme.colors.onSurfaceVariant, textTransform: 'uppercase' }]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Document Cards */}
        <View style={styles.grid}>
          {filtered.map((doc) => {
            const sc = STATUS_CONFIG[doc.status];
            return (
              <TouchableOpacity
                key={doc.id}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('BlockchainVerification')}
              >
                <GlassCard style={[styles.docCard, { borderColor: isDark ? 'rgba(255,255,255,0.07)' : theme.colors.cardBorder }]} padding={16}>
                  <View style={styles.docHeader}>
                    <View style={[styles.docIconWrap, { backgroundColor: doc.accentColor + '18' }]}>
                      <Ionicons name={doc.icon} size={24} color={doc.iconColor} />
                    </View>
                    <Badge
                      label={doc.statusLabel}
                      color={sc.text}
                      backgroundColor={sc.bg}
                      borderColor={sc.border}
                      iconName={sc.iconName}
                    />
                  </View>
                  <Text style={[Typography.headlineMD, { color: theme.colors.onSurface, marginTop: 12, marginBottom: 4 }]}>
                    {doc.title}
                  </Text>
                  <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, fontSize: 13 }]}>
                    {doc.subtitle}
                  </Text>
                  <View style={[styles.docFooter, { borderTopColor: theme.colors.cardBorder }]}>
                    <Text style={[Typography.labelSM, { color: doc.status === 'action' ? sc.text : theme.colors.onSurfaceVariant }]}>
                      {doc.added}
                    </Text>
                    <Ionicons name="arrow-forward" size={16} color={theme.colors.onSurfaceVariant} />
                  </View>
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="folder-open-outline" size={48} color={theme.colors.onSurfaceVariant} />
            <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, marginTop: 12 }]}>
              No documents found
            </Text>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.accent, shadowColor: theme.colors.accent }]}
        onPress={() => navigation.navigate('AIDocumentProcessing')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={isDark ? '#0A192F' : '#FFFFFF'} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 100 },
  secRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 6 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: { flex: 1, padding: 0 },
  filterRow: { marginBottom: 16 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  grid: { gap: 12 },
  docCard: {
    borderRadius: 20,
  },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  docIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  empty: { alignItems: 'center', paddingVertical: 60 },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
