import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { createMarketplaceNotification } from '../lib/marketplaceNotifications';
import type { NotificationType } from '../../src/types/database';
import { supabase } from '../lib/supabase';

export type MarketplaceConversation = {
  id: string;
  listing: {
    id: string;
    itemName: string;
    photoUrl: string;
  };
  otherUser: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    isMine: boolean;
  };
  unreadCount: number;
};

export type MarketplaceChatMessage = {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  readAt: string | null;
  isMine: boolean;
};

type ProfileIdRow = { id: string };
type UserIdRow = { user_id: string };
type DisplayNameRow = { display_name: string | null };
type ListingItemNameRow = {
  item: {
    name: string | null;
  } | null;
};

type MessageConversationRow = {
  id: string;
  listing_id: string | null;
  content: string;
  created_at: string;
  read_at: string | null;
  sender_id: string;
  receiver_id: string;
  listing: {
    id: string;
    item: {
      name: string | null;
      photo_url: string | null;
      thumbnail_url: string | null;
    } | null;
  } | null;
  sender: { id: string; display_name: string | null; avatar_url: string | null } | null;
  receiver: { id: string; display_name: string | null; avatar_url: string | null } | null;
};

type MessageRow = {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  read_at: string | null;
};

async function fetchProfileIdByUserId(userId: string): Promise<string> {
  const { data, error } = await (supabase.from('profiles') as ReturnType<typeof supabase.from>)
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const profile = data as ProfileIdRow | null;
  if (!profile?.id) {
    throw new Error('Could not find your profile.');
  }

  return profile.id;
}

async function fetchUserIdByProfileId(profileId: string): Promise<string | null> {
  const { data, error } = await (supabase.from('profiles') as ReturnType<typeof supabase.from>)
    .select('user_id')
    .eq('id', profileId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as UserIdRow | null)?.user_id ?? null;
}

async function fetchProfileDisplayName(profileId: string): Promise<string | null> {
  const { data, error } = await (supabase.from('profiles') as ReturnType<typeof supabase.from>)
    .select('display_name')
    .eq('id', profileId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as DisplayNameRow | null)?.display_name ?? null;
}

async function fetchListingItemName(listingId: string): Promise<string | null> {
  const { data, error } = await (supabase.from('listings') as ReturnType<typeof supabase.from>)
    .select('item:items(name)')
    .eq('id', listingId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as ListingItemNameRow | null)?.item?.name ?? null;
}

async function countConversationMessages(listingId: string, senderId: string, receiverId: string): Promise<number> {
  const { count, error } = await (supabase.from('messages') as ReturnType<typeof supabase.from>)
    .select('id', { count: 'exact', head: true })
    .eq('listing_id', listingId)
    .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function fetchMarketplaceConversations(userId: string): Promise<MarketplaceConversation[]> {
  const profileId = await fetchProfileIdByUserId(userId);

  const { data, error } = await (supabase.from('messages') as ReturnType<typeof supabase.from>)
    .select(`
      id,
      listing_id,
      content,
      created_at,
      read_at,
      sender_id,
      receiver_id,
      listing:listings!inner(
        id,
        item:items!inner(name, photo_url, thumbnail_url)
      ),
      sender:profiles!sender_id(id, display_name, avatar_url),
      receiver:profiles!receiver_id(id, display_name, avatar_url)
    `)
    .or(`sender_id.eq.${profileId},receiver_id.eq.${profileId}`)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as MessageConversationRow[];
  const byListingId = new Map<string, MarketplaceConversation>();

  rows.forEach((row) => {
    if (!row.listing_id || !row.listing?.item) {
      return;
    }

    const otherUser = row.sender_id === profileId ? row.receiver : row.sender;
    if (!otherUser) {
      return;
    }

    const current = byListingId.get(row.listing_id);
    const isUnread = row.receiver_id === profileId && !row.read_at;

    if (!current) {
      byListingId.set(row.listing_id, {
        id: row.listing_id,
        listing: {
          id: row.listing.id,
          itemName: row.listing.item.name?.trim() || 'Listing',
          photoUrl: row.listing.item.photo_url || row.listing.item.thumbnail_url || '',
        },
        otherUser: {
          id: otherUser.id,
          displayName: otherUser.display_name?.trim() || 'User',
          avatarUrl: otherUser.avatar_url,
        },
        lastMessage: {
          content: row.content,
          createdAt: row.created_at,
          isMine: row.sender_id === profileId,
        },
        unreadCount: isUnread ? 1 : 0,
      });
      return;
    }

    if (isUnread) {
      current.unreadCount += 1;
    }
  });

  return Array.from(byListingId.values()).sort(
    (a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
  );
}

async function fetchMarketplaceChatMessages(userId: string, listingId: string): Promise<MarketplaceChatMessage[]> {
  const profileId = await fetchProfileIdByUserId(userId);

  const { data, error } = await (supabase.from('messages') as ReturnType<typeof supabase.from>)
    .select('id, content, sender_id, receiver_id, created_at, read_at')
    .eq('listing_id', listingId)
    .or(`sender_id.eq.${profileId},receiver_id.eq.${profileId}`)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as MessageRow[];
  return rows.map((row) => ({
    id: row.id,
    content: row.content,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    createdAt: row.created_at,
    readAt: row.read_at,
    isMine: row.sender_id === profileId,
  }));
}

export function useMarketplaceConversations(userId: string | undefined) {
  return useQuery({
    queryKey: ['marketplace-conversations', userId],
    enabled: Boolean(userId),
    queryFn: () => fetchMarketplaceConversations(userId as string),
  });
}

export function useMarketplaceChatMessages(userId: string | undefined, listingId: string | undefined) {
  return useQuery({
    queryKey: ['marketplace-chat-messages', userId, listingId],
    enabled: Boolean(userId && listingId),
    queryFn: () => fetchMarketplaceChatMessages(userId as string, listingId as string),
  });
}

export function useSendMarketplaceMessageMutation(userId: string | undefined, listingId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: string; content: string }) => {
      if (!userId || !listingId) {
        throw new Error('You must be signed in to send messages.');
      }

      const trimmed = content.trim();
      if (!trimmed) {
        throw new Error('Message cannot be empty.');
      }

      const senderProfileId = await fetchProfileIdByUserId(userId);
      const { error } = await (supabase.from('messages') as ReturnType<typeof supabase.from>).insert({
        listing_id: listingId,
        sender_id: senderProfileId,
        receiver_id: receiverId,
        content: trimmed,
      } as Record<string, unknown>);

      if (error) {
        throw error;
      }
      const recipientUserId = await fetchUserIdByProfileId(receiverId);
      if (recipientUserId) {
        try {
          const senderDisplayName = await fetchProfileDisplayName(senderProfileId);
          const itemName = await fetchListingItemName(listingId);
          const priorMessageCount = await countConversationMessages(listingId, senderProfileId, receiverId);
          const notificationType: NotificationType = priorMessageCount <= 1 ? 'new_inquiry' : 'new_message';

          await createMarketplaceNotification(recipientUserId, notificationType, {
            listing_id: listingId,
            sender_id: senderProfileId,
            sender_name: senderDisplayName?.trim() || 'Someone',
            item_name: itemName?.trim() || undefined,
            message_preview: trimmed,
          });
        } catch {
          // Ignore notification send failures to avoid blocking chat delivery.
        }
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['marketplace-chat-messages', userId, listingId] });
      void queryClient.invalidateQueries({ queryKey: ['marketplace-conversations', userId] });
    },
  });
}

export function useMarkMarketplaceMessagesReadMutation(userId: string | undefined, listingId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!userId || !listingId) {
        return;
      }

      const profileId = await fetchProfileIdByUserId(userId);
      const { error } = await (supabase.from('messages') as ReturnType<typeof supabase.from>)
        .update({ read_at: new Date().toISOString() } as Record<string, unknown>)
        .eq('listing_id', listingId)
        .eq('receiver_id', profileId)
        .is('read_at', null);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['marketplace-chat-messages', userId, listingId] });
      void queryClient.invalidateQueries({ queryKey: ['marketplace-conversations', userId] });
    },
  });
}

export function useMarketplaceMessageSubscription(userId: string | undefined, listingId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId || !listingId) {
      return;
    }

    let isMounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const subscribe = async () => {
      try {
        const profileId = await fetchProfileIdByUserId(userId);
        if (!isMounted) {
          return;
        }

        channel = supabase
          .channel(`marketplace-messages:${listingId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `listing_id=eq.${listingId}`,
            },
            (payload) => {
              const nextMessage = payload.new as { sender_id?: string; receiver_id?: string };
              const visibleToCurrentUser =
                nextMessage.sender_id === profileId || nextMessage.receiver_id === profileId;

              if (!visibleToCurrentUser) {
                return;
              }

              void queryClient.invalidateQueries({ queryKey: ['marketplace-chat-messages', userId, listingId] });
              void queryClient.invalidateQueries({ queryKey: ['marketplace-conversations', userId] });
            }
          )
          .subscribe();
      } catch {
        // Swallow subscription errors to keep chat usable via manual refresh/query invalidation.
      }
    };

    void subscribe();

    return () => {
      isMounted = false;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [listingId, queryClient, userId]);
}
