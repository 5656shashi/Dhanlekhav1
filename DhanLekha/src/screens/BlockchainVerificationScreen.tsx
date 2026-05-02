import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, Clipboard, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { GlassCard } from '../components/GlassCard';
import { Header } from '../components/Header';
import { PrimaryButton } from '../components/PrimaryButton';
import { LoadingView, ErrorView } from '../components/LoadingView';
import { Typography } from '../theme/typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApi } from '../hooks/useApi';
import { documentsApi } from '../services/api';

export const BlockchainVerificationScreen = ({ navigation, route }: any) => {
  const { theme, isDark } = useTheme();
  const documentId: string = route?.params?.documentId;

  const { data: blockchainData, loading, error, refresh } = useApi(
    () => documentId ? documentsApi.getBlockchainDetails(documentId) : Promise.resolve(null),
    [documentId]
  );

  // Auto-poll if still mining
  React.useEffect(() => {
    if (blockchainData?.blockchainStatus === 'PENDING_TX') {
      const interval = setInterval(() => refresh(), 3000);
      return () => clearInterval(interval);
    }
  }, [blockchainData?.blockchainStatus]);

  const [copied, setCopied] = React.useState(false);

  const handleCopy = (text: string) => {
    Clipboard.setString(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!documentId) {
    return (
      <View style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <Header title="Blockchain Proof" showBack onBack={() => navigation.goBack()} />
        <ErrorView message="No document selected. Go to Document Vault and tap a document." onRetry={() => navigation.navigate('DocumentVault')} />
      </View>
    );
  }

  if (loading) return <LoadingView message="Fetching blockchain data..." />;
  if (error) return (
    <View style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <Header title="Blockchain Proof" showBack onBack={() => navigation.goBack()} />
      <ErrorView message={error} onRetry={refresh} />
    </View>
  );

  const d = blockchainData;
  const isVerified = d?.blockchainStatus === 'VERIFIED';

  return (
    <View style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <Header title="Blockchain Proof" showBack onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 6 }}>
          <Ionicons name={isVerified ? "shield-checkmark" : "sync"} size={16} color={isVerified ? theme.colors.accent : "#F59E0B"} />
          <Text style={[Typography.labelSM, { color: isVerified ? theme.colors.accent : "#F59E0B", textTransform: 'uppercase', letterSpacing: 1.2 }]}>
            {isVerified ? 'Blockchain Verified' : d?.blockchainStatus === 'PENDING_TX' ? 'Mining on Polygon...' : 'Not Yet Verified'}
          </Text>
        </View>
        <Text style={[Typography.headlineLG, { color: theme.colors.onSurface, marginBottom: 4 }]}>Asset Verification Detail</Text>
        <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, marginBottom: 20 }]}>Immutable proof of ownership stored on the decentralized ledger.</Text>

        {/* Certificate Card */}
        <GlassCard padding={20} style={{ marginBottom: 12, overflow: 'hidden' }}>
          <LinearGradient colors={isDark ? ['rgba(100,255,218,0.04)', 'transparent'] : ['rgba(20,184,166,0.04)', 'transparent']} style={StyleSheet.absoluteFill} />
          <View style={styles.certHeader}>
            <View>
              <Text style={[Typography.headlineMD, { color: theme.colors.onSurface }]}>{d?.title || 'Document'}</Text>
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}>{d?.issuedBy || '—'}</Text>
            </View>
            <View style={[styles.statusBadge, isVerified ? { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.2)' } : { backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.2)' }]}>
              <View style={[styles.statusDot, { backgroundColor: isVerified ? '#10B981' : '#F59E0B' }]} />
              <Text style={[Typography.labelSM, { color: isVerified ? '#10B981' : '#F59E0B', marginLeft: 6 }]}>
                {isVerified ? 'Active' : d?.blockchainStatus === 'PENDING_TX' ? 'Mining' : 'Unverified'}
              </Text>
            </View>
          </View>

          {/* Anchored Notes Preview */}
          <View style={{ marginTop: 12, padding: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: 12, borderLeftWidth: 3, borderLeftColor: theme.colors.accent }}>
            <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, fontSize: 10, letterSpacing: 0.5, marginBottom: 4 }]}>TRANSACTION NOTES (ON-CHAIN DATA)</Text>
            <Text style={[Typography.mono, { color: theme.colors.onSurface, fontSize: 12 }]}>
              DL_PROOF:{d?.documentHash?.substring(0, 32)}...
            </Text>
          </View>

          {/* Hash */}
          {d?.documentHash && (
            <View style={{ marginTop: 16 }}>
              <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }]}>Cryptographic Hash (SHA-256)</Text>
              <View style={[styles.hashBox, { backgroundColor: theme.colors.surfaceContainerLow, borderColor: theme.colors.outlineVariant }]}>
                <Text style={[Typography.mono, { color: isDark ? '#B9C7E4' : '#0A192F', flex: 1, fontSize: 11 }]} numberOfLines={1} ellipsizeMode="middle">
                  {d.documentHash}
                </Text>
                <TouchableOpacity onPress={() => handleCopy(d.documentHash)} style={styles.copyBtn}>
                  <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color={copied ? theme.colors.accent : theme.colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* TX Hash */}
          {d?.txHash && (
            <View style={{ marginTop: 14 }}>
              <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }]}>Transaction Hash</Text>
              <View style={[styles.hashBox, { backgroundColor: theme.colors.surfaceContainerLow, borderColor: theme.colors.outlineVariant }]}>
                <Text style={[Typography.mono, { color: isDark ? '#B9C7E4' : '#0A192F', flex: 1, fontSize: 11 }]} numberOfLines={1} ellipsizeMode="middle">
                  {d.txHash}
                </Text>
                <TouchableOpacity onPress={() => handleCopy(d.txHash)} style={styles.copyBtn}>
                  <Ionicons name="copy-outline" size={16} color={theme.colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Block details */}
          {d?.blockNumber && (
            <View style={styles.metaRow}>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }]}>Block Number</Text>
                <Text style={[Typography.bodyMD, { color: theme.colors.onSurface }]}>#{d.blockNumber.toString()}</Text>
              </View>
              {d.verifiedAt && (
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }]}>Verified At</Text>
                  <Text style={[Typography.bodyMD, { color: theme.colors.onSurface }]}>{new Date(d.verifiedAt).toLocaleString('en-IN')}</Text>
                </View>
              )}
            </View>
          )}
        </GlassCard>

        {/* Network details */}
        <View style={styles.bentoRow}>
          <GlassCard style={{ flex: 1 }} padding={14}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Ionicons name="git-network-outline" size={18} color={isDark ? '#B9C7E4' : '#0A192F'} />
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600', fontSize: 13 }]}>Network</Text>
            </View>
            <Text style={[Typography.headlineMD, { color: isDark ? '#D6E3FF' : '#0A192F', fontSize: 15 }]}>Polygon Amoy Testnet</Text>
            <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 4 }]}>DhanLekha Anchor Layer</Text>
          </GlassCard>
          <GlassCard style={{ flex: 1 }} padding={14}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Ionicons name="checkmark-done-outline" size={18} color={theme.colors.accent} />
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600', fontSize: 13 }]}>Consensus</Text>
            </View>
            <Text style={[Typography.headlineMD, { color: theme.colors.accent, fontSize: 15 }]}>Proof of Stake</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <Ionicons name="finger-print" size={10} color={theme.colors.onSurfaceVariant} />
              <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant }]}>Deterministic Anchor</Text>
            </View>
          </GlassCard>
        </View>

        {/* Submit if not yet verified */}
        {!isVerified && d?.blockchainStatus !== 'PENDING_TX' && (
          <PrimaryButton
            label="Submit to Blockchain"
            onPress={async () => {
              try {
                await documentsApi.submitToBlockchain(documentId);
                refresh();
                Alert.alert('Submitted', 'Document submitted to Polygon. Verification pending.');
              } catch (e: any) { Alert.alert('Error', e.message); }
            }}
            iconName="cube-outline"
            style={{ marginBottom: 12 }}
          />
        )}

        {d?.txHash && (
          <PrimaryButton
            label={d?.blockchainStatus === 'PENDING_TX' ? "View Live Mining..." : "View on Polygonscan"}
            onPress={() => {
              const url = d.explorerUrl || `https://amoy.polygonscan.com/tx/${d.txHash}`;
              Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open explorer.'));
            }}
            iconName="open-outline"
            variant={d?.blockchainStatus === 'PENDING_TX' ? "primary" : "outline"}
            style={{ marginBottom: 20 }}
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  certHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  hashBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  copyBtn: { padding: 4 },
  metaRow: { flexDirection: 'row', gap: 20, marginTop: 14 },
  bentoRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
});
