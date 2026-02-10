import { useInfiniteQuery } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';

const PAGE_SIZE = 20;

type InventoryListItem = {
  id: string;
  name: string | null;
  location_id: string | null;
  created_at: string;
};

type InventoryPage = {
  items: InventoryListItem[];
  nextOffset: number | null;
};

async function fetchInventoryPage(userId: string, offset: number): Promise<InventoryPage> {
  const end = offset + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from('items')
    .select('id, name, location_id, created_at', { count: 'exact' })
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, end);

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

export function useInventoryItems(userId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ['inventory-items', userId],
    enabled: Boolean(userId),
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchInventoryPage(userId as string, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextOffset,
  });
}
