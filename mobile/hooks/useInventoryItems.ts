import { useInfiniteQuery } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';

const PAGE_SIZE = 20;

export type InventorySortOption = 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'expiring' | 'viewed';

type UseInventoryItemsOptions = {
  userId: string | undefined;
  sortBy?: InventorySortOption;
  categoryId?: string | null;
  locationId?: string | null;
};

type InventoryListItem = {
  id: string;
  name: string | null;
  location_id: string | null;
  created_at: string;
  expiration_date: string | null;
  last_viewed_at: string | null;
};

type InventoryPage = {
  items: InventoryListItem[];
  nextOffset: number | null;
};

async function fetchInventoryPage(
  userId: string,
  offset: number,
  sortBy: InventorySortOption,
  categoryId?: string | null,
  locationId?: string | null
): Promise<InventoryPage> {
  const end = offset + PAGE_SIZE - 1;

  let query = supabase
    .from('items')
    .select('id, name, location_id, created_at, expiration_date, last_viewed_at', { count: 'exact' })
    .eq('user_id', userId)
    .is('deleted_at', null)
    .range(offset, end);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  if (locationId) {
    query = query.eq('location_id', locationId);
  }

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
      query = query.order('expiration_date', { ascending: true, nullsFirst: false });
      break;
    case 'viewed':
      query = query.order('last_viewed_at', { ascending: false, nullsFirst: false });
      break;
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  const items = (data ?? []) as InventoryListItem[];
  const loaded = offset + items.length;
  const hasMore = items.length === PAGE_SIZE && count !== null && loaded < count;

  return {
    items,
    nextOffset: hasMore ? loaded : null,
  };
}

export function useInventoryItems({
  userId,
  sortBy = 'newest',
  categoryId,
  locationId,
}: UseInventoryItemsOptions) {
  return useInfiniteQuery({
    queryKey: ['inventory-items', userId, sortBy, categoryId ?? null, locationId ?? null],
    enabled: Boolean(userId),
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetchInventoryPage(userId as string, pageParam, sortBy, categoryId, locationId),
    getNextPageParam: (lastPage) => lastPage.nextOffset,
  });
}
