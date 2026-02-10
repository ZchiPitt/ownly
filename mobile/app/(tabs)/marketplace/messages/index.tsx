import { Link, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../../../components';
import { useAuth } from '../../../../contexts/AuthProvider';
import { useMarketplaceConversations } from '../../../../hooks';

function formatTimestamp(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return 'Now';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function MarketplaceMessagesScreen() {
  const { user } = useAuth();
  const { data = [], isLoading, isError, error, refetch } = useMarketplaceConversations(user?.id);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch])
  );

  if (isLoading) {
    return (
      <Screen style={styles.centerState}>
        <ActivityIndicator size="large" color="#0a84ff" />
        <Text style={styles.helperText}>Loading conversations...</Text>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen style={styles.centerState}>
        <Text style={styles.errorTitle}>Could not load messages</Text>
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
        <Text style={styles.emptyTitle}>No messages yet</Text>
        <Text style={styles.helperText}>Start by messaging a seller from a listing detail page.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.listContainer}>
        {data.map((conversation) => (
          <Link
            key={conversation.id}
            href={{
              pathname: '/(tabs)/marketplace/messages/[listingId]',
              params: { listingId: conversation.id },
            }}
            asChild
          >
            <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
              <Image
                source={{ uri: conversation.listing.photoUrl }}
                style={styles.listingImage}
                resizeMode="cover"
              />

              <View style={styles.content}>
                <View style={styles.headerRow}>
                  <Text style={styles.title}>{conversation.otherUser.displayName}</Text>
                  <Text style={styles.timestamp}>{formatTimestamp(conversation.lastMessage.createdAt)}</Text>
                </View>

                <Text style={styles.subtitle} numberOfLines={1}>
                  {conversation.listing.itemName}
                </Text>

                <View style={styles.previewRow}>
                  <Text style={styles.previewText} numberOfLines={1}>
                    {conversation.lastMessage.isMine ? 'You: ' : ''}
                    {conversation.lastMessage.content}
                  </Text>

                  {conversation.unreadCount > 0 ? (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{conversation.unreadCount}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </Pressable>
          </Link>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: '#1c1c1e',
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1c1e',
    textAlign: 'center',
  },
  helperText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6e6e73',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 14,
    borderRadius: 10,
    backgroundColor: '#0a84ff',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonPressed: {
    backgroundColor: '#007aff',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    backgroundColor: '#ffffff',
    padding: 10,
  },
  rowPressed: {
    backgroundColor: '#f2f2f7',
  },
  listingImage: {
    width: 62,
    height: 62,
    borderRadius: 10,
    backgroundColor: '#d1d1d6',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  timestamp: {
    fontSize: 12,
    color: '#8e8e93',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#8e8e93',
    textTransform: 'uppercase',
  },
  previewRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewText: {
    flex: 1,
    fontSize: 14,
    color: '#3a3a3c',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0a84ff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
