/**
 * Inventory Page - Browse all user items
 * Shows inventory with header, search icon, view toggle, item count, and FAB
 * Supports infinite scroll pagination with scroll position restoration
 * Filter state persisted in URL: /inventory?location={id}&categories={id1,id2}&sort={key}
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUserSettings } from '@/hooks/useUserSettings';
import type { InventorySortOption } from '@/hooks/useInventoryItems';
import {
  useInventoryItems,
  getSortFromUrlParam,
  getUrlParamFromSort,
  getSortLabel,
} from '@/hooks/useInventoryItems';
import { GalleryGrid } from '@/components/GalleryGrid';
import { ItemList } from '@/components/ItemList';
import { SortBottomSheet } from '@/components/SortBottomSheet';
import { LocationFilterBottomSheet } from '@/components/LocationFilterBottomSheet';
import { CategoryFilterBottomSheet } from '@/components/CategoryFilterBottomSheet';
import { useLocations } from '@/hooks/useLocations';
import { NotificationBell } from '@/components/NotificationBell';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/PullToRefreshIndicator';
import { Toast } from '@/components/Toast';

// Key for storing scroll position in sessionStorage
const SCROLL_POSITION_KEY = 'inventory-scroll-position';

// View mode type
type ViewMode = 'gallery' | 'list';

/**
 * Grid icon for gallery view toggle
 */
function GridIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="w-5 h-5"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      {filled ? (
        // Filled grid icon
        <path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z" />
      ) : (
        // Outline grid icon
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
        />
      )}
    </svg>
  );
}

/**
 * List icon for list view toggle
 */
function ListIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="w-5 h-5"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      {filled ? (
        // Filled list icon
        <>
          <rect x="4" y="5" width="16" height="3" rx="1" />
          <rect x="4" y="10.5" width="16" height="3" rx="1" />
          <rect x="4" y="16" width="16" height="3" rx="1" />
        </>
      ) : (
        // Outline list icon
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      )}
    </svg>
  );
}

/**
 * View toggle component for switching between gallery and list views
 */
function ViewToggle({
  viewMode,
  onViewChange,
  isLoading,
}: {
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
  isLoading: boolean;
}) {
  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-1">
      {/* Gallery view button */}
      <button
        onClick={() => onViewChange('gallery')}
        disabled={isLoading}
        className={`p-1.5 rounded-md transition-colors ${
          viewMode === 'gallery'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label="Gallery view"
        aria-pressed={viewMode === 'gallery'}
      >
        <GridIcon filled={viewMode === 'gallery'} />
      </button>

      {/* List view button */}
      <button
        onClick={() => onViewChange('list')}
        disabled={isLoading}
        className={`p-1.5 rounded-md transition-colors ${
          viewMode === 'list'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label="List view"
        aria-pressed={viewMode === 'list'}
      >
        <ListIcon filled={viewMode === 'list'} />
      </button>
    </div>
  );
}

export function InventoryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { settings, isLoading: settingsLoading, updateSettings } = useUserSettings();

  // Get sort from URL param, default to 'newest'
  const sortFromUrl = getSortFromUrlParam(searchParams.get('sort'));

  // Get filters from URL params
  const locationIdFromUrl = searchParams.get('location');
  const categoriesFromUrl = searchParams.get('categories');

  // Parse categories from URL (comma-separated IDs)
  const selectedCategoryIds = categoriesFromUrl ? categoriesFromUrl.split(',').filter(Boolean) : [];

  // Bottom sheet states
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);
  const [isLocationSheetOpen, setIsLocationSheetOpen] = useState(false);
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);

  // Fetch locations for getting location name for chip label
  const { locations } = useLocations();

  // Compute filter active states
  const hasActiveCategories = selectedCategoryIds.length > 0;
  const hasActiveLocation = locationIdFromUrl !== null;
  const hasAnyActiveFilter = hasActiveCategories || hasActiveLocation;

  const {
    items,
    isLoading: itemsLoading,
    isRefreshing,
    isLoadingMore,
    hasMore,
    totalCount,
    error: itemsError,
    refresh: refreshItems,
    loadMore,
  } = useInventoryItems({
    sortBy: sortFromUrl,
    categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
    locationId: locationIdFromUrl ?? undefined,
  });

  // Track if we should restore scroll position
  const shouldRestoreScrollRef = useRef(true);
  const hasRestoredScrollRef = useRef(false);

  // Track if user has explicitly changed the view (to avoid overriding with settings)
  const [userSelectedView, setUserSelectedView] = useState<ViewMode | null>(null);
  const [isUpdatingView, setIsUpdatingView] = useState(false);

  // Toast state for refresh feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Scroll container ref for scroll position restoration
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Compute effective view mode: user selection takes precedence over settings
  const viewMode: ViewMode = userSelectedView ?? settings?.default_view ?? 'gallery';

  const handleSearchClick = () => {
    navigate('/search');
  };

  const handleAddClick = () => {
    navigate('/add');
  };

  const handleViewChange = async (mode: ViewMode) => {
    // Update local state immediately for responsive UI
    setUserSelectedView(mode);

    // Persist to user settings
    setIsUpdatingView(true);
    await updateSettings({ default_view: mode });
    setIsUpdatingView(false);
  };

  const handleSortChange = (sort: InventorySortOption) => {
    // Update URL param using replaceState (no history push)
    const newParams = new URLSearchParams(searchParams);
    if (sort === 'newest') {
      // Remove param if default
      newParams.delete('sort');
    } else {
      newParams.set('sort', getUrlParamFromSort(sort));
    }
    setSearchParams(newParams, { replace: true });
  };

  // Clear all filters
  const handleClearAllFilters = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('categories');
    newParams.delete('location');
    // Note: We keep sort as it's not considered a "filter"
    setSearchParams(newParams, { replace: true });
  };

  // Chip click handlers - open respective bottom sheets
  const onCategoryChipClick = () => {
    setIsCategorySheetOpen(true);
  };

  const onLocationChipClick = () => {
    setIsLocationSheetOpen(true);
  };

  // Handle location filter apply
  const handleLocationFilterApply = (locationId: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (locationId) {
      newParams.set('location', locationId);
    } else {
      newParams.delete('location');
    }
    setSearchParams(newParams, { replace: true });
  };

  // Handle category filter apply
  const handleCategoryFilterApply = (categoryIds: string[]) => {
    const newParams = new URLSearchParams(searchParams);
    if (categoryIds.length > 0) {
      newParams.set('categories', categoryIds.join(','));
    } else {
      newParams.delete('categories');
    }
    setSearchParams(newParams, { replace: true });
  };

  // Compute chip labels
  const categoryChipLabel = hasActiveCategories
    ? selectedCategoryIds.length === 1
      ? '1 Category'
      : `${selectedCategoryIds.length} Categories`
    : 'All Categories';

  // Get selected location name for chip label
  const selectedLocation = locationIdFromUrl
    ? locations.find((l) => l.id === locationIdFromUrl)
    : null;
  const locationChipLabel = selectedLocation
    ? selectedLocation.name
    : 'All Locations';

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    try {
      await refreshItems();
    } catch {
      setToast({ message: 'Refresh failed', type: 'error' });
    }
  }, [refreshItems, setToast]);

  // Pull-to-refresh hook
  const {
    pullDistance,
    isPulling,
    isRefreshing: isPullRefreshing,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    threshold: pullThreshold,
  } = usePullToRefresh({ onRefresh: handleRefresh });

  // Save scroll position before navigating away
  useEffect(() => {
    const saveScrollPosition = () => {
      if (scrollContainerRef.current) {
        sessionStorage.setItem(SCROLL_POSITION_KEY, String(window.scrollY));
      }
    };

    // Save scroll on navigation
    window.addEventListener('beforeunload', saveScrollPosition);

    return () => {
      window.removeEventListener('beforeunload', saveScrollPosition);
      // Save position when component unmounts (navigation away)
      saveScrollPosition();
    };
  }, []);

  // Restore scroll position when coming back from item detail
  useEffect(() => {
    if (!itemsLoading && items.length > 0 && shouldRestoreScrollRef.current && !hasRestoredScrollRef.current) {
      const savedPosition = sessionStorage.getItem(SCROLL_POSITION_KEY);
      if (savedPosition) {
        // Use requestAnimationFrame to ensure DOM has updated
        requestAnimationFrame(() => {
          window.scrollTo(0, parseInt(savedPosition, 10));
          hasRestoredScrollRef.current = true;
        });
      }
    }
  }, [itemsLoading, items.length]);

  // Reset scroll restore flag when navigating to item detail
  useEffect(() => {
    // Check if navigation is going to an item detail page
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a, button');
      if (link) {
        // Items are navigated via onClick, so we check if we're currently on inventory page
        // The scroll position is saved on unmount
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Clear scroll position when sort/filter changes
  useEffect(() => {
    sessionStorage.removeItem(SCROLL_POSITION_KEY);
    shouldRestoreScrollRef.current = false;
    hasRestoredScrollRef.current = false;
  }, [sortFromUrl, locationIdFromUrl, categoriesFromUrl]);

  return (
    <div className="min-h-full bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Title and count */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Inventory</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {itemsLoading ? (
                <span className="inline-block w-16 h-4 bg-gray-200 rounded animate-pulse" />
              ) : (
                `${totalCount} item${totalCount !== 1 ? 's' : ''}`
              )}
            </p>
          </div>

          {/* Right side: View toggle + Notification bell + Search */}
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <ViewToggle
              viewMode={viewMode}
              onViewChange={handleViewChange}
              isLoading={settingsLoading || isUpdatingView}
            />

            {/* Notification bell */}
            <NotificationBell />

            {/* Search icon button */}
            <button
              onClick={handleSearchClick}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
              aria-label="Search items"
            >
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
            </button>
          </div>
        </div>

        {/* Filter bar with chips */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {/* All Categories chip */}
          <button
            onClick={onCategoryChipClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              hasActiveCategories
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {/* Category icon */}
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
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            <span>{categoryChipLabel}</span>
            {/* Dropdown indicator */}
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* All Locations chip */}
          <button
            onClick={onLocationChipClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              hasActiveLocation
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {/* Location icon */}
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
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>{locationChipLabel}</span>
            {/* Dropdown indicator */}
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Sort chip */}
          <button
            onClick={() => setIsSortSheetOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              sortFromUrl !== 'newest'
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {/* Sort icon */}
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
                d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
              />
            </svg>
            <span>Sort: {getSortLabel(sortFromUrl)}</span>
            {/* Dropdown indicator */}
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Clear All link - only shown when filters are active */}
          {hasAnyActiveFilter && (
            <button
              onClick={handleClearAllFilters}
              className="ml-auto flex-shrink-0 text-sm font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Main content area with pull-to-refresh */}
      <div
        ref={scrollContainerRef}
        className="overflow-y-auto relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull-to-refresh indicator */}
        <PullToRefreshIndicator
          pullDistance={pullDistance}
          threshold={pullThreshold}
          isPulling={isPulling}
          isRefreshing={isPullRefreshing}
        />

        <div className="p-4">
          {viewMode === 'gallery' ? (
            <GalleryGrid
              items={items}
              isLoading={itemsLoading}
              isRefreshing={isRefreshing}
              isLoadingMore={isLoadingMore}
              hasMore={hasMore}
              totalCount={totalCount}
              onRefresh={handleRefresh}
              onLoadMore={loadMore}
              error={itemsError}
              hasActiveFilters={hasAnyActiveFilter}
              onClearFilters={handleClearAllFilters}
            />
          ) : (
            <ItemList
              items={items}
              isLoading={itemsLoading}
              isRefreshing={isRefreshing}
              isLoadingMore={isLoadingMore}
              hasMore={hasMore}
              totalCount={totalCount}
              onRefresh={handleRefresh}
              onLoadMore={loadMore}
              error={itemsError}
              hasActiveFilters={hasAnyActiveFilter}
              onClearFilters={handleClearAllFilters}
            />
          )}
        </div>
      </div>

      {/* FAB - Floating Action Button */}
      <button
        onClick={handleAddClick}
        className="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center active:scale-95 z-20"
        aria-label="Add new item"
      >
        <svg
          className="w-7 h-7"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      {/* Sort Bottom Sheet */}
      <SortBottomSheet
        isOpen={isSortSheetOpen}
        onClose={() => setIsSortSheetOpen(false)}
        currentSort={sortFromUrl}
        onSortChange={handleSortChange}
      />

      {/* Location Filter Bottom Sheet */}
      <LocationFilterBottomSheet
        isOpen={isLocationSheetOpen}
        onClose={() => setIsLocationSheetOpen(false)}
        selectedLocationId={locationIdFromUrl}
        onApplyFilter={handleLocationFilterApply}
      />

      {/* Category Filter Bottom Sheet */}
      <CategoryFilterBottomSheet
        isOpen={isCategorySheetOpen}
        onClose={() => setIsCategorySheetOpen(false)}
        selectedCategoryIds={selectedCategoryIds}
        onApplyFilter={handleCategoryFilterApply}
      />

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
