import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ItemAIMetadata } from '../../src/types/database';
import type { ItemEditorValues } from '../components';
import { supabase } from '../lib/supabase';

const DEFAULT_PHOTO_URL = 'https://placehold.co/1200x1200/png?text=Item';

type UpsertItemValues = {
  name: string | null;
  description: string | null;
  quantity: number;
  category_id: string | null;
  location_id: string | null;
  tags: string[];
  price: number | null;
  currency: string;
  purchase_date: string | null;
  expiration_date: string | null;
  warranty_expiry_date: string | null;
  brand: string | null;
  model: string | null;
};

type CreateItemInput = {
  userId: string;
  values: ItemEditorValues;
  photoUrl?: string;
  thumbnailUrl?: string | null;
  aiMetadata?: ItemAIMetadata | null;
  sourceBatchId?: string | null;
};

type UpdateItemInput = {
  userId: string;
  itemId: string;
  values: ItemEditorValues;
};

type ToggleFavoriteInput = {
  userId: string;
  itemId: string;
  currentValue: boolean;
};

type SoftDeleteInput = {
  userId: string;
  itemId: string;
};

function toNullIfEmpty(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toNullableDate(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toNullablePrice(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapEditorValues(values: ItemEditorValues): UpsertItemValues {
  return {
    name: toNullIfEmpty(values.name),
    description: toNullIfEmpty(values.description),
    quantity: values.quantity,
    category_id: values.categoryId,
    location_id: values.locationId,
    tags: values.tags,
    price: toNullablePrice(values.price),
    currency: values.currency,
    purchase_date: toNullableDate(values.purchaseDate),
    expiration_date: toNullableDate(values.expirationDate),
    warranty_expiry_date: toNullableDate(values.warrantyExpiryDate),
    brand: toNullIfEmpty(values.brand),
    model: toNullIfEmpty(values.model),
  };
}

function useInvalidateInventoryCaches() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] }),
      queryClient.invalidateQueries({ queryKey: ['inventory-item-detail'] }),
    ]);
}

export function useCreateInventoryItemMutation() {
  const invalidateInventoryCaches = useInvalidateInventoryCaches();

  return useMutation({
    mutationFn: async ({ userId, values, photoUrl, thumbnailUrl, aiMetadata, sourceBatchId }: CreateItemInput) => {
      const payload = {
        user_id: userId,
        photo_url: photoUrl?.trim() ? photoUrl : DEFAULT_PHOTO_URL,
        thumbnail_url: thumbnailUrl ?? null,
        ai_metadata: aiMetadata ?? null,
        source_batch_id: sourceBatchId ?? null,
        ...mapEditorValues(values),
      };

      const { data, error } = await supabase
        .from('items')
        .insert(payload as never)
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: async () => {
      await invalidateInventoryCaches();
    },
  });
}

export function useUpdateInventoryItemMutation() {
  const invalidateInventoryCaches = useInvalidateInventoryCaches();

  return useMutation({
    mutationFn: async ({ userId, itemId, values }: UpdateItemInput) => {
      const { error } = await supabase
        .from('items')
        .update(mapEditorValues(values) as never)
        .eq('id', itemId)
        .eq('user_id', userId)
        .is('deleted_at', null);

      if (error) {
        throw error;
      }
    },
    onSuccess: async () => {
      await invalidateInventoryCaches();
    },
  });
}

export function useToggleFavoriteItemMutation() {
  const invalidateInventoryCaches = useInvalidateInventoryCaches();

  return useMutation({
    mutationFn: async ({ userId, itemId, currentValue }: ToggleFavoriteInput) => {
      const { error } = await supabase
        .from('items')
        .update({ is_favorite: !currentValue } as never)
        .eq('id', itemId)
        .eq('user_id', userId)
        .is('deleted_at', null);

      if (error) {
        throw error;
      }
    },
    onSuccess: async () => {
      await invalidateInventoryCaches();
    },
  });
}

export function useSoftDeleteItemMutation() {
  const invalidateInventoryCaches = useInvalidateInventoryCaches();

  return useMutation({
    mutationFn: async ({ userId, itemId }: SoftDeleteInput) => {
      const { error } = await supabase
        .from('items')
        .update({ deleted_at: new Date().toISOString() } as never)
        .eq('id', itemId)
        .eq('user_id', userId)
        .is('deleted_at', null);

      if (error) {
        throw error;
      }
    },
    onSuccess: async () => {
      await invalidateInventoryCaches();
    },
  });
}
