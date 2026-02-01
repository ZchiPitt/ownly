/**
 * Marketplace Page - Browse community listings
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMarketplace, MARKETPLACE_PAGE_SIZE } from '@/hooks/useMarketplace';
import type { MarketplaceListing, MarketplaceFilters, SortOption } from '@/hooks/useMarketplace';
import { MarketplaceCard, MarketplaceCardSkeleton } from '@/components/MarketplaceCard';
import { MarketplaceFilterSheet } from '@/components/MarketplaceFilterSheet';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/PullToRefreshIndicator';
import { supabase } from '@/lib/supabase';

const defaultFilters: MarketplaceFilters = {
  categories: [],
  conditions: [],
  priceType: 'all',
  minPrice: null,
  maxPrice: null,
  search: '',
};

const RECENT_SEARCHES_KEY = 'marketplace_recent_searches';
const MAX_RECENT_SEARCHES = 5;

function loadRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string').slice(0, MAX_RECENT_SEARCHES);
    }
  } catch (error) {
    console.warn('Failed to load marketplace recent searches:', error);
  }

  return [];
}

function persistRecentSearches(searches: string[]) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
  } catch (error) {
    console.warn('Failed to save marketplace recent searches:', error);
  }
}

function saveRecentSearch(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return loadRecentSearches();

  const recent = loadRecentSearches();
  const updated = [
    trimmed,
    ...recent.filter((search) => search.toLowerCase() !== trimmed.toLowerCase()),
  ].slice(0, MAX_RECENT_SEARCHES);

  persistRecentSearches(updated);
  return updated;
}

function clearRecentSearches(): void {
  persistRecentSearches([]);
}

function SearchIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L15 12.414V19a1 1 0 01-.553.894l-4 2A1 1 0 019 21v-8.586L3.293 6.707A1 1 0 013 6V4z"
      />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function LoadingMoreSpinner() {
  return (
    <div className="flex items-center justify-center py-6">
      <svg
        className="w-5 h-5 text-teal-600 animate-spin"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="ml-2 text-sm text-gray-600">Loading more...</span>
    </div>
  );
}

function EmptyState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L15 12.414V19a1 1 0 01-.553.894l-4 2A1 1 0 019 21v-8.586L3.293 6.707A1 1 0 013 6V4z"
          />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-gray-900">No listings found</h2>
      <p className="text-sm text-gray-500 text-center mt-1">
        Try adjusting your filters or search.
      </p>
      <button
        type="button"
        onClick={onClearFilters}
        className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
      >
        Clear filters
      </button>
    </div>
  );
}

export function MarketplacePage() {
  const { user } = useAuth();
  const { getListings } = useMarketplace();

  const [filters, setFilters] = useState<MarketplaceFilters>(defaultFilters);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => loadRecentSearches());
  const [sort, setSort] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    setFilters((prev) => {
      if (prev.search === debouncedSearch) return prev;
      return { ...prev, search: debouncedSearch };
    });
  }, [debouncedSearch]);

  useEffect(() => {
    if (!debouncedSearch) return;
    const updated = saveRecentSearch(debouncedSearch);
    setRecentSearches(updated);
  }, [debouncedSearch]);

  useEffect(() => {
    let isMounted = true;

    const fetchProfileId = async () => {
      if (!user) {
        if (isMounted) {
          setProfileId(null);
          setIsProfileLoading(false);
        }
        return;
      }

      setIsProfileLoading(true);

      const { data, error: fetchError } = await (supabase.from('profiles') as ReturnType<typeof supabase.from>)
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!isMounted) return;

      if (fetchError) {
        console.error('Failed to fetch profile id:', fetchError);
        setProfileId(null);
      } else {
        setProfileId(data?.id ?? null);
      }

      setIsProfileLoading(false);
    };

    fetchProfileId();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const fetchListings = useCallback(async ({
    pageToLoad,
    append,
    isRefresh,
  }: {
    pageToLoad: number;
    append: boolean;
    isRefresh?: boolean;
  }) => {
    if (isRefresh) {
      setIsLoading(false);
    } else if (pageToLoad === 0) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    setError(null);

    try {
      const { listings: nextListings, hasMore: nextHasMore } = await getListings({
        filters,
        sort,
        page: pageToLoad,
        pageSize: MARKETPLACE_PAGE_SIZE,
        excludeUserId: profileId ?? undefined,
      });

      setListings((prev) => (append ? [...prev, ...nextListings] : nextListings));
      setHasMore(nextHasMore);
      setPage(pageToLoad);
    } catch (err) {
      console.error('Error fetching marketplace listings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load listings');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [filters, sort, getListings, profileId]);

  useEffect(() => {
    if (user && isProfileLoading) return;
    fetchListings({ pageToLoad: 0, append: false });
  }, [fetchListings, isProfileLoading, user]);

  const handleLoadMore = useCallback(() => {
    if (isLoading || isLoadingMore || !hasMore) return;
    const nextPage = page + 1;
    fetchListings({ pageToLoad: nextPage, append: true });
  }, [fetchListings, hasMore, isLoading, isLoadingMore, page]);

  useEffect(() => {
    if (!hasMore || isLoading || isLoadingMore) return;
    const triggerElement = loadMoreTriggerRef.current;
    if (!triggerElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { rootMargin: '200px', threshold: 0 }
    );

    observer.observe(triggerElement);
    return () => observer.disconnect();
  }, [handleLoadMore, hasMore, isLoading, isLoadingMore]);

  const handleRefresh = useCallback(async () => {
    await fetchListings({ pageToLoad: 0, append: false, isRefresh: true });
  }, [fetchListings]);

  const {
    pullDistance,
    isPulling,
    isRefreshing,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    threshold,
  } = usePullToRefresh({ onRefresh: handleRefresh });

  const handleApplyFilters = useCallback((nextFilters: MarketplaceFilters) => {
    setFilters(nextFilters);
  }, []);

  const handleClearSheetFilters = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      categories: [],
      conditions: [],
      priceType: 'all',
      minPrice: null,
      maxPrice: null,
    }));
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setSearchQuery('');
    setFilters(defaultFilters);
  }, []);

  const hasSearchQuery = debouncedSearch.trim().length > 0;
  const showRecentSearches = isSearchFocused && searchQuery.trim().length === 0 && recentSearches.length > 0;

  return (
    <div className="min-h-full bg-gray-50 pb-20">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-4">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <SearchIcon />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder="Search marketplace..."
            className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          {searchQuery.length > 0 && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <ClearIcon />
            </button>
          )}
          {showRecentSearches && (
            <div className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-gray-200 bg-white shadow-lg z-20 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  Recent searches
                </span>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    clearRecentSearches();
                    setRecentSearches([]);
                  }}
                  className="text-xs font-medium text-teal-600 hover:text-teal-700"
                >
                  Clear all
                </button>
              </div>
              <ul className="max-h-56 overflow-y-auto">
                {recentSearches.map((search) => (
                  <li key={search}>
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setSearchQuery(search);
                        setIsSearchFocused(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <span className="text-gray-400">🕘</span>
                      <span className="truncate">{search}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 mt-3">
          <button
            type="button"
            onClick={() => setShowFilters(true)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <FilterIcon />
            Filters
          </button>

          <div className="flex items-center gap-2">
            <label htmlFor="marketplace-sort" className="text-xs text-gray-500">
              Sort
            </label>
            <select
              id="marketplace-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price Low-High</option>
              <option value="price_desc">Price High-Low</option>
            </select>
          </div>
        </div>
      </div>

      <div
        className="relative px-4 py-4"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <PullToRefreshIndicator
          pullDistance={pullDistance}
          threshold={threshold}
          isPulling={isPulling}
          isRefreshing={isRefreshing}
        />

        {isLoading && listings.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-5xl mx-auto">
            {Array.from({ length: 8 }).map((_, index) => (
              <MarketplaceCardSkeleton key={index} />
            ))}
          </div>
        ) : error && listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Couldn't load listings
            </h3>
            <p className="text-sm text-gray-500 text-center mb-4">{error}</p>
            <button
              type="button"
              onClick={() => handleRefresh()}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : listings.length === 0 ? (
          hasSearchQuery ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <SearchIcon />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                No items found for '{debouncedSearch}'
              </h2>
              <p className="text-sm text-gray-500 text-center mt-1">
                Try a different search term or clear your filters.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear search
              </button>
            </div>
          ) : (
            <EmptyState onClearFilters={handleClearAllFilters} />
          )
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-5xl mx-auto">
              {listings.map((listing) => (
                <MarketplaceCard
                  key={listing.id}
                  listing={listing}
                  onClick={() => {
                    // Placeholder for future listing detail route
                  }}
                />
              ))}
            </div>

            <div ref={loadMoreTriggerRef} className="h-px" />
            {isLoadingMore && <LoadingMoreSpinner />}
          </div>
        )}
      </div>

      <MarketplaceFilterSheet
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={handleApplyFilters}
        onClear={handleClearSheetFilters}
      />
    </div>
  );
}
