import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../../components';
import { useAuth } from '../../../contexts';
import { type AppNotification, useMarkNotificationReadMutation, useNotifications } from '../../../hooks';

type NotificationTarget = {
  pathname:
    | '/(tabs)/marketplace/[id]'
    | '/(tabs)/marketplace/messages/[listingId]'
    | '/(tabs)/inventory/[id]';
  params: Record<string, string>;
};

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

function getNotificationTarget(notification: AppNotification): NotificationTarget | null {
  const listingId = notification.data?.listing_id;
  const transactionId = notification.data?.transaction_id;
  const itemId = notification.itemId;

  if (notification.type === 'new_message' && listingId) {
    return {
      pathname: '/(tabs)/marketplace/messages/[listingId]',
      params: { listingId },
    };
  }

  if (listingId && transactionId) {
    return {
      pathname: '/(tabs)/marketplace/messages/[listingId]',
      params: { listingId },
    };
  }

  if (listingId) {
    return {
      pathname: '/(tabs)/marketplace/[id]',
      params: { id: listingId },
    };
  }

  if (itemId) {
    return {
      pathname: '/(tabs)/inventory/[id]',
      params: { id: itemId },
    };
  }

  return null;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
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

    const target = getNotificationTarget(notification);
    if (target) {
      router.push({
        pathname: target.pathname,
        params: target.params,
      });
    }
  };

  if (isLoading) {
    return (
      <Screen style={styles.centerState}>
        <ActivityIndicator size="large" color="#0a84ff" />
        <Text style={styles.helperText}>Loading notifications...</Text>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen style={styles.centerState}>
        <Text style={styles.errorTitle}>Could not load notifications</Text>
        <Text style={styles.helperText}>{error instanceof Error ? error.message : 'Please try again.'}</Text>
        <Pressable style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </Screen>
    );
  }

  if (data.length === 0) {
    return (
      <Screen style={styles.centerState}>
        <Text style={styles.emptyTitle}>No notifications yet</Text>
        <Text style={styles.helperText}>Marketplace and inventory alerts will appear here.</Text>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
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
          const target = getNotificationTarget(item);

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
