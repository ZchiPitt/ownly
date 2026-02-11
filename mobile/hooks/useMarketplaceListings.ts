import { useQuery } from '@tanstack/react-query';

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
  user_id: string;
  display_name: string | null;
  location_city: string | null;
  seller_rating: number | null;
  review_count: number;
};

export type MarketplaceListingSummary = {
  id: string;
  itemId: string;
  sellerId: string;
  status: ListingStatus;
  price: number | null;
  priceType: PriceType;
  condition: ItemCondition;
  description: string | null;
  viewCount: number;
  createdAt: string;
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

export type MarketplaceListingDetail = MarketplaceListingSummary & {
  sellerUserId: string;
};

const FEED_LIMIT = 30;

function mapListingSummary(
  listing: ListingRow,
  itemById: Map<string, ListingItemRow>,
  sellerById: Map<string, SellerProfileRow>
): MarketplaceListingSummary {
  const item = itemById.get(listing.item_id);
  const seller = sellerById.get(listing.seller_id);

  return {
    id: listing.id,
    itemId: listing.item_id,
    sellerId: listing.seller_id,
    status: listing.status,
    price: listing.price,
    priceType: listing.price_type,
    condition: listing.condition,
    description: listing.description,
    viewCount: listing.view_count,
    createdAt: listing.created_at,
    item: {
      name: item?.name ?? null,
      photoUrl: item?.photo_url ?? '',
      thumbnailUrl: item?.thumbnail_url ?? null,
    },
    seller: {
      displayName: seller?.display_name ?? null,
      locationCity: seller?.location_city ?? null,
      sellerRating: seller?.seller_rating ?? null,
      reviewCount: seller?.review_count ?? 0,
    },
  };
}

async function fetchMarketplaceFeed(): Promise<MarketplaceListingSummary[]> {
  const { data: listingsData, error: listingsError } = await supabase
    .from('listings')
    .select('id, item_id, seller_id, status, price, price_type, condition, description, view_count, created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(FEED_LIMIT);

  if (listingsError) {
    throw listingsError;
  }

  const listings = ((listingsData ?? []) as ListingRow[]).filter((listing) => listing.status === 'active');
  if (listings.length === 0) {
    return [];
  }

  const itemIds = [...new Set(listings.map((listing) => listing.item_id))];
  const sellerIds = [...new Set(listings.map((listing) => listing.seller_id))];

  const { data: itemsData, error: itemsError } = await supabase
    .from('items')
    .select('id, name, photo_url, thumbnail_url')
    .in('id', itemIds);

  if (itemsError) {
    throw itemsError;
  }

  const { data: sellersData, error: sellersError } = await supabase
    .from('profiles')
    .select('id, user_id, display_name, location_city, seller_rating, review_count')
    .in('id', sellerIds);

  if (sellersError) {
    throw sellersError;
  }

  const itemById = new Map(((itemsData ?? []) as ListingItemRow[]).map((item) => [item.id, item]));
  const sellerById = new Map(((sellersData ?? []) as SellerProfileRow[]).map((seller) => [seller.id, seller]));

  return listings
    .map((listing) => mapListingSummary(listing, itemById, sellerById))
    .filter((listing) => listing.item.photoUrl.length > 0);
}

async function fetchMarketplaceListingDetail(listingId: string): Promise<MarketplaceListingDetail | null> {
  const { data: listingData, error: listingError } = await supabase
    .from('listings')
    .select('id, item_id, seller_id, status, price, price_type, condition, description, view_count, created_at')
    .eq('id', listingId)
    .maybeSingle();

  if (listingError) {
    throw listingError;
  }

  const listing = (listingData as ListingRow | null) ?? null;
  if (!listing) {
    return null;
  }

  if (listing.status === 'removed') {
    return null;
  }

  const [{ data: itemData, error: itemError }, { data: sellerData, error: sellerError }] = await Promise.all([
    supabase.from('items').select('id, name, photo_url, thumbnail_url').eq('id', listing.item_id).maybeSingle(),
    supabase
      .from('profiles')
      .select('id, user_id, display_name, location_city, seller_rating, review_count')
      .eq('id', listing.seller_id)
      .maybeSingle(),
  ]);

  if (itemError) {
    throw itemError;
  }

  if (sellerError) {
    throw sellerError;
  }

  const item = itemData as ListingItemRow | null;
  const seller = sellerData as SellerProfileRow | null;

  if (!item) {
    return null;
  }

  return {
    id: listing.id,
    itemId: listing.item_id,
    sellerId: listing.seller_id,
    status: listing.status,
    sellerUserId: seller?.user_id ?? '',
    price: listing.price,
    priceType: listing.price_type,
    condition: listing.condition,
    description: listing.description,
    viewCount: listing.view_count,
    createdAt: listing.created_at,
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
}

export function useMarketplaceFeed() {
  return useQuery({
    queryKey: ['marketplace-feed'],
    queryFn: fetchMarketplaceFeed,
  });
}

export function useMarketplaceListingDetail(listingId: string | undefined) {
  return useQuery({
    queryKey: ['marketplace-listing-detail', listingId],
    enabled: Boolean(listingId),
    queryFn: () => fetchMarketplaceListingDetail(listingId as string),
  });
}
