/**
 * Item Detail Page
 *
 * Displays detailed view of a single inventory item.
 * Route: /item/:id
 *
 * Features (US-052):
 * - Header with back arrow, 'Item Details' title, overflow menu
 * - Full-width hero image (max 300px height)
 * - Tap photo opens full-screen viewer with pinch-to-zoom
 * - Updates last_viewed_at on page load (fire-and-forget)
 *
 * Features (US-053):
 * - Expiration banner below photo with color-coded status
 * - Primary info section with name, category badge, location, tags
 * - Category and location are tappable for filtering
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Item, Category, Location } from '@/types';

/**
 * Full item data with category and location info
 */
interface ItemDetails extends Omit<Item, 'category_id' | 'location_id'> {
  category: Pick<Category, 'id' | 'name' | 'icon' | 'color'> | null;
  location: Pick<Location, 'id' | 'name' | 'path' | 'icon'> | null;
}

/**
 * Back arrow icon
 */
function BackIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

/**
 * Overflow menu icon (three dots)
 */
function OverflowIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}

/**
 * Close icon for the photo viewer
 */
function CloseIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

/**
 * Warning icon for expiration banner
 */
function WarningIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

/**
 * Chevron right icon for location path
 */
function ChevronRightIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

/**
 * Calculate expiration status
 */
function getExpirationStatus(expirationDate: string): {
  type: 'expired' | 'warning' | 'caution' | 'ok';
  text: string;
  daysAway: number;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(expirationDate);
  expDate.setHours(0, 0, 0, 0);

  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    return {
      type: 'expired',
      text: daysAgo === 1 ? 'Expired 1 day ago' : `Expired ${daysAgo} days ago`,
      daysAway: diffDays,
    };
  } else if (diffDays === 0) {
    return {
      type: 'expired',
      text: 'Expires today',
      daysAway: 0,
    };
  } else if (diffDays <= 7) {
    return {
      type: 'warning',
      text: diffDays === 1 ? 'Expires in 1 day' : `Expires in ${diffDays} days`,
      daysAway: diffDays,
    };
  } else if (diffDays <= 30) {
    return {
      type: 'caution',
      text: `Expires in ${diffDays} days`,
      daysAway: diffDays,
    };
  }

  return {
    type: 'ok',
    text: `Expires in ${diffDays} days`,
    daysAway: diffDays,
  };
}

/**
 * Expiration banner component
 */
function ExpirationBanner({ expirationDate }: { expirationDate: string }) {
  const status = getExpirationStatus(expirationDate);

  // Only show banner for expired, warning (<=7 days), or caution (8-30 days)
  if (status.type === 'ok') {
    return null;
  }

  const bannerStyles = {
    expired: 'bg-red-50 border-red-200 text-red-700',
    warning: 'bg-red-50 border-red-200 text-red-700',
    caution: 'bg-orange-50 border-orange-200 text-orange-700',
    ok: '',
  };

  const iconStyles = {
    expired: 'text-red-500',
    warning: 'text-red-500',
    caution: 'text-orange-500',
    ok: '',
  };

  return (
    <div className={`flex items-center gap-2 px-4 py-3 border-b ${bannerStyles[status.type]}`}>
      <WarningIcon className={`flex-shrink-0 ${iconStyles[status.type]}`} />
      <span className="font-medium">{status.text}</span>
    </div>
  );
}

/**
 * Full-screen photo viewer with pinch-to-zoom
 */
function PhotoViewer({
  imageUrl,
  onClose,
}: {
  imageUrl: string;
  onClose: () => void;
}) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const lastTouchDistanceRef = useRef<number | null>(null);
  const lastTapRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle pinch to zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastTouchDistanceRef.current = distance;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistanceRef.current !== null) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = distance / lastTouchDistanceRef.current;
      setScale((prev) => Math.max(1, Math.min(5, prev * delta)));
      lastTouchDistanceRef.current = distance;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    lastTouchDistanceRef.current = null;
  }, []);

  // Handle double-tap to toggle zoom
  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < 300) {
      // Double tap - toggle between 1x and 2x
      if (scale > 1) {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      } else {
        setScale(2);
      }
    } else if (scale === 1) {
      // Single tap when not zoomed - close
      if ((e.target as HTMLElement).tagName !== 'BUTTON') {
        onClose();
      }
    }

    lastTapRef.current = now;
  }, [scale, onClose]);

  // Handle panning when zoomed
  const handleDrag = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && scale > 1) {
      // Simple panning logic
      const touch = e.touches[0];
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const x = ((touch.clientX - rect.left) / rect.width - 0.5) * (scale - 1) * -100;
        const y = ((touch.clientY - rect.top) / rect.height - 0.5) * (scale - 1) * -100;
        setPosition({ x, y });
      }
    }
  }, [scale]);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black flex flex-col"
      role="dialog"
      aria-label="Full screen photo viewer"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <button
          onClick={onClose}
          className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
          aria-label="Close photo viewer"
        >
          <CloseIcon />
        </button>
        {scale > 1 && (
          <span className="text-white/80 text-sm">
            {Math.round(scale * 100)}%
          </span>
        )}
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Image container */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center overflow-hidden touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={(e) => {
          handleTouchMove(e);
          handleDrag(e);
        }}
        onTouchEnd={handleTouchEnd}
        onClick={handleTap}
      >
        <img
          src={imageUrl}
          alt="Item photo full view"
          className="max-w-full max-h-full object-contain transition-transform duration-100"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}%, ${position.y / scale}%)`,
          }}
          draggable={false}
        />
      </div>

      {/* Helper text */}
      <div className="text-center text-white/60 text-sm py-4 bg-black/80">
        {scale === 1 ? 'Pinch to zoom • Double-tap to zoom in • Tap to close' : 'Double-tap to reset'}
      </div>
    </div>
  );
}

/**
 * Loading skeleton for the item detail page
 */
function ItemDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 pb-safe-area-pb">
      {/* Header skeleton */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
          <div className="w-24 h-6 rounded bg-gray-200 animate-pulse" />
          <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
        </div>
      </div>

      {/* Hero image skeleton */}
      <div className="w-full h-[300px] bg-gray-200 animate-pulse" />

      {/* Content skeleton */}
      <div className="p-4 space-y-4">
        <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse" />
        <div className="h-6 w-1/2 bg-gray-200 rounded animate-pulse" />
        <div className="h-20 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Error state component
 */
function ItemDetailError({
  message,
  onRetry,
  onBack,
}: {
  message: string;
  onRetry?: () => void;
  onBack: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Go back"
          >
            <BackIcon />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Item Details</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      {/* Error content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-gray-600 text-center mb-6">{message}</p>
        <div className="flex gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          )}
          <button
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Inventory
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Item Detail Page Component
 */
export function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState<ItemDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);
  const [isOverflowMenuOpen, setIsOverflowMenuOpen] = useState(false);
  const overflowMenuRef = useRef<HTMLDivElement>(null);

  // Fetch item details
  const fetchItem = useCallback(async () => {
    if (!id) {
      setError('Item ID is missing');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('items')
        .select(`
          *,
          category:categories (id, name, icon, color),
          location:locations (id, name, path, icon)
        `)
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No rows returned - item doesn't exist or is deleted
          setError('This item no longer exists');
        } else {
          throw fetchError;
        }
        return;
      }

      // Check if the item belongs to the current user
      if (data.user_id !== user?.id) {
        setError('You do not have permission to view this item');
        return;
      }

      setItem(data as unknown as ItemDetails);
    } catch (err) {
      console.error('Error fetching item:', err);
      setError("Couldn't load item details");
    } finally {
      setIsLoading(false);
    }
  }, [id, user?.id]);

  // Update last_viewed_at on page load (fire-and-forget)
  useEffect(() => {
    if (!id || !user?.id) return;

    // Fire and forget - don't await
    supabase
      .from('items')
      .update({ last_viewed_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .then(({ error }) => {
        if (error) {
          console.error('Error updating last_viewed_at:', error);
        }
      });
  }, [id, user?.id]);

  // Fetch item on mount
  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  // Close overflow menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overflowMenuRef.current && !overflowMenuRef.current.contains(e.target as Node)) {
        setIsOverflowMenuOpen(false);
      }
    };

    if (isOverflowMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOverflowMenuOpen]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/inventory');
    }
  }, [navigate]);

  // Loading state
  if (isLoading) {
    return <ItemDetailSkeleton />;
  }

  // Error state
  if (error || !item) {
    return (
      <ItemDetailError
        message={error || 'Item not found'}
        onRetry={error === "Couldn't load item details" ? fetchItem : undefined}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-safe-area-pb">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Back button */}
          <button
            onClick={handleBack}
            className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Go back"
          >
            <BackIcon />
          </button>

          {/* Title */}
          <h1 className="text-lg font-semibold text-gray-900">Item Details</h1>

          {/* Overflow menu */}
          <div className="relative" ref={overflowMenuRef}>
            <button
              onClick={() => setIsOverflowMenuOpen(!isOverflowMenuOpen)}
              className="p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="More options"
              aria-expanded={isOverflowMenuOpen}
            >
              <OverflowIcon />
            </button>

            {/* Dropdown menu (placeholder - to be implemented in US-056) */}
            {isOverflowMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                <button
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    setIsOverflowMenuOpen(false);
                    // Share functionality to be implemented in US-056
                  }}
                >
                  Share
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    setIsOverflowMenuOpen(false);
                    // Favorite toggle to be implemented in US-056
                  }}
                >
                  {item.is_favorite ? 'Remove from Favorites' : 'Add to Favorites'}
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    setIsOverflowMenuOpen(false);
                    // Keep forever toggle to be implemented in US-056
                  }}
                >
                  {item.keep_forever ? 'Unmark as Keep Forever' : 'Mark as Keep Forever'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hero Image */}
      <div className="relative">
        <button
          onClick={() => setIsPhotoViewerOpen(true)}
          className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="View full size photo"
        >
          <img
            src={item.photo_url}
            alt={item.name || 'Item photo'}
            className="w-full max-h-[300px] object-contain bg-gray-100"
          />
        </button>
      </div>

      {/* Expiration Banner (US-053) */}
      {item.expiration_date && (
        <ExpirationBanner expirationDate={item.expiration_date} />
      )}

      {/* Primary Info Section (US-053) */}
      <div className="p-4">
        {/* Item name - large */}
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          {item.name || 'Unnamed Item'}
        </h2>

        {/* Category badge - tappable */}
        {item.category && (
          <button
            onClick={() => navigate(`/inventory?categories=${item.category!.id}`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium mb-3 transition-opacity hover:opacity-80 active:opacity-60"
            style={{ backgroundColor: `${item.category.color}20`, color: item.category.color }}
            aria-label={`Filter by category: ${item.category.name}`}
          >
            <span>{item.category.icon}</span>
            <span>{item.category.name}</span>
            <ChevronRightIcon className="w-3 h-3 ml-0.5" />
          </button>
        )}

        {/* Location path - tappable */}
        {item.location && (
          <button
            onClick={() => navigate(`/inventory?location=${item.location!.id}`)}
            className="flex items-center gap-2 text-gray-600 mb-4 hover:text-blue-600 transition-colors group"
            aria-label={`Filter by location: ${item.location.path}`}
          >
            <span className="flex-shrink-0">{item.location.icon}</span>
            <span className="group-hover:underline">{item.location.path}</span>
            <ChevronRightIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}

        {/* Tags row - horizontal scroll */}
        {item.tags && item.tags.length > 0 && (
          <div className="mb-4 -mx-4 px-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {item.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full whitespace-nowrap flex-shrink-0"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Placeholder for additional details from US-054, US-055 */}
        <div className="mt-6 p-4 bg-gray-100 rounded-lg text-gray-500 text-sm text-center">
          Additional details and action buttons will be implemented in US-054, US-055.
        </div>
      </div>

      {/* Full-screen photo viewer */}
      {isPhotoViewerOpen && (
        <PhotoViewer
          imageUrl={item.photo_url}
          onClose={() => setIsPhotoViewerOpen(false)}
        />
      )}
    </div>
  );
}
