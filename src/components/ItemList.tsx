/**
 * Item List Component - List view for inventory items
 * Displays items as full-width rows with thumbnail, name, location, category, and chevron
 * Supports infinite scroll pagination
 */

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { InventoryItem } from '@/hooks/useInventoryItems';

/**
 * Props for ItemRow component
 */
interface ItemRowProps {
  item: InventoryItem;
  onClick?: () => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

/**
 * Individual item row for list view
 */
function ItemRow({ item, onClick, isSelectionMode, isSelected, onToggleSelect }: ItemRowProps) {
  const imageUrl = item.thumbnail_url || item.photo_url;
  const displayName = item.name || 'Untitled Item';
  const locationPath = item.location_path || item.location_name;

  const handleClick = () => {
    if (isSelectionMode && onToggleSelect) {
      onToggleSelect();
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center gap-3 p-3 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors text-left ${
        isSelectionMode && isSelected ? 'bg-teal-50' : ''
      }`}
      style={{ height: '72px' }}
    >
      {/* Selection checkbox */}
      {isSelectionMode && (
        <div
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
            isSelected
              ? 'bg-teal-500 border-teal-500'
              : 'bg-white border-gray-300'
          }`}
        >
          {isSelected && (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      )}

      {/* Thumbnail - 60x60 */}
      <div className="relative flex-shrink-0 w-[60px] h-[60px] rounded-lg overflow-hidden bg-gray-100">
        <img
          src={imageUrl}
          alt={displayName}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Quantity badge (if > 1) */}
        {item.quantity > 1 && (
          <div className="absolute top-1 left-1 px-1 py-0.5 bg-black/70 rounded text-[10px] font-medium text-white">
            ×{item.quantity}
          </div>
        )}

        {/* Favorite indicator */}
        {item.is_favorite && !isSelectionMode && (
          <div className="absolute top-1 right-1 w-4 h-4 bg-white/90 rounded-full flex items-center justify-center shadow-sm">
            <svg
              className="w-2.5 h-2.5 text-red-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        )}
      </div>

      {/* Name and location - center */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-900 truncate">
          {displayName}
        </h3>
        {locationPath && (
          <p className="text-xs text-gray-500 mt-0.5 truncate flex items-center gap-1">
            <svg
              className="w-3 h-3 flex-shrink-0 text-gray-400"
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
            <span className="truncate">{locationPath}</span>
          </p>
        )}
      </div>

      {/* Category badge and chevron - right */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {item.has_active_listing && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-emerald-600 text-white">
            Listed
          </span>
        )}
        {/* Category badge */}
        {item.category_name && (
          <span
            className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
            style={{
              backgroundColor: item.category_color || '#6B7280',
            }}
          >
            {item.category_icon && (
              <span className="mr-1">{item.category_icon}</span>
            )}
            {item.category_name}
          </span>
        )}

        {/* Chevron */}
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </button>
  );
}

/**
 * Skeleton loading row for list view
 */
function ItemRowSkeleton() {
  return (
    <div
      className="flex items-center gap-3 p-3 bg-white"
      style={{ height: '72px' }}
    >
      {/* Thumbnail skeleton */}
      <div className="flex-shrink-0 w-[60px] h-[60px] rounded-lg bg-gray-200 animate-pulse" />

      {/* Text skeleton */}
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
      </div>

      {/* Badge and chevron skeleton */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" />
        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Empty state component for when there are no items (new user)
 */
function EmptyState({ onAddItem }: { onAddItem: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-10 h-10 text-teal-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        No items yet
      </h3>
      <p className="text-sm text-gray-500 text-center mb-6 max-w-xs">
        Start by adding your first item
      </p>
      <button
        onClick={onAddItem}
        className="px-6 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-full hover:bg-teal-700 transition-colors active:scale-95"
      >
        Add First Item
      </button>
    </div>
  );
}

/**
 * Filtered empty state component for when no items match filters
 */
function FilteredEmptyState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Filter icon with X overlay */}
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 relative">
        <svg
          className="w-10 h-10 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        {/* X badge overlay */}
        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-gray-500 rounded-full flex items-center justify-center">
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        No items match your filters
      </h3>
      <p className="text-sm text-gray-500 text-center mb-6 max-w-xs">
        Try adjusting your filter criteria or clear all filters to see your items
      </p>
      <button
        onClick={onClearFilters}
        className="px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-200 transition-colors active:scale-95"
      >
        Clear Filters
      </button>
    </div>
  );
}

/**
 * Loading spinner for pagination
 */
function LoadingMoreSpinner() {
  return (
    <div className="flex items-center justify-center py-4">
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

/**
 * End of list message
 */
function EndOfListMessage({ totalCount }: { totalCount: number }) {
  return (
    <div className="flex items-center justify-center py-6">
      <div className="flex items-center gap-2 text-gray-400">
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
            d="M5 13l4 4L19 7"
          />
        </svg>
        <span className="text-sm">
          You've seen all {totalCount} item{totalCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}

/**
 * Props for ItemList component
 */
interface ItemListProps {
  items: InventoryItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  totalCount?: number;
  onRefresh: () => void;
  onLoadMore?: () => void;
  error?: string | null;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  /** Whether selection mode is active */
  isSelectionMode?: boolean;
  /** Set of selected item IDs */
  selectedIds?: Set<string>;
  /** Callback when an item's selection is toggled */
  onToggleSelect?: (itemId: string) => void;
}

/**
 * List view for inventory items with infinite scroll
 */
export function ItemList({
  items,
  isLoading,
  isRefreshing,
  isLoadingMore = false,
  hasMore = true,
  totalCount = 0,
  onRefresh,
  onLoadMore,
  error,
  hasActiveFilters = false,
  onClearFilters,
  isSelectionMode = false,
  selectedIds,
  onToggleSelect,
}: ItemListProps) {
  const navigate = useNavigate();
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

  const handleItemClick = (itemId: string) => {
    navigate(`/item/${itemId}`);
  };

  const handleAddItem = () => {
    navigate('/add');
  };

  // Set up Intersection Observer for infinite scroll
  useEffect(() => {
    if (!onLoadMore || !hasMore || isLoading || isLoadingMore) {
      return;
    }

    const triggerElement = loadMoreTriggerRef.current;
    if (!triggerElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Trigger when element is within 200px of viewport
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      {
        // rootMargin adds 200px buffer before the element is visible
        rootMargin: '200px',
        threshold: 0,
      }
    );

    observer.observe(triggerElement);

    return () => {
      observer.disconnect();
    };
  }, [onLoadMore, hasMore, isLoading, isLoadingMore]);

  // Show loading skeletons on initial load
  if (isLoading && items.length === 0) {
    return (
      <div className="bg-white rounded-xl overflow-hidden divide-y divide-gray-100">
        {Array.from({ length: 6 }).map((_, index) => (
          <ItemRowSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Show error state
  if (error && items.length === 0) {
    return (
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
          Couldn't load your items
        </h3>
        <p className="text-sm text-gray-500 text-center mb-4">{error}</p>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Show filtered empty state (when filters active but no results)
  if (!isLoading && items.length === 0 && hasActiveFilters && onClearFilters) {
    return <FilteredEmptyState onClearFilters={onClearFilters} />;
  }

  // Show empty state (new user with no items)
  if (!isLoading && items.length === 0) {
    return <EmptyState onAddItem={handleAddItem} />;
  }

  return (
    <div className="relative">
      {/* Pull-to-refresh indicator */}
      {isRefreshing && (
        <div className="flex items-center justify-center py-3 mb-2">
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
          <span className="ml-2 text-sm text-gray-600">Refreshing...</span>
        </div>
      )}

      {/* Item list */}
      <div className="bg-white rounded-xl overflow-hidden divide-y divide-gray-100">
        {items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            onClick={() => handleItemClick(item.id)}
            isSelectionMode={isSelectionMode}
            isSelected={selectedIds?.has(item.id)}
            onToggleSelect={() => onToggleSelect?.(item.id)}
          />
        ))}
      </div>

      {/* Infinite scroll trigger and loading indicator */}
      {items.length > 0 && (
        <>
          {/* Invisible trigger element for Intersection Observer */}
          <div ref={loadMoreTriggerRef} className="h-px" />

          {/* Loading more spinner */}
          {isLoadingMore && <LoadingMoreSpinner />}

          {/* End of list message */}
          {!hasMore && !isLoadingMore && totalCount > 0 && (
            <EndOfListMessage totalCount={totalCount} />
          )}
        </>
      )}
    </div>
  );
}

// Also export sub-components for potential standalone use
export { ItemRow, ItemRowSkeleton, EmptyState as ListEmptyState, FilteredEmptyState as ListFilteredEmptyState };
