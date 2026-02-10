import { useQuery } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';

type InventorySearchItemRow = {
  id: string;
  name: string | null;
  description: string | null;
  brand: string | null;
  model: string | null;
  notes: string | null;
  tags: string[];
  category_id: string | null;
  location_id: string | null;
  updated_at: string;
};

type CategoryLookupRow = {
  id: string;
  name: string;
  user_id: string | null;
};

type LocationLookupRow = {
  id: string;
  path: string;
};

export type InventorySearchItem = {
  id: string;
  name: string | null;
  description: string | null;
  categoryName: string | null;
  locationPath: string | null;
  updatedAt: string;
};

type UseInventorySearchOptions = {
  userId: string | undefined;
  query: string;
};

const RESULT_LIMIT = 60;

const SEARCH_FIELDS = ['name', 'description', 'brand', 'model', 'notes'] as const;

function normalizeQuery(rawQuery: string): string {
  return rawQuery.trim().replace(/\s+/g, ' ');
}

function toSearchTerms(query: string): string[] {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);

  return [...new Set(terms)];
}

function sanitizeLikeTerm(term: string): string {
  return term.replace(/[%_,]/g, ' ').trim();
}

function buildTextOrCondition(terms: string[]): string {
  const clauses: string[] = [];

  for (const term of terms) {
    const safeTerm = sanitizeLikeTerm(term);
    if (!safeTerm) {
      continue;
    }

    for (const field of SEARCH_FIELDS) {
      clauses.push(`${field}.ilike.%${safeTerm}%`);
    }

    clauses.push(`tags.cs.{${safeTerm}}`);
  }

  return clauses.join(',');
}

function dedupeItems(items: InventorySearchItemRow[]): InventorySearchItemRow[] {
  const byId = new Map<string, InventorySearchItemRow>();

  for (const item of items) {
    if (!byId.has(item.id)) {
      byId.set(item.id, item);
    }
  }

  return Array.from(byId.values()).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

async function fetchInventorySearchResults(
  userId: string,
  rawQuery: string
): Promise<InventorySearchItem[]> {
  const normalizedQuery = normalizeQuery(rawQuery);
  if (!normalizedQuery) {
    return [];
  }

  const terms = toSearchTerms(normalizedQuery);
  const textOrCondition = buildTextOrCondition(terms.length > 0 ? terms : [normalizedQuery]);

  const collectedRows: InventorySearchItemRow[] = [];

  if (textOrCondition) {
    const { data: textMatches, error: textError } = await supabase
      .from('items')
      .select('id, name, description, brand, model, notes, tags, category_id, location_id, updated_at')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .or(textOrCondition)
      .order('updated_at', { ascending: false })
      .limit(RESULT_LIMIT);

    if (textError) {
      throw textError;
    }

    collectedRows.push(...((textMatches ?? []) as InventorySearchItemRow[]));
  }

  const categoryConditions = terms
    .map(sanitizeLikeTerm)
    .filter(Boolean);

  if (categoryConditions.length > 0) {
    const { data: categoryRows, error: categoryError } = await supabase
      .from('categories')
      .select('id, name, user_id');

    if (categoryError) {
      throw categoryError;
    }

    const categoryIds = ((categoryRows ?? []) as CategoryLookupRow[])
      .filter((category) => category.user_id === null || category.user_id === userId)
      .filter((category) =>
        categoryConditions.some((term) => category.name.toLowerCase().includes(term.toLowerCase()))
      )
      .map((category) => category.id);

    if (categoryIds.length > 0) {
      const { data: categoryItems, error: categoryItemsError } = await supabase
        .from('items')
        .select('id, name, description, brand, model, notes, tags, category_id, location_id, updated_at')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .in('category_id', categoryIds)
        .order('updated_at', { ascending: false })
        .limit(RESULT_LIMIT);

      if (categoryItemsError) {
        throw categoryItemsError;
      }

      collectedRows.push(...((categoryItems ?? []) as InventorySearchItemRow[]));
    }
  }

  const locationConditions = terms
    .map(sanitizeLikeTerm)
    .filter(Boolean);

  if (locationConditions.length > 0) {
    const { data: locationRows, error: locationError } = await supabase
      .from('locations')
      .select('id, path')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (locationError) {
      throw locationError;
    }

    const locationIds = ((locationRows ?? []) as LocationLookupRow[])
      .filter((location) =>
        locationConditions.some((term) => location.path.toLowerCase().includes(term.toLowerCase()))
      )
      .map((location) => location.id);

    if (locationIds.length > 0) {
      const { data: locationItems, error: locationItemsError } = await supabase
        .from('items')
        .select('id, name, description, brand, model, notes, tags, category_id, location_id, updated_at')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .in('location_id', locationIds)
        .order('updated_at', { ascending: false })
        .limit(RESULT_LIMIT);

      if (locationItemsError) {
        throw locationItemsError;
      }

      collectedRows.push(...((locationItems ?? []) as InventorySearchItemRow[]));
    }
  }

  const dedupedRows = dedupeItems(collectedRows).slice(0, RESULT_LIMIT);

  if (dedupedRows.length === 0) {
    return [];
  }

  const categoryIds = [...new Set(dedupedRows.map((item) => item.category_id).filter(Boolean))] as string[];
  const locationIds = [...new Set(dedupedRows.map((item) => item.location_id).filter(Boolean))] as string[];

  let categoriesById = new Map<string, string>();
  if (categoryIds.length > 0) {
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name')
      .in('id', categoryIds);

    if (categoriesError) {
      throw categoriesError;
    }

    categoriesById = new Map(
      ((categories ?? []) as CategoryLookupRow[]).map((category) => [category.id, category.name])
    );
  }

  let locationsById = new Map<string, string>();
  if (locationIds.length > 0) {
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('id, path')
      .in('id', locationIds);

    if (locationsError) {
      throw locationsError;
    }

    locationsById = new Map(
      ((locations ?? []) as LocationLookupRow[]).map((location) => [location.id, location.path])
    );
  }

  return dedupedRows.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    categoryName: item.category_id ? categoriesById.get(item.category_id) ?? null : null,
    locationPath: item.location_id ? locationsById.get(item.location_id) ?? null : null,
    updatedAt: item.updated_at,
  }));
}

export function useInventorySearch({ userId, query }: UseInventorySearchOptions) {
  const normalizedQuery = normalizeQuery(query);

  return useQuery({
    queryKey: ['inventory-search', userId, normalizedQuery],
    enabled: Boolean(userId && normalizedQuery.length > 0),
    queryFn: () => fetchInventorySearchResults(userId as string, normalizedQuery),
  });
}
