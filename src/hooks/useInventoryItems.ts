/**
 * Hook for fetching all inventory items
 * Used on the Inventory page to display items in gallery or list view
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

/**
 * Inventory item data structure for display
 */
export interface InventoryItem {
  id: string;
  name: string | null;
  photo_url: string;
  thumbnail_url: string | null;
  category_id: string | null;
  category_name: string | null;
  category_color: string | null;
  category_icon: string | null;
  location_id: string | null;
  location_name: string | null;
  location_path: string | null;
  quantity: number;
  expiration_date: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  last_viewed_at: string | null;
}

/**
 * Sort options for inventory items
 */
export type InventorySortOption = 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'expiring' | 'viewed';

/**
 * Sort option configuration for display
 */
export interface SortOptionConfig {
  key: InventorySortOption;
  label: string;
  urlParam: string;
}

/**
 * All available sort options with display labels and URL params
 */
export const SORT_OPTIONS: SortOptionConfig[] = [
  { key: 'newest', label: 'Newest First', urlParam: 'newest' },
  { key: 'oldest', label: 'Oldest First', urlParam: 'oldest' },
  { key: 'name_asc', label: 'Name A-Z', urlParam: 'az' },
  { key: 'name_desc', label: 'Name Z-A', urlParam: 'za' },
  { key: 'expiring', label: 'Expiring Soon', urlParam: 'expiring' },
  { key: 'viewed', label: 'Recently Viewed', urlParam: 'viewed' },
];

/**
 * Get sort option from URL param
 */
export function getSortFromUrlParam(param: string | null): InventorySortOption {
  if (!param) return 'newest';
  const option = SORT_OPTIONS.find(opt => opt.urlParam === param);
  return option?.key ?? 'newest';
}

/**
 * Get URL param from sort option
 */
export function getUrlParamFromSort(sort: InventorySortOption): string {
  const option = SORT_OPTIONS.find(opt => opt.key === sort);
  return option?.urlParam ?? 'newest';
}

/**
 * Get display label from sort option
 */
export function getSortLabel(sort: InventorySortOption): string {
  const option = SORT_OPTIONS.find(opt => opt.key === sort);
  return option?.label ?? 'Newest First';
}

interface UseInventoryItemsOptions {
  sortBy?: InventorySortOption;
  categoryId?: string | null;
  locationId?: string | null;
  showExpiringSoon?: boolean;
}

/**
 * Hook for fetching all inventory items with filtering and sorting
 * @param options - Filtering and sorting options
 * @returns Object with items, loading state, error, and refetch function
 */
export function useInventoryItems(options: UseInventoryItemsOptions = {}) {
  const { user } = useAuth();
  const { sortBy = 'newest', categoryId, locationId, showExpiringSoon } = options;

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchItems = useCallback(async (isRefresh: boolean = false) => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      // Build query with category and location joins
      let query = supabase
        .from('items')
        .select(`
          id,
          name,
          photo_url,
          thumbnail_url,
          category_id,
          location_id,
          quantity,
          expiration_date,
          is_favorite,
          created_at,
          updated_at,
          last_viewed_at,
          categories (
            name,
            color,
            icon
          ),
          locations (
            name,
            path
          )
        `)
        .eq('user_id', user.id)
        .is('deleted_at', null);

      // Apply filters
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      if (showExpiringSoon) {
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        query = query
          .not('expiration_date', 'is', null)
          .lte('expiration_date', thirtyDaysFromNow.toISOString().split('T')[0])
          .gte('expiration_date', today.toISOString().split('T')[0]);
      }

      // Apply sorting
      switch (sortBy) {
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'name_asc':
          query = query.order('name', { ascending: true, nullsFirst: false });
          break;
        case 'name_desc':
          query = query.order('name', { ascending: false, nullsFirst: false });
          break;
        case 'expiring':
          // Sort by expiration date ascending (soonest first), nulls last
          query = query.order('expiration_date', { ascending: true, nullsFirst: false });
          break;
        case 'viewed':
          // Sort by last_viewed_at descending (most recent first), nulls last
          query = query.order('last_viewed_at', { ascending: false, nullsFirst: false });
          break;
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      const { data, error: fetchError } = await query.returns<Array<{
        id: string;
        name: string | null;
        photo_url: string;
        thumbnail_url: string | null;
        category_id: string | null;
        location_id: string | null;
        quantity: number;
        expiration_date: string | null;
        is_favorite: boolean;
        created_at: string;
        updated_at: string;
        last_viewed_at: string | null;
        categories: {
          name: string;
          color: string;
          icon: string;
        } | null;
        locations: {
          name: string;
          path: string;
        } | null;
      }>>();

      if (fetchError) {
        throw fetchError;
      }

      // Transform data to InventoryItem format
      const inventoryItems: InventoryItem[] = (data || []).map((item) => ({
        id: item.id,
        name: item.name,
        photo_url: item.photo_url,
        thumbnail_url: item.thumbnail_url,
        category_id: item.category_id,
        category_name: item.categories?.name || null,
        category_color: item.categories?.color || null,
        category_icon: item.categories?.icon || null,
        location_id: item.location_id,
        location_name: item.locations?.name || null,
        location_path: item.locations?.path || null,
        quantity: item.quantity,
        expiration_date: item.expiration_date,
        is_favorite: item.is_favorite,
        created_at: item.created_at,
        updated_at: item.updated_at,
        last_viewed_at: item.last_viewed_at,
      }));

      setItems(inventoryItems);
    } catch (err) {
      console.error('Error fetching inventory items:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch items');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, sortBy, categoryId, locationId, showExpiringSoon]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const refetch = useCallback(() => fetchItems(false), [fetchItems]);
  const refresh = useCallback(() => fetchItems(true), [fetchItems]);

  return {
    items,
    isLoading,
    isRefreshing,
    error,
    refetch,
    refresh,
  };
}
