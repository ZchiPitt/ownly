import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';
import type { ItemCondition, PriceType } from '../../src/types/database';

type SavedListingRow = {
  listing_id: string;
  created_at: string;
};

type ListingRow = {
  id: string;
  item_id: string;
  seller_id: string;
  status: string;
  price: number | null;
  price_type: PriceType;
  condition: ItemCondition;
  description: string | null;
  view_count: number;
  created_at: string;
};

type ListingItemRow = {
  id: string;
  name: string | null;
  photo_url: string;
  thumbnail_url: string | null;
};

type SellerProfileRow = {
  id: string;
  display_name: string | null;
  location_city: string | null;
  seller_rating: number | null;
  review_count: number;
};

export type SavedMarketplaceListing = {
  id: string;
  itemId: string;
  sellerId: string;
  price: number | null;
  priceType: PriceType;
  condition: ItemCondition;
  description: string | null;
  viewCount: number;
  createdAt: string;
  savedAt: string;
  item: {
    name: string | null;
    photoUrl: string;
    thumbnailUrl: string | null;
  };
  seller: {
    displayName: string | null;
    locationCity: string | null;
    sellerRating: number | null;
    reviewCount: number;
  };
};

type ToggleSavedListingInput = {
  listingId: string;
};

async function fetchProfileId(userId: string): Promise<string> {
  const { data, error } = await supabase.from('profiles').select('id').eq('user_id', userId).maybeSingle();

  if (error) {
    throw error;
  }

  const profile = data as { id: string } | null;
  if (!profile?.id) {
    throw new Error('Could not find your profile.');
  }

  return profile.id;
}

async function fetchSavedRowsByUser(userId: string): Promise<SavedListingRow[]> {
  const profileId = await fetchProfileId(userId);

  const { data, error } = await (supabase.from('saved_listings') as ReturnType<typeof supabase.from>)
    .select('listing_id, created_at')
    .eq('user_id', profileId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as SavedListingRow[]).filter((row) => Boolean(row.listing_id));
}

async function fetchSavedListingIds(userId: string): Promise<string[]> {
  const rows = await fetchSavedRowsByUser(userId);
  return rows.map((row) => row.listing_id);
}

async function fetchSavedMarketplaceListings(userId: string): Promise<SavedMarketplaceListing[]> {
  const savedRows = await fetchSavedRowsByUser(userId);
  if (savedRows.length === 0) {
    return [];
  }

  const listingIds = [...new Set(savedRows.map((row) => row.listing_id))];

  const { data: listingsData, error: listingsError } = await supabase
    .from('listings')
    .select('id, item_id, seller_id, status, price, price_type, condition, description, view_count, created_at')
    .in('id', listingIds);

  if (listingsError) {
    throw listingsError;
  }

  const listings = ((listingsData ?? []) as ListingRow[]).filter((listing) => listing.status !== 'removed');
  if (listings.length === 0) {
    return [];
  }

  const itemIds = [...new Set(listings.map((listing) => listing.item_id))];
  const sellerIds = [...new Set(listings.map((listing) => listing.seller_id))];

  const [{ data: itemsData, error: itemsError }, { data: sellersData, error: sellersError }] = await Promise.all([
    supabase.from('items').select('id, name, photo_url, thumbnail_url').in('id', itemIds),
    supabase
      .from('profiles')
      .select('id, display_name, location_city, seller_rating, review_count')
      .in('id', sellerIds),
  ]);

  if (itemsError) {
    throw itemsError;
  }

  if (sellersError) {
    throw sellersError;
  }

  const listingById = new Map(listings.map((listing) => [listing.id, listing]));
  const itemById = new Map(((itemsData ?? []) as ListingItemRow[]).map((item) => [item.id, item]));
  const sellerById = new Map(((sellersData ?? []) as SellerProfileRow[]).map((seller) => [seller.id, seller]));

  return savedRows
    .map((savedRow) => {
      const listing = listingById.get(savedRow.listing_id);
      if (!listing) {
        return null;
      }

      const item = itemById.get(listing.item_id);
      if (!item?.photo_url) {
        return null;
      }

      const seller = sellerById.get(listing.seller_id);

      return {
        id: listing.id,
        itemId: listing.item_id,
        sellerId: listing.seller_id,
        price: listing.price,
        priceType: listing.price_type,
        condition: listing.condition,
        description: listing.description,
        viewCount: listing.view_count,
        createdAt: listing.created_at,
        savedAt: savedRow.created_at,
        item: {
          name: item.name,
          photoUrl: item.photo_url,
          thumbnailUrl: item.thumbnail_url,
        },
        seller: {
          displayName: seller?.display_name ?? null,
          locationCity: seller?.location_city ?? null,
          sellerRating: seller?.seller_rating ?? null,
          reviewCount: seller?.review_count ?? 0,
        },
      };
    })
    .filter((listing): listing is SavedMarketplaceListing => listing !== null);
}

function optimisticToggleSavedListing(
  previousIds: string[] | undefined,
  listingId: string,
  shouldSave: boolean
): string[] {
  const currentIds = previousIds ?? [];
  const idSet = new Set(currentIds);
  if (shouldSave) {
    idSet.add(listingId);
  } else {
    idSet.delete(listingId);
  }

  return [...idSet];
}

export function useSavedListingIds(userId: string | undefined) {
  return useQuery({
    queryKey: ['saved-listing-ids', userId],
    enabled: Boolean(userId),
    queryFn: () => fetchSavedListingIds(userId as string),
  });
}

export function useSavedMarketplaceListings(userId: string | undefined) {
  return useQuery({
    queryKey: ['saved-marketplace-listings', userId],
    enabled: Boolean(userId),
    queryFn: () => fetchSavedMarketplaceListings(userId as string),
  });
}

export function useSaveMarketplaceListingMutation(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listingId }: ToggleSavedListingInput) => {
      if (!userId) {
        throw new Error('You must be signed in to save listings.');
      }

      const profileId = await fetchProfileId(userId);
      const { error } = await (supabase.from('saved_listings') as ReturnType<typeof supabase.from>).upsert(
        {
          user_id: profileId,
          listing_id: listingId,
        },
        { onConflict: 'user_id,listing_id' }
      );

      if (error) {
        throw error;
      }
    },
    onMutate: async ({ listingId }) => {
      const queryKey = ['saved-listing-ids', userId] as const;
      await queryClient.cancelQueries({ queryKey });
      const previousIds = queryClient.getQueryData<string[]>(queryKey);
      queryClient.setQueryData<string[]>(queryKey, optimisticToggleSavedListing(previousIds, listingId, true));
      return { previousIds };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(['saved-listing-ids', userId], context?.previousIds ?? []);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['saved-listing-ids', userId] });
      void queryClient.invalidateQueries({ queryKey: ['saved-marketplace-listings', userId] });
    },
  });
}

export function useUnsaveMarketplaceListingMutation(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listingId }: ToggleSavedListingInput) => {
      if (!userId) {
        throw new Error('You must be signed in to remove saved listings.');
      }

      const profileId = await fetchProfileId(userId);
      const { error } = await (supabase.from('saved_listings') as ReturnType<typeof supabase.from>)
        .delete()
        .eq('user_id', profileId)
        .eq('listing_id', listingId);

      if (error) {
        throw error;
      }
    },
    onMutate: async ({ listingId }) => {
      const queryKey = ['saved-listing-ids', userId] as const;
      await queryClient.cancelQueries({ queryKey });
      const previousIds = queryClient.getQueryData<string[]>(queryKey);
      queryClient.setQueryData<string[]>(queryKey, optimisticToggleSavedListing(previousIds, listingId, false));
      return { previousIds };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(['saved-listing-ids', userId], context?.previousIds ?? []);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['saved-listing-ids', userId] });
      void queryClient.invalidateQueries({ queryKey: ['saved-marketplace-listings', userId] });
    },
  });
}
