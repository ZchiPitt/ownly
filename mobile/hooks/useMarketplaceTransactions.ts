import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';
import type { ListingStatus, NotificationType, TransactionStatus } from '../../src/types/database';

type ProfileRow = {
  id: string;
  user_id: string;
  display_name: string | null;
};

type ListingTransactionContextRow = {
  id: string;
  seller_id: string;
  status: ListingStatus;
  price: number | null;
  item: { name: string | null } | null;
};

type TransactionRow = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  status: TransactionStatus;
  agreed_price: number | null;
  message: string | null;
  created_at: string;
  updated_at: string;
};

type MarketplaceNotificationType =
  | 'purchase_request'
  | 'request_accepted'
  | 'request_declined'
  | 'transaction_complete';

export type MarketplaceTransactionRole = 'buyer' | 'seller' | 'viewer';

export type MarketplaceTransactionContext = {
  listingId: string;
  listingStatus: ListingStatus;
  sellerProfileId: string;
  listingPrice: number | null;
  itemName: string;
  viewerProfileId: string;
  role: MarketplaceTransactionRole;
  canCreatePurchaseRequest: boolean;
  transaction: {
    id: string;
    status: TransactionStatus;
    buyerId: string;
    sellerId: string;
    agreedPrice: number | null;
    message: string | null;
    createdAt: string;
    updatedAt: string;
    availableTransitions: TransactionStatus[];
  } | null;
};

type CreatePurchaseRequestInput = {
  listingId: string;
  sellerProfileId: string;
  agreedPrice: number | null;
  message?: string;
  itemName?: string;
};

type UpdateTransactionStatusInput = {
  listingId: string;
  transactionId: string;
  nextStatus: TransactionStatus;
};

function getRoleForTransaction(transaction: TransactionRow, profileId: string): MarketplaceTransactionRole {
  if (transaction.buyer_id === profileId) {
    return 'buyer';
  }

  if (transaction.seller_id === profileId) {
    return 'seller';
  }

  return 'viewer';
}

function getAllowedTransitions(currentStatus: TransactionStatus, role: MarketplaceTransactionRole): TransactionStatus[] {
  if (currentStatus === 'pending' && role === 'seller') {
    return ['accepted', 'cancelled'];
  }

  if (currentStatus === 'pending' && role === 'buyer') {
    return ['cancelled'];
  }

  if (currentStatus === 'accepted' && role === 'seller') {
    return ['completed', 'cancelled'];
  }

  return [];
}

async function fetchProfileByUserId(userId: string): Promise<ProfileRow> {
  const { data, error } = await (supabase.from('profiles') as ReturnType<typeof supabase.from>)
    .select('id, user_id, display_name')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const profile = data as ProfileRow | null;
  if (!profile?.id) {
    throw new Error('Could not find your profile.');
  }

  return profile;
}

async function fetchUserIdByProfileId(profileId: string): Promise<string | null> {
  const { data, error } = await (supabase.from('profiles') as ReturnType<typeof supabase.from>)
    .select('user_id')
    .eq('id', profileId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const profile = data as { user_id: string } | null;
  return profile?.user_id ?? null;
}

function getNotificationContent(
  type: MarketplaceNotificationType,
  senderName: string,
  itemName: string
): { title: string; body: string } {
  switch (type) {
    case 'purchase_request':
      return {
        title: `${senderName} wants to buy ${itemName}`,
        body: 'Tap to view the purchase request',
      };
    case 'request_accepted':
      return {
        title: `${senderName} accepted your request`,
        body: `Your request for ${itemName} was accepted`,
      };
    case 'request_declined':
      return {
        title: `${senderName} declined your request`,
        body: 'Your purchase request was declined',
      };
    case 'transaction_complete':
      return {
        title: 'Transaction complete!',
        body: 'Leave a review for this transaction',
      };
    default:
      return {
        title: 'Marketplace update',
        body: 'Your transaction status changed',
      };
  }
}

async function createMarketplaceNotification(
  recipientUserId: string,
  type: MarketplaceNotificationType,
  data: {
    listing_id: string;
    transaction_id: string;
    sender_id: string;
    sender_name: string;
    item_name: string;
  }
): Promise<void> {
  const { title, body } = getNotificationContent(type, data.sender_name, data.item_name);
  const dbType = type as NotificationType;

  const { error } = await (supabase.from('notifications') as ReturnType<typeof supabase.from>).insert({
    user_id: recipientUserId,
    type: dbType,
    title,
    body,
    item_id: null,
    data,
  } as Record<string, unknown>);

  if (error) {
    throw error;
  }
}

async function fetchMarketplaceTransactionContext(
  userId: string,
  listingId: string,
  counterpartProfileId?: string
): Promise<MarketplaceTransactionContext | null> {
  const viewerProfile = await fetchProfileByUserId(userId);

  const { data: listingData, error: listingError } = await (supabase.from('listings') as ReturnType<typeof supabase.from>)
    .select('id, seller_id, status, price, item:items(name)')
    .eq('id', listingId)
    .maybeSingle();

  if (listingError) {
    throw listingError;
  }

  const listing = listingData as ListingTransactionContextRow | null;
  if (!listing || listing.status === 'removed') {
    return null;
  }

  let transactionQuery = (supabase.from('transactions') as ReturnType<typeof supabase.from>)
    .select('id, listing_id, buyer_id, seller_id, status, agreed_price, message, created_at, updated_at')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (counterpartProfileId) {
    transactionQuery = transactionQuery.or(
      `and(buyer_id.eq.${viewerProfile.id},seller_id.eq.${counterpartProfileId}),and(buyer_id.eq.${counterpartProfileId},seller_id.eq.${viewerProfile.id})`
    );
  } else {
    transactionQuery = transactionQuery.or(`buyer_id.eq.${viewerProfile.id},seller_id.eq.${viewerProfile.id}`);
  }

  const { data: transactionRows, error: transactionError } = await transactionQuery;
  if (transactionError) {
    throw transactionError;
  }

  const transaction = ((transactionRows ?? []) as TransactionRow[])[0] ?? null;
  const role = transaction ? getRoleForTransaction(transaction, viewerProfile.id) : viewerProfile.id === listing.seller_id ? 'seller' : 'buyer';
  const canCreatePurchaseRequest = !transaction && role === 'buyer' && listing.status === 'active';

  return {
    listingId,
    listingStatus: listing.status,
    sellerProfileId: listing.seller_id,
    listingPrice: listing.price,
    itemName: listing.item?.name?.trim() || 'an item',
    viewerProfileId: viewerProfile.id,
    role,
    canCreatePurchaseRequest,
    transaction: transaction
      ? {
          id: transaction.id,
          status: transaction.status,
          buyerId: transaction.buyer_id,
          sellerId: transaction.seller_id,
          agreedPrice: transaction.agreed_price,
          message: transaction.message,
          createdAt: transaction.created_at,
          updatedAt: transaction.updated_at,
          availableTransitions: getAllowedTransitions(transaction.status, role),
        }
      : null,
  };
}

export function useMarketplaceTransactionContext(
  userId: string | undefined,
  listingId: string | undefined,
  counterpartProfileId?: string
) {
  return useQuery({
    queryKey: ['marketplace-transaction-context', userId, listingId, counterpartProfileId ?? 'none'],
    enabled: Boolean(userId && listingId),
    queryFn: () => fetchMarketplaceTransactionContext(userId as string, listingId as string, counterpartProfileId),
  });
}

export function useCreateMarketplacePurchaseRequestMutation(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePurchaseRequestInput) => {
      if (!userId) {
        throw new Error('You must be signed in to send a purchase request.');
      }

      const buyerProfile = await fetchProfileByUserId(userId);
      if (buyerProfile.id === input.sellerProfileId) {
        throw new Error('You cannot create a purchase request on your own listing.');
      }

      const { data: createdRow, error: createError } = await (supabase.from('transactions') as ReturnType<typeof supabase.from>)
        .insert({
          listing_id: input.listingId,
          buyer_id: buyerProfile.id,
          seller_id: input.sellerProfileId,
          status: 'pending' as TransactionStatus,
          agreed_price: input.agreedPrice,
          message: input.message?.trim() || null,
        } as Record<string, unknown>)
        .select('id')
        .single();

      if (createError) {
        throw createError;
      }

      const transactionId = (createdRow as { id: string } | null)?.id;
      if (!transactionId) {
        throw new Error('Could not create purchase request.');
      }

      const recipientUserId = await fetchUserIdByProfileId(input.sellerProfileId);
      if (recipientUserId) {
        await createMarketplaceNotification(recipientUserId, 'purchase_request', {
          listing_id: input.listingId,
          transaction_id: transactionId,
          sender_id: buyerProfile.id,
          sender_name: buyerProfile.display_name?.trim() || 'Buyer',
          item_name: input.itemName?.trim() || 'an item',
        });
      }
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['marketplace-transaction-context'] });
      void queryClient.invalidateQueries({ queryKey: ['marketplace-listing-detail', variables.listingId] });
      void queryClient.invalidateQueries({ queryKey: ['marketplace-chat-messages'] });
      void queryClient.invalidateQueries({ queryKey: ['marketplace-conversations'] });
    },
  });
}

export function useUpdateMarketplaceTransactionStatusMutation(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateTransactionStatusInput) => {
      if (!userId) {
        throw new Error('You must be signed in to update transaction status.');
      }

      const actorProfile = await fetchProfileByUserId(userId);
      const { data, error: transactionError } = await (supabase.from('transactions') as ReturnType<typeof supabase.from>)
        .select('id, listing_id, buyer_id, seller_id, status, agreed_price, message, created_at, updated_at')
        .eq('id', input.transactionId)
        .eq('listing_id', input.listingId)
        .maybeSingle();

      if (transactionError) {
        throw transactionError;
      }

      const transaction = data as TransactionRow | null;
      if (!transaction) {
        throw new Error('Transaction not found.');
      }

      const role = getRoleForTransaction(transaction, actorProfile.id);
      const allowedTransitions = getAllowedTransitions(transaction.status, role);

      if (!allowedTransitions.includes(input.nextStatus)) {
        throw new Error('You do not have permission for this transaction update.');
      }

      const { error: updateTransactionError } = await (supabase.from('transactions') as ReturnType<typeof supabase.from>)
        .update({ status: input.nextStatus } as Record<string, unknown>)
        .eq('id', input.transactionId);

      if (updateTransactionError) {
        throw updateTransactionError;
      }

      if (input.nextStatus === 'accepted') {
        const { error: listingError } = await (supabase.from('listings') as ReturnType<typeof supabase.from>)
          .update({ status: 'reserved' as ListingStatus } as Record<string, unknown>)
          .eq('id', input.listingId)
          .eq('seller_id', actorProfile.id);

        if (listingError) {
          throw listingError;
        }
      } else if (input.nextStatus === 'completed') {
        const { error: listingError } = await (supabase.from('listings') as ReturnType<typeof supabase.from>)
          .update({ status: 'sold' as ListingStatus } as Record<string, unknown>)
          .eq('id', input.listingId)
          .eq('seller_id', actorProfile.id);

        if (listingError) {
          throw listingError;
        }
      } else if (input.nextStatus === 'cancelled' && transaction.status === 'accepted' && role === 'seller') {
        const { error: listingError } = await (supabase.from('listings') as ReturnType<typeof supabase.from>)
          .update({ status: 'active' as ListingStatus } as Record<string, unknown>)
          .eq('id', input.listingId)
          .eq('seller_id', actorProfile.id);

        if (listingError) {
          throw listingError;
        }
      }

      let notificationType: MarketplaceNotificationType | null = null;
      let recipientProfileId: string | null = null;

      if (input.nextStatus === 'accepted') {
        notificationType = 'request_accepted';
        recipientProfileId = transaction.buyer_id;
      } else if (input.nextStatus === 'cancelled') {
        notificationType = 'request_declined';
        recipientProfileId = role === 'seller' ? transaction.buyer_id : transaction.seller_id;
      } else if (input.nextStatus === 'completed') {
        notificationType = 'transaction_complete';
        recipientProfileId = transaction.buyer_id;
      }

      if (notificationType && recipientProfileId) {
        const recipientUserId = await fetchUserIdByProfileId(recipientProfileId);

        if (recipientUserId) {
          const { data: listingData } = await (supabase.from('listings') as ReturnType<typeof supabase.from>)
            .select('item:items(name)')
            .eq('id', input.listingId)
            .maybeSingle();

          const listing = listingData as { item: { name: string | null } | null } | null;
          await createMarketplaceNotification(recipientUserId, notificationType, {
            listing_id: input.listingId,
            transaction_id: input.transactionId,
            sender_id: actorProfile.id,
            sender_name: actorProfile.display_name?.trim() || 'Marketplace user',
            item_name: listing?.item?.name?.trim() || 'an item',
          });
        }
      }
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['marketplace-transaction-context'] });
      void queryClient.invalidateQueries({ queryKey: ['marketplace-listing-detail', variables.listingId] });
      void queryClient.invalidateQueries({ queryKey: ['marketplace-feed'] });
      void queryClient.invalidateQueries({ queryKey: ['my-marketplace-listings'] });
      void queryClient.invalidateQueries({ queryKey: ['marketplace-chat-messages'] });
      void queryClient.invalidateQueries({ queryKey: ['marketplace-conversations'] });
    },
  });
}

export function getTransactionStatusLabel(status: TransactionStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'accepted':
      return 'Accepted';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}
