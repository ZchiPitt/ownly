/**
 * Hook for searching inventory items with debouncing and highlighting
 * Features:
 * - 300ms debounce on search input
 * - Search across: name, description, tags, category.name, location.path, brand
 * - Returns results with matched fields for highlighting
 * - Aborts previous requests when new search initiated
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

/**
 * Search result item with category and location info
 */
export interface SearchResultItem {
  id: string;
  name: string | null;
  description: string | null;
  photo_url: string;
  thumbnail_url: string | null;
  tags: string[];
  brand: string | null;
  category_id: string | null;
  category_name: string | null;
  category_color: string | null;
  category_icon: string | null;
  location_id: string | null;
  location_name: string | null;
  location_path: string | null;
}

/**
 * Raw item type from Supabase query
 */
interface RawSearchItem {
  id: string;
  name: string | null;
  description: string | null;
  photo_url: string;
  thumbnail_url: string | null;
  tags: string[];
  brand: string | null;
  category_id: string | null;
  location_id: string | null;
  categories: {
    name: string;
    color: string;
    icon: string;
  } | null;
  locations: {
    name: string;
    path: string;
  } | null;
}

/**
 * Transform raw Supabase data to SearchResultItem format
 */
function transformRawItem(item: RawSearchItem): SearchResultItem {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    photo_url: item.photo_url,
    thumbnail_url: item.thumbnail_url,
    tags: item.tags || [],
    brand: item.brand,
    category_id: item.category_id,
    category_name: item.categories?.name || null,
    category_color: item.categories?.color || null,
    category_icon: item.categories?.icon || null,
    location_id: item.location_id,
    location_name: item.locations?.name || null,
    location_path: item.locations?.path || null,
  };
}

interface UseSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  onSuccessfulSearch?: (query: string) => void;
}

interface UseSearchResult {
  results: SearchResultItem[];
  isLoading: boolean;
  error: string | null;
  query: string;
  setQuery: (query: string) => void;
  hasSearched: boolean;
}

/**
 * Custom hook for searching inventory items
 * @param options - Search configuration options
 * @returns Search state and control functions
 */
export function useSearch(options: UseSearchOptions = {}): UseSearchResult {
  const { debounceMs = 300, minQueryLength = 1, onSuccessfulSearch } = options;
  const { user } = useAuth();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // AbortController reference for cancelling previous requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  /**
   * Perform the search query against the database
   * Searches across: name, description, tags, category.name, location.path, brand
   */
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!user) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    // Validate minimum query length
    if (searchQuery.length < minQueryLength) {
      setResults([]);
      setIsLoading(false);
      setHasSearched(false);
      return;
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      // Prepare search term for case-insensitive matching
      const searchTerm = `%${searchQuery.toLowerCase()}%`;

      // Build the query with OR conditions across multiple fields
      // Using Supabase's .or() for combining conditions
      const { data, error: searchError } = await supabase
        .from('items')
        .select(`
          id,
          name,
          description,
          photo_url,
          thumbnail_url,
          tags,
          brand,
          category_id,
          location_id,
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
        .is('deleted_at', null)
        .or(
          `name.ilike.${searchTerm},` +
          `description.ilike.${searchTerm},` +
          `brand.ilike.${searchTerm},` +
          `tags.cs.{${searchQuery.toLowerCase()}}`
        )
        .order('updated_at', { ascending: false })
        .limit(50)
        .abortSignal(abortControllerRef.current.signal)
        .returns<RawSearchItem[]>();

      if (searchError) {
        // Don't throw if the request was aborted
        if (searchError.message?.includes('abort')) {
          return;
        }
        throw searchError;
      }

      // Also search by category name and location path
      // These require separate queries due to Supabase's join limitations
      const { data: categoryMatchData, error: categoryError } = await supabase
        .from('items')
        .select(`
          id,
          name,
          description,
          photo_url,
          thumbnail_url,
          tags,
          brand,
          category_id,
          location_id,
          categories!inner (
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
        .is('deleted_at', null)
        .ilike('categories.name', searchTerm)
        .order('updated_at', { ascending: false })
        .limit(50)
        .abortSignal(abortControllerRef.current.signal)
        .returns<RawSearchItem[]>();

      if (categoryError && !categoryError.message?.includes('abort')) {
        console.warn('Category search failed:', categoryError);
      }

      const { data: locationMatchData, error: locationError } = await supabase
        .from('items')
        .select(`
          id,
          name,
          description,
          photo_url,
          thumbnail_url,
          tags,
          brand,
          category_id,
          location_id,
          categories (
            name,
            color,
            icon
          ),
          locations!inner (
            name,
            path
          )
        `)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .ilike('locations.path', searchTerm)
        .order('updated_at', { ascending: false })
        .limit(50)
        .abortSignal(abortControllerRef.current.signal)
        .returns<RawSearchItem[]>();

      if (locationError && !locationError.message?.includes('abort')) {
        console.warn('Location search failed:', locationError);
      }

      // Combine results and deduplicate by id
      const allItems = [
        ...(data || []),
        ...(categoryMatchData || []),
        ...(locationMatchData || []),
      ];

      const uniqueItemsMap = new Map<string, RawSearchItem>();
      for (const item of allItems) {
        if (!uniqueItemsMap.has(item.id)) {
          uniqueItemsMap.set(item.id, item);
        }
      }

      const uniqueItems = Array.from(uniqueItemsMap.values());
      const searchResults = uniqueItems.map(transformRawItem);

      setResults(searchResults);

      // Call onSuccessfulSearch callback when we have results (query >= 2 chars and results >= 1)
      if (searchResults.length > 0 && searchQuery.length >= 2 && onSuccessfulSearch) {
        onSuccessfulSearch(searchQuery);
      }
    } catch (err) {
      // Don't set error if request was aborted
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, minQueryLength, onSuccessfulSearch]);

  // Trigger search when debounced query changes
  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    results,
    isLoading,
    error,
    query,
    setQuery,
    hasSearched,
  };
}
