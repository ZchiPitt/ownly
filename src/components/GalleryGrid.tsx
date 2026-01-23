/**
 * Gallery Grid Component - 2-column grid view for inventory items
 * Displays items as cards with thumbnails, names, and category badges
 */

import { useNavigate } from 'react-router-dom';
import type { InventoryItem } from '@/hooks/useInventoryItems';

/**
 * Props for ItemCard component
 */
interface ItemCardProps {
  item: InventoryItem;
  onClick?: () => void;
}

/**
 * Individual item card for gallery view
 */
function ItemCard({ item, onClick }: ItemCardProps) {
  const imageUrl = item.thumbnail_url || item.photo_url;
  const displayName = item.name || 'Untitled Item';

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 transition-transform active:scale-[0.98]"
    >
      {/* Thumbnail container - 1:1 aspect ratio */}
      <div className="relative w-full aspect-square bg-gray-100">
        <img
          src={imageUrl}
          alt={displayName}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Category badge overlay */}
        {item.category_name && (
          <div
            className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium text-white shadow-sm backdrop-blur-sm"
            style={{
              backgroundColor: item.category_color
                ? `${item.category_color}dd`
                : 'rgba(75, 85, 99, 0.9)',
            }}
          >
            {item.category_icon && (
              <span className="mr-1">{item.category_icon}</span>
            )}
            {item.category_name}
          </div>
        )}

        {/* Favorite indicator */}
        {item.is_favorite && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center shadow-sm">
            <svg
              className="w-4 h-4 text-red-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        )}

        {/* Quantity badge (if > 1) */}
        {item.quantity > 1 && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/70 rounded text-xs font-medium text-white">
            ×{item.quantity}
          </div>
        )}
      </div>

      {/* Item info */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
          {displayName}
        </h3>

        {/* Location name (if available) */}
        {item.location_name && (
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <svg
              className="w-3 h-3 flex-shrink-0"
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
            <span className="truncate">{item.location_name}</span>
          </p>
        )}
      </div>
    </button>
  );
}

/**
 * Skeleton loading card for gallery view
 */
function ItemCardSkeleton() {
  return (
    <div className="w-full bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
      {/* Thumbnail skeleton */}
      <div className="w-full aspect-square bg-gray-200 animate-pulse" />

      {/* Info skeleton */}
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}

/**
 * Empty state component for when there are no items
 */
function EmptyState({ onAddItem }: { onAddItem: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-10 h-10 text-blue-500"
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
        Start building your inventory by adding your first item
      </p>
      <button
        onClick={onAddItem}
        className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-colors active:scale-95"
      >
        Add Your First Item
      </button>
    </div>
  );
}

/**
 * Props for GalleryGrid component
 */
interface GalleryGridProps {
  items: InventoryItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  error?: string | null;
}

/**
 * Gallery grid view for inventory items
 */
export function GalleryGrid({
  items,
  isLoading,
  isRefreshing,
  onRefresh,
  error,
}: GalleryGridProps) {
  const navigate = useNavigate();

  const handleItemClick = (itemId: string) => {
    navigate(`/item/${itemId}`);
  };

  const handleAddItem = () => {
    navigate('/add');
  };

  // Show loading skeletons on initial load
  if (isLoading && items.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <ItemCardSkeleton key={index} />
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
          Failed to load items
        </h3>
        <p className="text-sm text-gray-500 text-center mb-4">
          {error}
        </p>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Show empty state
  if (!isLoading && items.length === 0) {
    return <EmptyState onAddItem={handleAddItem} />;
  }

  return (
    <div className="relative">
      {/* Pull-to-refresh indicator */}
      {isRefreshing && (
        <div className="flex items-center justify-center py-3 mb-2">
          <svg
            className="w-5 h-5 text-blue-600 animate-spin"
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

      {/* Item grid */}
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            onClick={() => handleItemClick(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

// Also export sub-components for potential standalone use
export { ItemCard, ItemCardSkeleton, EmptyState };
