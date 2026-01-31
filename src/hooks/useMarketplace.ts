/**
 * Hook for fetching marketplace listings with filters and pagination
 */

import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { ItemCondition, PriceType } from '@/types/database';

export interface MarketplaceFilters {
  categories: string[];
  conditions: string[];
  priceType: 'all' | 'free';
  minPrice: number | null;
  maxPrice: number | null;
  search: string;
}

export type SortOption = 'newest' | 'price_asc' | 'price_desc';

export interface MarketplaceListing {
  id: string;
  item_id: string;
  price: number | null;
  price_type: PriceType;
  condition: ItemCondition;
  description: string | null;
  created_at: string;
  item: {
    id: string;
    name: string | null;
    photo_url: string;
    thumbnail_url: string | null;
  };
  seller: {
    id: string;
    display_name: string | null;
    location_city: string | null;
    seller_rating: number | null;
  };
}

export interface MarketplaceQueryOptions {
  filters?: MarketplaceFilters;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
  excludeUserId?: string;
}

interface RawMarketplaceListing extends Omit<MarketplaceListing, 'item'> {
  item: MarketplaceListing['item'] & {
    category_id: string | null;
  };
}

export const MARKETPLACE_PAGE_SIZE = 20;

export function useMarketplace() {
  const getListings = useCallback(async (options: MarketplaceQueryOptions) => {
    const {
      filters,
      sort = 'newest',
      page = 0,
      pageSize = MARKETPLACE_PAGE_SIZE,
      excludeUserId,
    } = options;

    const offset = page * pageSize;

    let query = (supabase.from('listings') as ReturnType<typeof supabase.from>)
      .select(`
        id,
        item_id,
        price,
        price_type,
        condition,
        description,
        created_at,
        item:items!inner(id, name, photo_url, thumbnail_url, category_id),
        seller:profiles!inner(id, display_name, location_city, seller_rating)
      `)
      .eq('status', 'active');

    if (excludeUserId) {
      query = query.neq('seller_id', excludeUserId);
    }

    if (filters) {
      if (filters.categories.length > 0) {
        query = query.in('item.category_id', filters.categories);
      }

      if (filters.conditions.length > 0) {
        query = query.in('condition', filters.conditions);
      }

      if (filters.priceType === 'free') {
        query = query.eq('price_type', 'free');
      }

      if (filters.minPrice !== null) {
        query = query.gte('price', filters.minPrice);
      }

      if (filters.maxPrice !== null) {
        query = query.lte('price', filters.maxPrice);
      }

      if (filters.search.trim().length > 0) {
        const searchTerm = filters.search.trim();
        query = query.or(`item.name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
    }

    switch (sort) {
      case 'price_asc':
        query = query.order('price', { ascending: true, nullsFirst: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false, nullsFirst: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    const { data, error } = await query
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw error;
    }

    const rawListings = (data as RawMarketplaceListing[] | null) ?? [];
    const listings = rawListings.map(({ item, ...listing }) => ({
      ...listing,
      item: {
        id: item.id,
        name: item.name,
        photo_url: item.photo_url,
        thumbnail_url: item.thumbnail_url,
      },
    }));

    return {
      listings,
      hasMore: listings.length === pageSize,
    };
  }, []);

  return { getListings };
}
