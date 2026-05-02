import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { GlassCard } from '../components/GlassCard';
import { Header } from '../components/Header';
import { Badge } from '../components/Badge';
import { LoadingView, ErrorView } from '../components/LoadingView';
import { Typography } from '../theme/typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApi } from '../hooks/useApi';
import { paymentsApi } from '../services/api';

const PURPOSE_META: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  DOCUMENT_UPLOAD: { label: 'Document Upload',   icon: 'cloud-upload-outline', color: '#14B8A6' },
  API_INTEGRATION: { label: 'API Integration',   icon: 'link-outline',         color: '#6366F1' },
  SUBSCRIPTION:    { label: 'Subscription',       icon: 'star-outline',         color: '#F59E0B' },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  SUCCESS:  { label: 'Paid',    color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  PENDING:  { label: 'Pending', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  FAILED:   { label: 'Failed',  color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  REFUNDED: { label: 'Refunded',color: '#94A3B8', bg: 'rgba(148,163,184,0.1)' },
};

const timeStr = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const PaymentHistoryScreen = ({ navigation }: any) => {
  const { theme, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<any>(null);

  const { data: transactions, loading, error, refresh } = useApi<any[]>(() => paymentsApi.getHistory());

  const onRefresh = () => { setRefreshing(true); refresh(); setTimeout(() => setRefreshing(false), 1000); };

  const totalSpend = (transactions ?? [])
    .filter(t => t.status === 'SUCCESS')
    .reduce((s: number, t: any) => s + t.amount, 0);

  if (loading && !transactions) return <LoadingView message="Loading payment history..." />;
  if (error && !transactions) return <ErrorView message={error} onRetry={refresh} />;

  return (
    <View style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <Header title="Payment History" showBack onBack={() => navigation.goBack()} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />}
      >
        <Text style={[Typography.headlineLG, { color: theme.colors.onSurface, marginTop: 16, marginBottom: 4 }]}>
          Payment History
        </Text>
        <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, marginBottom: 20 }]}>
          Every payment locks a blockchain proof — document hash + your access list — permanently on Polygon.
        </Text>

        {/* Summary */}
        <View style={styles.summaryRow}>
          <GlassCard style={{ flex: 1 }} padding={14}>
            <Text style={[Typography.headlineMD, { color: theme.colors.accent, fontSize: 22, textAlign: 'center' }]}>
              ₹{totalSpend.toFixed(0)}
            </Text>
            <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 3 }]}>Total Spent</Text>
          </GlassCard>
          <GlassCard style={{ flex: 1 }} padding={14}>
            <Text style={[Typography.headlineMD, { color: theme.colors.onSurface, fontSize: 22, textAlign: 'center' }]}>
              {(transactions ?? []).filter((t: any) => t.status === 'SUCCESS').length}
            </Text>
            <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 3 }]}>Transactions</Text>
          </GlassCard>
          <GlassCard style={{ flex: 1 }} padding={14}>
            <Text style={[Typography.headlineMD, { color: isDark ? '#64FFDA' : '#0A192F', fontSize: 22, textAlign: 'center' }]}>
              {(transactions ?? []).filter((t: any) => t.blockchainTxHash).length}
            </Text>
            <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 3 }]}>On-Chain</Text>
          </GlassCard>
        </View>

        {/* Transaction list */}
        {(transactions ?? []).length === 0 ? (
          <GlassCard padding={32}>
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="receipt-outline" size={40} color={theme.colors.onSurfaceVariant} />
              <Text style={[Typography.headlineMD, { color: theme.colors.onSurface, marginTop: 16, textAlign: 'center' }]}>
                No payments yet
              </Text>
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, marginTop: 6, textAlign: 'center' }]}>
                Upload a document (₹5) or connect an account (₹10) to get started.
              </Text>
            </View>
          </GlassCard>
        ) : (
          <View style={{ gap: 10 }}>
            {(transactions ?? []).map((txn: any) => {
              const pm = PURPOSE_META[txn.purpose] || PURPOSE_META.DOCUMENT_UPLOAD;
              const sm = STATUS_META[txn.status] || STATUS_META.PENDING;
              const hasProof = !!txn.blockchainTxHash;

              return (
                <TouchableOpacity key={txn.id} onPress={() => setSelectedTxn(txn)} activeOpacity={0.8}>
                  <GlassCard padding={14} style={hasProof ? { borderColor: isDark ? 'rgba(100,255,218,0.15)' : 'rgba(20,184,166,0.15)' } : {}}>
                    <View style={styles.txnRow}>
                      <View style={[styles.txnIcon, { backgroundColor: pm.color + '18' }]}>
                        <Ionicons name={pm.icon} size={20} color={pm.color} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600' }]}>
                            {pm.label}
                          </Text>
                          <Badge
                            label={sm.label}
                            color={sm.color}
                            backgroundColor={sm.bg}
                            borderColor={sm.color + '30'}
                          />
                        </View>
                        <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant }]}>
                          {timeStr(txn.createdAt)}
                        </Text>
                        {txn.accountProvider && (
                          <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}>
                            Provider: {txn.accountProvider}
                          </Text>
                        )}
                        {hasProof && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                            <Ionicons name="cube" size={11} color={theme.colors.accent} />
                            <Text style={[Typography.labelSM, { color: theme.colors.accent }]}>
                              Blockchain proof anchored
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[Typography.headlineMD, { color: theme.colors.onSurface, fontSize: 16 }]}>
                          ₹{txn.amount}
                        </Text>
                        <Ionicons name="chevron-forward" size={14} color={theme.colors.onSurfaceVariant} style={{ marginTop: 4 }} />
                      </View>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Transaction Detail Modal */}
      <Modal visible={!!selectedTxn} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.colors.surface, borderColor: theme.colors.cardBorder }]}>
            <View style={[styles.handle, { backgroundColor: theme.colors.outlineVariant }]} />

            {selectedTxn && (() => {
              const pm = PURPOSE_META[selectedTxn.purpose] || PURPOSE_META.DOCUMENT_UPLOAD;
              const sm = STATUS_META[selectedTxn.status] || STATUS_META.PENDING;
              const proof = selectedTxn.blockchainProof as any;

              return (
                <>
                  <View style={styles.modalHeader}>
                    <View style={[styles.txnIcon, { backgroundColor: pm.color + '18', width: 52, height: 52, borderRadius: 16 }]}>
                      <Ionicons name={pm.icon} size={24} color={pm.color} />
                    </View>
                    <TouchableOpacity onPress={() => setSelectedTxn(null)} style={styles.closeBtn}>
                      <Ionicons name="close" size={22} color={theme.colors.onSurfaceVariant} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
                    <Text style={[Typography.headlineMD, { color: theme.colors.onSurface, marginBottom: 4 }]}>
                      {pm.label}
                    </Text>
                    <Text style={[Typography.headlineLG, { color: pm.color, marginBottom: 16 }]}>
                      ₹{selectedTxn.amount}
                    </Text>

                    {/* Details grid */}
                    {[
                      { label: 'Status', value: sm.label, color: sm.color },
                      { label: 'Date', value: timeStr(selectedTxn.createdAt) },
                      { label: 'Transaction ID', value: selectedTxn.id.slice(0, 20) + '...' },
                      selectedTxn.razorpayPaymentId && { label: 'Razorpay ID', value: selectedTxn.razorpayPaymentId },
                      selectedTxn.accountProvider && { label: 'Provider', value: selectedTxn.accountProvider },
                    ].filter(Boolean).map((item: any, i) => (
                      <View key={i} style={[styles.detailRow, { borderBottomColor: theme.colors.cardBorder }]}>
                        <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8 }]}>
                          {item.label}
                        </Text>
                        <Text style={[Typography.bodyMD, { color: item.color || theme.colors.onSurface, fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 12 }]}>
                          {item.value}
                        </Text>
                      </View>
                    ))}

                    {/* Blockchain Proof */}
                    {proof ? (
                      <View style={{ marginTop: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <Ionicons name="cube" size={18} color={theme.colors.accent} />
                          <Text style={[Typography.headlineMD, { color: theme.colors.onSurface }]}>
                            Blockchain Proof
                          </Text>
                        </View>

                        <GlassCard padding={12} style={{ borderColor: theme.colors.accent + '25', marginBottom: 8 }}>
                          <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }]}>
                            Proof Hash (SHA-256)
                          </Text>
                          <Text style={[Typography.mono, { color: isDark ? '#B9C7E4' : '#0A192F', fontSize: 11 }]} numberOfLines={2}>
                            0x{proof.proofHash}
                          </Text>
                        </GlassCard>

                        <GlassCard padding={12} style={{ borderColor: theme.colors.accent + '25', marginBottom: 8 }}>
                          <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }]}>
                            Transaction Hash
                          </Text>
                          <Text style={[Typography.mono, { color: isDark ? '#B9C7E4' : '#0A192F', fontSize: 11 }]} numberOfLines={2}>
                            {proof.txHash}
                          </Text>
                        </GlassCard>

                        {[
                          { label: 'Network', value: proof.network },
                          { label: 'Block Number', value: `#${proof.blockNumber}` },
                          { label: 'Owner', value: proof.ownerUserId?.slice(0, 16) + '...' },
                          { label: 'Accessors', value: `${proof.accessorIds?.length || 1} (you + nominees)` },
                          { label: 'Anchored At', value: new Date(proof.timestamp).toLocaleString('en-IN') },
                        ].map((item, i) => (
                          <View key={i} style={[styles.detailRow, { borderBottomColor: theme.colors.cardBorder }]}>
                            <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8 }]}>{item.label}</Text>
                            <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 12 }]}>{item.value}</Text>
                          </View>
                        ))}

                        <View style={[styles.anchorNotice, { backgroundColor: isDark ? 'rgba(100,255,218,0.06)' : 'rgba(20,184,166,0.06)', borderColor: isDark ? 'rgba(100,255,218,0.15)' : 'rgba(20,184,166,0.2)' }]}>
                          <Ionicons name="information-circle-outline" size={14} color={theme.colors.accent} />
                          <Text style={[Typography.labelSM, { color: theme.colors.accent, marginLeft: 6, flex: 1, lineHeight: 18 }]}>
                            This proof is permanently immutable. Even if DhanLekha servers go offline, the on-chain record can always be independently verified.
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View style={[styles.pendingProof, { backgroundColor: isDark ? 'rgba(245,158,11,0.06)' : 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)' }]}>
                        <Ionicons name="time-outline" size={16} color="#F59E0B" />
                        <Text style={[Typography.bodyMD, { color: '#F59E0B', marginLeft: 8 }]}>
                          Blockchain anchoring in progress...
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  txnRow: { flexDirection: 'row', alignItems: 'flex-start' },
  txnIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, padding: 24, paddingBottom: 36 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  closeBtn: { padding: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1 },
  anchorNotice: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, marginTop: 12, gap: 4 },
  pendingProof: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, marginTop: 16 },
});
