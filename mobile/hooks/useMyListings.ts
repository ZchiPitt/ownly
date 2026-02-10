import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';
import type { ItemCondition, ListingStatus, PriceType } from '../../src/types/database';

type ListingRow = {
  id: string;
  item_id: string;
  seller_id: string;
  status: ListingStatus;
  price: number | null;
  price_type: PriceType;
  condition: ItemCondition;
  description: string | null;
  created_at: string;
  updated_at: string;
};

type ListingItemRow = {
  id: string;
  name: string | null;
  photo_url: string;
  thumbnail_url: string | null;
};

type InventoryCandidateItemRow = {
  id: string;
  name: string | null;
  photo_url: string;
  thumbnail_url: string | null;
  created_at: string;
};

export type MyListingStatusFilter = 'all' | 'active' | 'sold' | 'reserved' | 'removed';

export type MyMarketplaceListing = {
  id: string;
  itemId: string;
  sellerId: string;
  status: ListingStatus;
  price: number | null;
  priceType: PriceType;
  condition: ItemCondition;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  item: {
    id: string;
    name: string | null;
    photoUrl: string;
    thumbnailUrl: string | null;
  };
};

export type CreateListingInput = {
  itemId: string;
  price: number | null;
  priceType: PriceType;
  condition: ItemCondition;
  description: string;
};

export type UpdateListingInput = {
  listingId: string;
  updates: {
    status?: ListingStatus;
    price?: number | null;
    priceType?: PriceType;
    condition?: ItemCondition;
    description?: string;
  };
};

async function fetchSellerProfileId(userId: string): Promise<string> {
  const { data, error } = await supabase.from('profiles').select('id').eq('user_id', userId).maybeSingle();

  if (error) {
    throw error;
  }

  const profile = data as { id: string } | null;
  if (!profile?.id) {
    throw new Error('Could not find seller profile for current user.');
  }

  return profile.id;
}

async function fetchMyListings(userId: string, statusFilter: MyListingStatusFilter): Promise<MyMarketplaceListing[]> {
  const sellerId = await fetchSellerProfileId(userId);

  let query = supabase
    .from('listings')
    .select('id, item_id, seller_id, status, price, price_type, condition, description, created_at, updated_at')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data: listingsData, error: listingsError } = await query;

  if (listingsError) {
    throw listingsError;
  }

  const listings = (listingsData ?? []) as ListingRow[];
  if (listings.length === 0) {
    return [];
  }

  const itemIds = [...new Set(listings.map((listing) => listing.item_id))];
  const { data: itemsData, error: itemsError } = await supabase
    .from('items')
    .select('id, name, photo_url, thumbnail_url')
    .in('id', itemIds)
    .eq('user_id', userId)
    .is('deleted_at', null);

  if (itemsError) {
    throw itemsError;
  }

  const itemById = new Map(((itemsData ?? []) as ListingItemRow[]).map((item) => [item.id, item]));

  return listings
    .map((listing) => {
      const item = itemById.get(listing.item_id);
      if (!item) {
        return null;
      }

      return {
        id: listing.id,
        itemId: listing.item_id,
        sellerId: listing.seller_id,
        status: listing.status,
        price: listing.price,
        priceType: listing.price_type,
        condition: listing.condition,
        description: listing.description,
        createdAt: listing.created_at,
        updatedAt: listing.updated_at,
        item: {
          id: item.id,
          name: item.name,
          photoUrl: item.photo_url,
          thumbnailUrl: item.thumbnail_url,
        },
      };
    })
    .filter((listing): listing is MyMarketplaceListing => listing !== null);
}

async function fetchMyListingCandidates(userId: string): Promise<InventoryCandidateItemRow[]> {
  const { data: itemsData, error: itemsError } = await supabase
    .from('items')
    .select('id, name, photo_url, thumbnail_url, created_at')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(100);

  if (itemsError) {
    throw itemsError;
  }

  const items = (itemsData ?? []) as InventoryCandidateItemRow[];
  if (items.length === 0) {
    return [];
  }

  const itemIds = items.map((item) => item.id);
  const { data: listingRows, error: listingsError } = await supabase
    .from('listings')
    .select('item_id')
    .in('item_id', itemIds)
    .eq('status', 'active');

  if (listingsError) {
    throw listingsError;
  }

  const listedItemIds = new Set(((listingRows ?? []) as { item_id: string }[]).map((row) => row.item_id));
  return items.filter((item) => !listedItemIds.has(item.id));
}

export function useMyMarketplaceListings(userId: string | undefined, statusFilter: MyListingStatusFilter) {
  return useQuery({
    queryKey: ['my-marketplace-listings', userId, statusFilter],
    enabled: Boolean(userId),
    queryFn: () => fetchMyListings(userId as string, statusFilter),
  });
}

export function useMyListingCandidates(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-listing-candidates', userId],
    enabled: Boolean(userId),
    queryFn: () => fetchMyListingCandidates(userId as string),
  });
}

export function useCreateMarketplaceListingMutation(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateListingInput) => {
      if (!userId) {
        throw new Error('You must be signed in to create listings.');
      }

      const sellerId = await fetchSellerProfileId(userId);
      const insertPayload = {
        item_id: input.itemId,
        seller_id: sellerId,
        status: 'active' as ListingStatus,
        price: input.priceType === 'free' ? null : input.price,
        price_type: input.priceType,
        condition: input.condition,
        description: input.description.trim() || null,
      };

      const { error } = await (supabase.from('listings') as ReturnType<typeof supabase.from>).insert(
        insertPayload as Record<string, unknown>
      );

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-marketplace-listings', userId] });
      void queryClient.invalidateQueries({ queryKey: ['my-listing-candidates', userId] });
      void queryClient.invalidateQueries({ queryKey: ['marketplace-feed'] });
    },
  });
}

export function useUpdateMarketplaceListingMutation(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateListingInput) => {
      if (!userId) {
        throw new Error('You must be signed in to update listings.');
      }

      const sellerId = await fetchSellerProfileId(userId);
      const updatePayload: {
        status?: ListingStatus;
        price?: number | null;
        price_type?: PriceType;
        condition?: ItemCondition;
        description?: string | null;
      } = {};

      if (input.updates.status) {
        updatePayload.status = input.updates.status;
      }

      if (input.updates.priceType) {
        updatePayload.price_type = input.updates.priceType;
      }

      if (input.updates.condition) {
        updatePayload.condition = input.updates.condition;
      }

      if (typeof input.updates.description === 'string') {
        updatePayload.description = input.updates.description.trim() || null;
      }

      if (Object.prototype.hasOwnProperty.call(input.updates, 'price')) {
        const nextPriceType = input.updates.priceType;
        updatePayload.price = nextPriceType === 'free' ? null : input.updates.price ?? null;
      }

      if (updatePayload.price_type === 'free') {
        updatePayload.price = null;
      }

      const { error } = await (supabase
        .from('listings') as ReturnType<typeof supabase.from>)
        .update(updatePayload as Record<string, unknown>)
        .eq('id', input.listingId)
        .eq('seller_id', sellerId);

      if (error) {
        throw error;
      }
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['my-marketplace-listings', userId] });
      void queryClient.invalidateQueries({ queryKey: ['my-listing-candidates', userId] });
      void queryClient.invalidateQueries({ queryKey: ['marketplace-feed'] });
      void queryClient.invalidateQueries({ queryKey: ['marketplace-listing-detail', variables.listingId] });
    },
  });
}
