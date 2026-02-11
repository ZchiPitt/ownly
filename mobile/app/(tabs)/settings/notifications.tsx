import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../../components';
import { useAuth } from '../../../contexts';
import {
  type AppNotification,
  useExpoPushRegistration,
  useMarkNotificationReadMutation,
  useNotifications,
} from '../../../hooks';
import { resolveNotificationTarget } from '../../../lib/notificationRouting';

function formatNotificationDate(createdAt: string): string {
  const parsedDate = new Date(createdAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return 'Just now';
  }

  return parsedDate.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const pushRegistration = useExpoPushRegistration(user?.id);
  const { data = [], isLoading, isError, error, refetch } = useNotifications(user?.id);
  const markReadMutation = useMarkNotificationReadMutation();

  const unreadCount = useMemo(() => data.filter((notification) => !notification.isRead).length, [data]);

  const handleMarkRead = async (notificationId: string) => {
    if (!user?.id) {
      return;
    }

    try {
      await markReadMutation.mutateAsync({
        userId: user.id,
        notificationId,
      });
    } catch (markError) {
      Alert.alert('Could not mark notification as read', markError instanceof Error ? markError.message : 'Please try again.');
    }
  };

  const handleOpenNotification = async (notification: AppNotification) => {
    if (!notification.isRead) {
      await handleMarkRead(notification.id);
    }

    const target = resolveNotificationTarget({
      type: notification.type,
      data: notification.data,
      itemId: notification.itemId,
    });
    if (target) {
      router.push({
        pathname: target.pathname,
        params: target.params,
      });
    }
  };

  const handleEnablePush = async () => {
    if (pushRegistration.permissionStatus === 'denied') {
      Alert.alert(
        'Push notifications are disabled',
        'Enable notifications for Ownly from iPhone Settings to receive alerts.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              void Linking.openSettings();
            },
          },
        ]
      );
      return;
    }

    const result = await pushRegistration.requestPermissionAndRegister();
    if (result.error) {
      Alert.alert('Push registration failed', result.error);
    }
  };

  const pushStatusLabel = useMemo(() => {
    if (pushRegistration.permissionStatus === 'granted' && pushRegistration.expoPushToken) {
      return 'Enabled on this device';
    }

    if (pushRegistration.permissionStatus === 'denied') {
      return 'Disabled in iOS Settings';
    }

    if (pushRegistration.permissionStatus === 'granted') {
      return 'Permission granted, token pending';
    }

    return 'Not enabled yet';
  }, [pushRegistration.expoPushToken, pushRegistration.permissionStatus]);

  const pushTokenPreview = useMemo(() => {
    if (!pushRegistration.expoPushToken) {
      return null;
    }

    const token = pushRegistration.expoPushToken;
    if (token.length <= 20) {
      return token;
    }

    return `${token.slice(0, 12)}...${token.slice(-8)}`;
  }, [pushRegistration.expoPushToken]);

  let notificationsContent: React.ReactNode = null;
  if (isLoading) {
    notificationsContent = (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color="#0a84ff" />
        <Text style={styles.helperText}>Loading notifications...</Text>
      </View>
    );
  } else if (isError) {
    notificationsContent = (
      <View style={styles.centerState}>
        <Text style={styles.errorTitle}>Could not load notifications</Text>
        <Text style={styles.helperText}>{error instanceof Error ? error.message : 'Please try again.'}</Text>
        <Pressable style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  } else if (data.length === 0) {
    notificationsContent = (
      <View style={styles.centerState}>
        <Text style={styles.emptyTitle}>No notifications yet</Text>
        <Text style={styles.helperText}>Marketplace and inventory alerts will appear here.</Text>
      </View>
    );
  } else {
    notificationsContent = (
      <>
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Notification Center</Text>
          <Text style={styles.headerSubtitle}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </Text>
        </View>
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const target = resolveNotificationTarget({
              type: item.type,
              data: item.data,
              itemId: item.itemId,
            });

            return (
              <Pressable style={({ pressed }) => [styles.row, !item.isRead && styles.unreadRow, pressed && styles.rowPressed]} onPress={() => handleOpenNotification(item)}>
                <View style={styles.rowBody}>
                  <View style={styles.rowTitleWrap}>
                    {!item.isRead ? <View style={styles.unreadDot} /> : null}
                    <Text style={styles.rowTitle}>{item.title}</Text>
                  </View>
                  <Text style={styles.rowMessage}>{item.body?.trim() || 'Open to see details.'}</Text>
                  <View style={styles.rowFooter}>
                    <Text style={styles.rowDate}>{formatNotificationDate(item.createdAt)}</Text>
                    <Text style={styles.rowType}>{item.type.replaceAll('_', ' ')}</Text>
                  </View>
                </View>

                <View style={styles.trailingActions}>
                  {!item.isRead ? (
                    <Pressable
                      style={({ pressed }) => [styles.markReadButton, pressed && styles.markReadButtonPressed]}
                      onPress={(event) => {
                        event.stopPropagation();
                        void handleMarkRead(item.id);
                      }}
                      disabled={markReadMutation.isPending}
                    >
                      <Text style={styles.markReadLabel}>Mark read</Text>
                    </Pressable>
                  ) : null}
                  {target ? <Text style={styles.chevron}>›</Text> : null}
                </View>
              </Pressable>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </>
    );
  }

  return (
    <Screen style={styles.container}>
      <View style={styles.pushCard}>
        <Text style={styles.pushCardTitle}>Push Notifications</Text>
        <Text style={styles.pushCardSubtitle}>{pushStatusLabel}</Text>
        {pushTokenPreview ? <Text style={styles.pushToken}>Token: {pushTokenPreview}</Text> : null}
        {pushRegistration.error ? <Text style={styles.pushError}>{pushRegistration.error}</Text> : null}
        <Pressable
          style={({ pressed }) => [styles.pushButton, pressed && styles.pushButtonPressed]}
          onPress={() => {
            void handleEnablePush();
          }}
          disabled={pushRegistration.isRegistering}
        >
          {pushRegistration.isRegistering ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.pushButtonText}>
              {pushRegistration.permissionStatus === 'granted' ? 'Refresh Device Token' : 'Enable Push Notifications'}
            </Text>
          )}
        </Pressable>
      </View>
      {notificationsContent}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dce7ff',
    backgroundColor: '#f3f8ff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  pushCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dce7ff',
    backgroundColor: '#f3f8ff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    gap: 6,
  },
  pushCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  pushCardSubtitle: {
    fontSize: 13,
    color: '#3a3a3c',
  },
  pushToken: {
    fontSize: 12,
    color: '#6e6e73',
  },
  pushError: {
    fontSize: 12,
    color: '#c62828',
  },
  pushButton: {
    marginTop: 2,
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#0a84ff',
    minWidth: 176,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pushButtonPressed: {
    opacity: 0.85,
  },
  pushButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#3a3a3c',
  },
  listContent: {
    paddingBottom: 28,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  unreadRow: {
    borderColor: '#c8dcff',
    backgroundColor: '#f8fbff',
  },
  rowPressed: {
    backgroundColor: '#f2f2f7',
  },
  rowBody: {
    flex: 1,
  },
  rowTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0a84ff',
    marginRight: 8,
  },
  rowTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  rowMessage: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#3a3a3c',
  },
  rowFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  rowDate: {
    fontSize: 12,
    color: '#8e8e93',
  },
  rowType: {
    fontSize: 12,
    color: '#8e8e93',
    textTransform: 'capitalize',
  },
  trailingActions: {
    marginLeft: 10,
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
  },
  markReadButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d1d6',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  markReadButtonPressed: {
    backgroundColor: '#f2f2f7',
  },
  markReadLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  chevron: {
    fontSize: 20,
    color: '#c7c7cc',
  },
  separator: {
    height: 8,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  helperText: {
    textAlign: 'center',
    color: '#6e6e73',
    fontSize: 14,
    lineHeight: 20,
  },
  errorTitle: {
    color: '#c62828',
    fontSize: 18,
    fontWeight: '700',
  },
  retryButton: {
    marginTop: 4,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0a84ff',
  },
  retryButtonPressed: {
    opacity: 0.85,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyTitle: {
    color: '#1c1c1e',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
});
