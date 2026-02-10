import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Screen } from '../../../../components';
import { useAuth } from '../../../../contexts/AuthProvider';
import {
  useMarkMarketplaceMessagesReadMutation,
  useMarketplaceChatMessages,
  useMarketplaceConversations,
  useMarketplaceListingDetail,
  useMarketplaceMessageSubscription,
  useSendMarketplaceMessageMutation,
} from '../../../../hooks';

function formatMessageTime(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function MarketplaceChatScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { listingId } = useLocalSearchParams<{ listingId?: string | string[] }>();
  const normalizedListingId = Array.isArray(listingId) ? listingId[0] : listingId;

  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);

  const {
    data: messages = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useMarketplaceChatMessages(user?.id, normalizedListingId);
  const { data: conversations = [] } = useMarketplaceConversations(user?.id);
  const { data: listingDetail } = useMarketplaceListingDetail(normalizedListingId);

  const sendMessageMutation = useSendMarketplaceMessageMutation(user?.id, normalizedListingId);
  const markReadMutation = useMarkMarketplaceMessagesReadMutation(user?.id, normalizedListingId);

  useMarketplaceMessageSubscription(user?.id, normalizedListingId);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === normalizedListingId) ?? null,
    [conversations, normalizedListingId]
  );

  const headerTitle = activeConversation?.otherUser.displayName?.trim() || listingDetail?.seller.displayName?.trim() || 'Chat';
  const headerSubtitle = activeConversation?.listing.itemName || listingDetail?.item.name?.trim() || 'Listing';

  useEffect(() => {
    navigation.setOptions({
      title: headerTitle,
      headerLargeTitle: false,
      headerBackTitle: 'Messages',
    });
  }, [headerTitle, navigation]);

  useEffect(() => {
    if (!normalizedListingId) {
      return;
    }

    markReadMutation.mutate();
  }, [markReadMutation, normalizedListingId, messages.length]);

  const receiverId = useMemo(() => {
    if (activeConversation?.otherUser.id) {
      return activeConversation.otherUser.id;
    }

    if (!listingDetail || !user) {
      return null;
    }

    return listingDetail.sellerUserId !== user.id ? listingDetail.sellerId : null;
  }, [activeConversation?.otherUser.id, listingDetail, user]);

  const handleSend = async () => {
    if (!receiverId || !draft.trim()) {
      return;
    }

    setSendError(null);

    try {
      await sendMessageMutation.mutateAsync({
        receiverId,
        content: draft,
      });
      setDraft('');
    } catch (sendMutationError) {
      setSendError(sendMutationError instanceof Error ? sendMutationError.message : 'Could not send message.');
    }
  };

  if (!normalizedListingId) {
    return (
      <Screen style={styles.centerState}>
        <Text style={styles.errorTitle}>Missing conversation</Text>
      </Screen>
    );
  }

  if (isLoading) {
    return (
      <Screen style={styles.centerState}>
        <ActivityIndicator size="large" color="#0a84ff" />
        <Text style={styles.helperText}>Loading messages...</Text>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen style={styles.centerState}>
        <Text style={styles.errorTitle}>Could not load chat</Text>
        <Text style={styles.helperText}>{error instanceof Error ? error.message : 'Please try again.'}</Text>
        <Pressable style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <View style={styles.chatHeaderCard}>
        <Image
          source={{ uri: listingDetail?.item.thumbnailUrl ?? listingDetail?.item.photoUrl ?? undefined }}
          style={styles.headerImage}
        />
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerItemName}>{headerSubtitle}</Text>
          <Text style={styles.headerSellerName}>{headerTitle}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          data={messages}
          keyExtractor={(message) => message.id}
          contentContainerStyle={styles.messageList}
          renderItem={({ item }) => (
            <View style={[styles.messageRow, item.isMine ? styles.myMessageRow : styles.otherMessageRow]}>
              <View style={[styles.messageBubble, item.isMine ? styles.myBubble : styles.otherBubble]}>
                <Text style={[styles.messageText, item.isMine ? styles.myMessageText : styles.otherMessageText]}>{item.content}</Text>
              </View>
              <Text style={[styles.messageTime, item.isMine ? styles.myMessageTime : styles.otherMessageTime]}>
                {formatMessageTime(item.createdAt)}
              </Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyMessageText}>No messages yet</Text>}
        />

        <View style={styles.composerWrap}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Type a message"
            multiline
            style={styles.composerInput}
            maxLength={1000}
          />
          <Pressable
            style={({ pressed }) => [
              styles.sendButton,
              (!draft.trim() || !receiverId || sendMessageMutation.isPending) && styles.sendButtonDisabled,
              pressed && draft.trim() && receiverId ? styles.sendButtonPressed : null,
            ]}
            onPress={handleSend}
            disabled={!draft.trim() || !receiverId || sendMessageMutation.isPending}
          >
            <Text style={styles.sendButtonText}>{sendMessageMutation.isPending ? 'Sending...' : 'Send'}</Text>
          </Pressable>
        </View>

        {sendError ? <Text style={styles.composerError}>{sendError}</Text> : null}
        {!receiverId ? <Text style={styles.helperText}>Messaging becomes available when a conversation partner exists.</Text> : null}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },
  flex: {
    flex: 1,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1c1e',
    textAlign: 'center',
  },
  helperText: {
    marginTop: 8,
    fontSize: 13,
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
  chatHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    padding: 10,
    marginBottom: 8,
  },
  headerImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#d1d1d6',
  },
  headerTextWrap: {
    marginLeft: 10,
    flex: 1,
  },
  headerItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  headerSellerName: {
    marginTop: 2,
    fontSize: 12,
    color: '#6e6e73',
  },
  messageList: {
    flexGrow: 1,
    paddingHorizontal: 4,
    paddingVertical: 10,
    gap: 8,
  },
  messageRow: {
    maxWidth: '82%',
  },
  myMessageRow: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherMessageRow: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  myBubble: {
    backgroundColor: '#0a84ff',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#f2f2f7',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#ffffff',
  },
  otherMessageText: {
    color: '#1c1c1e',
  },
  messageTime: {
    marginTop: 3,
    fontSize: 11,
  },
  myMessageTime: {
    color: '#8e8e93',
  },
  otherMessageTime: {
    color: '#8e8e93',
  },
  emptyMessageText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#8e8e93',
    marginTop: 18,
  },
  composerWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e5ea',
    paddingTop: 8,
    paddingBottom: 4,
  },
  composerInput: {
    flex: 1,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#d1d1d6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    backgroundColor: '#ffffff',
  },
  sendButton: {
    borderRadius: 12,
    backgroundColor: '#0a84ff',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sendButtonPressed: {
    backgroundColor: '#007aff',
  },
  sendButtonDisabled: {
    backgroundColor: '#c7c7cc',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  composerError: {
    marginTop: 4,
    fontSize: 12,
    color: '#d70015',
    textAlign: 'center',
  },
});
