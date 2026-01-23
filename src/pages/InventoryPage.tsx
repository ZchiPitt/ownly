/**
 * Inventory Page - Browse all user items
 * Shows inventory with header, search icon, view toggle, item count, and FAB
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useUserSettings } from '@/hooks/useUserSettings';

// View mode type
type ViewMode = 'gallery' | 'list';

/**
 * Hook for fetching inventory item count
 */
function useItemCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCount = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { count: itemCount, error: fetchError } = await supabase
        .from('items')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('deleted_at', null);

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setCount(itemCount ?? 0);
    } catch (err) {
      console.error('Error fetching item count:', err);
      setError(err instanceof Error ? err.message : 'Failed to load item count');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  return { count, isLoading, error, refetch: fetchCount };
}

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
  const { count, isLoading: countLoading } = useItemCount();
  const { settings, isLoading: settingsLoading, updateSettings } = useUserSettings();

  // Track if user has explicitly changed the view (to avoid overriding with settings)
  const [userSelectedView, setUserSelectedView] = useState<ViewMode | null>(null);
  const [isUpdatingView, setIsUpdatingView] = useState(false);

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

  return (
    <div className="min-h-full bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Title and count */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Inventory</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {countLoading ? (
                <span className="inline-block w-16 h-4 bg-gray-200 rounded animate-pulse" />
              ) : (
                `${count} item${count !== 1 ? 's' : ''}`
              )}
            </p>
          </div>

          {/* Right side: View toggle + Search */}
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <ViewToggle
              viewMode={viewMode}
              onViewChange={handleViewChange}
              isLoading={settingsLoading || isUpdatingView}
            />

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
      </div>

      {/* Main content area - placeholder for inventory list/grid */}
      <div className="p-4">
        {/* Placeholder content - shows current view mode */}
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            {viewMode === 'gallery' ? (
              <GridIcon filled />
            ) : (
              <ListIcon filled />
            )}
          </div>
          <p className="text-gray-500">
            {viewMode === 'gallery' ? 'Gallery' : 'List'} view coming soon...
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Selected view: {viewMode}
          </p>
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
    </div>
  );
}
