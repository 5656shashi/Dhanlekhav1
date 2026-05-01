import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { GlassCard } from '../components/GlassCard';
import { Header } from '../components/Header';
import { PrimaryButton } from '../components/PrimaryButton';
import { Badge } from '../components/Badge';
import { Typography } from '../theme/typography';
import { SafeAreaView } from 'react-native-safe-area-context';

const HASH = '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b';

export const BlockchainVerificationScreen = ({ navigation }: any) => {
  const { theme, isDark } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    Clipboard.setString(HASH);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <Header title="Blockchain Proof" showBack onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 6 }}>
          <Ionicons name="shield-checkmark" size={16} color={theme.colors.accent} />
          <Text style={[Typography.labelSM, { color: theme.colors.accent, textTransform: 'uppercase', letterSpacing: 1.2 }]}>
            Blockchain Verified
          </Text>
        </View>
        <Text style={[Typography.headlineLG, { color: theme.colors.onSurface, marginBottom: 4 }]}>
          Asset Verification Detail
        </Text>
        <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, marginBottom: 20 }]}>
          Immutable proof of ownership stored on the decentralized ledger.
        </Text>

        {/* Main Certificate Card */}
        <GlassCard padding={20} style={{ marginBottom: 12, overflow: 'hidden' }}>
          <LinearGradient
            colors={isDark ? ['rgba(100,255,218,0.04)', 'transparent'] : ['rgba(20,184,166,0.04)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.certHeader}>
            <View>
              <Text style={[Typography.headlineMD, { color: theme.colors.onSurface }]}>
                Fixed Deposit Receipt
              </Text>
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}>
                HDFC Bank Ltd.
              </Text>
            </View>
            <View style={[styles.activeBadge, { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.2)' }]}>
              <View style={styles.activeDot} />
              <Text style={[Typography.labelSM, { color: '#10B981', marginLeft: 6 }]}>Active</Text>
            </View>
          </View>

          <View style={[styles.valueRow, { borderTopColor: theme.colors.cardBorder, borderBottomColor: theme.colors.cardBorder }]}>
            <View>
              <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 }]}>
                Asset Value
              </Text>
              <Text style={[Typography.headlineLG, { color: theme.colors.onSurface, marginTop: 4 }]}>
                ₹25,00,000
              </Text>
            </View>
            <View>
              <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 }]}>
                Maturity Date
              </Text>
              <Text style={[Typography.headlineMD, { color: theme.colors.onSurface, marginTop: 4 }]}>
                14 Oct 2028
              </Text>
            </View>
          </View>

          {/* Hash */}
          <View style={{ marginTop: 16 }}>
            <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }]}>
              Cryptographic Hash (SHA-256)
            </Text>
            <View style={[styles.hashBox, { backgroundColor: theme.colors.surfaceContainerLow, borderColor: theme.colors.outlineVariant }]}>
              <Text style={[Typography.mono, { color: isDark ? '#B9C7E4' : '#0A192F', flex: 1, fontSize: 11 }]} numberOfLines={1} ellipsizeMode="middle">
                {HASH}
              </Text>
              <TouchableOpacity onPress={handleCopy} style={styles.copyBtn}>
                <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color={copied ? theme.colors.accent : theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Block details */}
          <View style={styles.metaRow}>
            <View style={{ flex: 1 }}>
              <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }]}>
                Block Number
              </Text>
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurface }]}>
                #14,859,201
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }]}>
                Timestamp
              </Text>
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurface }]}>
                24 Oct 2023, 14:32 UTC
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Network & Consensus bento */}
        <View style={styles.bentoRow}>
          <GlassCard style={{ flex: 1 }} padding={14}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Ionicons name="git-network-outline" size={18} color={isDark ? '#B9C7E4' : '#0A192F'} />
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600', fontSize: 13 }]}>
                Network
              </Text>
            </View>
            <Text style={[Typography.headlineMD, { color: isDark ? '#D6E3FF' : '#0A192F', fontSize: 15 }]}>
              Ethereum Mainnet
            </Text>
            <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 4 }]}>
              ERC-721 Smart Contract
            </Text>
          </GlassCard>
          <GlassCard style={{ flex: 1 }} padding={14}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Ionicons name="checkmark-done-outline" size={18} color={theme.colors.accent} />
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600', fontSize: 13 }]}>
                Consensus
              </Text>
            </View>
            <Text style={[Typography.headlineMD, { color: theme.colors.accent, fontSize: 15 }]}>
              Proof of Stake
            </Text>
            <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 4 }]}>
              128 Confirmations
            </Text>
          </GlassCard>
        </View>

        {/* QR Code area */}
        <GlassCard style={{ marginBottom: 12, alignItems: 'center' }} padding={20}>
          <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600', marginBottom: 14 }]}>
            Verification QR Code
          </Text>
          {/* Simulated QR */}
          <View style={[styles.qrBox, { backgroundColor: '#FFFFFF' }]}>
            <View style={styles.qrInner}>
              {[...Array(6)].map((_, row) => (
                <View key={row} style={{ flexDirection: 'row', gap: 3 }}>
                  {[...Array(6)].map((_, col) => (
                    <View
                      key={col}
                      style={[
                        styles.qrCell,
                        { backgroundColor: (row + col) % 2 === 0 || (row * col) % 3 === 0 ? '#000' : 'transparent' },
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>
          </View>
          <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 12, lineHeight: 18 }]}>
            Scan to verify authenticity via DhanLekha public explorer.
          </Text>

          {/* Origin */}
          <View style={[styles.originRow, { borderTopColor: theme.colors.cardBorder }]}>
            <View style={[styles.originIcon, { backgroundColor: theme.colors.surfaceContainerHigh, borderColor: theme.colors.outlineVariant }]}>
              <Ionicons name="business-outline" size={20} color={theme.colors.onSurface} />
            </View>
            <View>
              <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: '600' }]}>
                HDFC Bank Ltd.
              </Text>
              <Text style={[Typography.labelSM, { color: theme.colors.accent, marginTop: 2 }]}>
                Verified Issuer Node
              </Text>
            </View>
          </View>
        </GlassCard>

        <PrimaryButton
          label="View on Block Explorer"
          onPress={() => Alert.alert('Block Explorer', 'Opening Etherscan...')}
          iconName="open-outline"
          style={{ marginBottom: 20 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 100 },
  certHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 14,
    marginBottom: 0,
  },
  hashBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  copyBtn: {
    padding: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 14,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  qrBox: {
    width: 140,
    height: 140,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  qrInner: {
    gap: 3,
    alignItems: 'center',
  },
  qrCell: {
    width: 14,
    height: 14,
    borderRadius: 2,
  },
  originRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderTopWidth: 1,
    marginTop: 16,
    paddingTop: 16,
    width: '100%',
  },
  originIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
