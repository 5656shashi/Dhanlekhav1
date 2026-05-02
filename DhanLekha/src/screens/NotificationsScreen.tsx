import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { GlassCard } from '../components/GlassCard';
import { Header } from '../components/Header';
import { LoadingView, ErrorView } from '../components/LoadingView';
import { Typography } from '../theme/typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApi } from '../hooks/useApi';
import { notificationsApi } from '../services/api';

const NOTIF_ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  DOCUMENT_VERIFIED:  { icon: 'shield-checkmark', color: '#14B8A6' },
  NOMINEE_ADDED:      { icon: 'person-add', color: '#6366F1' },
  ACCOUNT_SYNCED:     { icon: 'sync', color: '#3B82F6' },
  LEGACY_SWITCH_WARNING:   { icon: 'warning', color: '#F59E0B' },
  REPORT_READY:       { icon: 'document-text', color: '#10B981' },
  PAYMENT_SUCCESS:    { icon: 'checkmark-circle', color: '#14B8A6' },
  SECURITY_ALERT:     { icon: 'alert-circle', color: '#EF4444' },
  SYSTEM:             { icon: 'notifications', color: '#94A3B8' },
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export const NotificationsScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const { data: notifications, loading, error, refresh } = useApi<any[]>(
    () => notificationsApi.list({ limit: 50 })
  );

  const onRefresh = () => { setRefreshing(true); refresh(); setTimeout(() => setRefreshing(false), 1000); };

  const handleMarkRead = async (id: string) => {
    try { await notificationsApi.markRead(id); refresh(); }
    catch {}
  };

  const handleMarkAllRead = async () => {
    try { await notificationsApi.markAllRead(); refresh(); }
    catch {}
  };

  const unreadCount = (notifications ?? []).filter((n: any) => !n.isRead).length;

  if (loading && !notifications) return <LoadingView message="Loading notifications..." />;
  if (error && !notifications) return <ErrorView message={error} onRetry={refresh} />;

  return (
    <View style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <Header title="Notifications" showBack onBack={() => navigation.goBack()} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />}
      >
        <View style={styles.topRow}>
          <View>
            <Text style={[Typography.headlineLG, { color: theme.colors.onSurface }]}>Notifications</Text>
            {unreadCount > 0 && (
              <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}>
                {unreadCount} unread
              </Text>
            )}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity style={[styles.markAllBtn, { backgroundColor: theme.colors.accent + '15', borderColor: theme.colors.accent + '25' }]} onPress={handleMarkAllRead}>
              <Text style={[Typography.labelSM, { color: theme.colors.accent, textTransform: 'uppercase' }]}>Mark All Read</Text>
            </TouchableOpacity>
          )}
        </View>

        {(notifications ?? []).length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color={theme.colors.onSurfaceVariant} />
            <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, marginTop: 12 }]}>No notifications yet</Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {(notifications ?? []).map((notif: any) => {
              const meta = NOTIF_ICONS[notif.type] || NOTIF_ICONS.SYSTEM;
              return (
                <TouchableOpacity
                  key={notif.id}
                  activeOpacity={0.8}
                  onPress={() => !notif.isRead && handleMarkRead(notif.id)}
                >
                  <GlassCard
                    padding={14}
                    style={[
                      styles.notifCard,
                      !notif.isRead && { borderColor: meta.color + '30', borderWidth: 1.5 },
                    ]}
                  >
                    <View style={styles.notifRow}>
                      <View style={[styles.notifIcon, { backgroundColor: meta.color + '18' }]}>
                        <Ionicons name={meta.icon} size={20} color={meta.color} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <Text style={[Typography.bodyMD, { color: theme.colors.onSurface, fontWeight: notif.isRead ? '400' : '600', flex: 1 }]}>
                            {notif.title}
                          </Text>
                          {!notif.isRead && <View style={[styles.unreadDot, { backgroundColor: meta.color }]} />}
                        </View>
                        <Text style={[Typography.bodyMD, { color: theme.colors.onSurfaceVariant, fontSize: 13, lineHeight: 18 }]}>
                          {notif.body}
                        </Text>
                        <Text style={[Typography.labelSM, { color: theme.colors.onSurfaceVariant, marginTop: 6 }]}>
                          {timeAgo(notif.createdAt)}
                        </Text>
                      </View>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 120 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 16, marginBottom: 16 },
  markAllBtn: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  notifCard: { borderRadius: 14 },
  notifRow: { flexDirection: 'row', alignItems: 'flex-start' },
  notifIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  empty: { alignItems: 'center', paddingVertical: 80 },
});
