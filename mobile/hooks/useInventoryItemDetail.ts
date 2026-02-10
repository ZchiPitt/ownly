import { useQuery } from '@tanstack/react-query';

import type { Item } from '../../src/types/database';
import { supabase } from '../lib/supabase';

export type InventoryItemDetail = {
  item: Item;
  categoryName: string | null;
  locationPath: string | null;
};

async function fetchInventoryItemDetail(userId: string, itemId: string): Promise<InventoryItemDetail | null> {
  const { data: item, error: itemError } = await supabase
    .from('items')
    .select('*')
    .eq('id', itemId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .maybeSingle();

  if (itemError) {
    throw itemError;
  }

  const rawItem = item as Item | null;

  if (!rawItem) {
    return null;
  }

  let categoryName: string | null = null;
  if (rawItem.category_id) {
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('name')
      .eq('id', rawItem.category_id)
      .maybeSingle();

    if (categoryError) {
      throw categoryError;
    }

    categoryName = (category as { name: string } | null)?.name ?? null;
  }

  let locationPath: string | null = null;
  if (rawItem.location_id) {
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .select('path')
      .eq('id', rawItem.location_id)
      .maybeSingle();

    if (locationError) {
      throw locationError;
    }

    locationPath = (location as { path: string } | null)?.path ?? null;
  }

  return {
    item: rawItem,
    categoryName,
    locationPath,
  };
}

export function useInventoryItemDetail(userId: string | undefined, itemId: string | undefined) {
  return useQuery({
    queryKey: ['inventory-item-detail', userId, itemId],
    enabled: Boolean(userId && itemId),
    queryFn: () => fetchInventoryItemDetail(userId as string, itemId as string),
  });
}
