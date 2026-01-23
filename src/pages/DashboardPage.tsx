/**
 * Dashboard Page - Home screen of the app
 * Shows time-based greeting, search bar, quick stats, and quick access to inventory
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useExpiringItems, type ExpiringItem } from '@/hooks/useExpiringItems';
import { useRecentItems, type RecentItem } from '@/hooks/useRecentItems';

/**
 * Get time-based greeting message
 */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) {
    return 'Good morning';
  } else if (hour < 18) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
}

/**
 * Get user's display name from email or profile
 */
function getDisplayName(email: string | undefined): string {
  if (!email) return 'there';
  // Extract name from email (before @)
  const localPart = email.split('@')[0];
  // Capitalize first letter
  return localPart.charAt(0).toUpperCase() + localPart.slice(1);
}

/**
 * Get user initials for avatar
 */
function getInitials(email: string | undefined): string {
  if (!email) return '?';
  const localPart = email.split('@')[0];
  // Get first two characters, uppercase
  return localPart.slice(0, 2).toUpperCase();
}

/**
 * Skeleton component for stat card loading state
 */
function StatCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-28 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className="flex flex-col items-center">
        {/* Icon skeleton */}
        <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse mb-2" />
        {/* Label skeleton */}
        <div className="w-12 h-3 bg-gray-200 rounded animate-pulse mb-2" />
        {/* Count skeleton */}
        <div className="w-8 h-6 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Stat card component
 */
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: string;
  bgColor: string;
  onClick: () => void;
}

function StatCard({ icon, label, count, color, bgColor, onClick }: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-28 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow active:scale-95"
    >
      <div className="flex flex-col items-center">
        {/* Icon container */}
        <div
          className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center mb-2`}
        >
          <span className={color}>{icon}</span>
        </div>
        {/* Label */}
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        {/* Count */}
        <p className="text-xl font-semibold text-gray-900">{count}</p>
      </div>
    </button>
  );
}

/**
 * Skeleton component for expiring item card loading state
 */
function ExpiringItemCardSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
      {/* Thumbnail skeleton */}
      <div className="w-14 h-14 rounded-lg bg-gray-200 animate-pulse flex-shrink-0" />
      {/* Content skeleton */}
      <div className="flex-1 min-w-0">
        <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="w-20 h-3 bg-gray-200 rounded animate-pulse" />
      </div>
      {/* Badge skeleton */}
      <div className="w-12 h-6 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
    </div>
  );
}

/**
 * Expiring item card component
 */
interface ExpiringItemCardProps {
  item: ExpiringItem;
  onClick: () => void;
}

function ExpiringItemCard({ item, onClick }: ExpiringItemCardProps) {
  // Badge color based on days remaining
  // Red for <=3 days, orange for 4-7 days
  const getBadgeClasses = () => {
    if (item.daysRemaining <= 0) {
      return 'bg-red-100 text-red-700';
    } else if (item.daysRemaining <= 3) {
      return 'bg-red-100 text-red-700';
    } else {
      return 'bg-amber-100 text-amber-700';
    }
  };

  // Badge text
  const getBadgeText = () => {
    if (item.daysRemaining <= 0) {
      const daysAgo = Math.abs(item.daysRemaining);
      return daysAgo === 0 ? 'Today' : `${daysAgo}d ago`;
    } else if (item.daysRemaining === 1) {
      return '1 day';
    } else {
      return `${item.daysRemaining}d`;
    }
  };

  // Format expiration date
  const formatExpirationDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow active:scale-[0.98]"
    >
      {/* Thumbnail */}
      <div className="w-14 h-14 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
        {item.thumbnail_url || item.photo_url ? (
          <img
            src={item.thumbnail_url || item.photo_url}
            alt={item.name || 'Item'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-medium text-gray-900 truncate">
          {item.name || 'Unnamed item'}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          Expires {formatExpirationDate(item.expiration_date)}
        </p>
      </div>

      {/* Days remaining badge */}
      <div
        className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium ${getBadgeClasses()}`}
      >
        {getBadgeText()}
      </div>
    </button>
  );
}

/**
 * Skeleton component for recent item card loading state
 */
function RecentItemCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-36">
      {/* Thumbnail skeleton */}
      <div className="w-full aspect-square rounded-xl bg-gray-200 animate-pulse mb-2" />
      {/* Name skeleton */}
      <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-1" />
      {/* Category skeleton */}
      <div className="w-16 h-3 bg-gray-200 rounded animate-pulse mb-1" />
      {/* Time skeleton */}
      <div className="w-12 h-3 bg-gray-200 rounded animate-pulse" />
    </div>
  );
}

/**
 * Get relative time string from date
 */
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return 'Just now';
  } else if (diffMins < 60) {
    return diffMins === 1 ? '1 minute ago' : `${diffMins} minutes ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}

/**
 * Recent item card component
 */
interface RecentItemCardProps {
  item: RecentItem;
  onClick: () => void;
}

function RecentItemCard({ item, onClick }: RecentItemCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-36 text-left active:scale-95 transition-transform"
    >
      {/* Thumbnail - 80x80 but using aspect-ratio for responsive sizing */}
      <div className="w-full aspect-square rounded-xl bg-gray-100 overflow-hidden mb-2 relative">
        {item.thumbnail_url || item.photo_url ? (
          <img
            src={item.thumbnail_url || item.photo_url}
            alt={item.name || 'Item'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
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
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Category badge overlay */}
        {item.category_name && (
          <div className="absolute bottom-1.5 right-1.5">
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white shadow-sm"
              style={{
                backgroundColor: item.category_color || '#6b7280',
              }}
            >
              {item.category_name}
            </span>
          </div>
        )}
      </div>

      {/* Name - max 2 lines */}
      <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight mb-0.5">
        {item.name || 'Unnamed item'}
      </p>

      {/* Relative time */}
      <p className="text-xs text-gray-500">{getRelativeTime(item.created_at)}</p>
    </button>
  );
}

/**
 * Empty state component for new users with 0 items
 */
interface EmptyStateProps {
  onAddItem: () => void;
}

function EmptyState({ onAddItem }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      {/* Illustration - Box icon */}
      <div className="w-24 h-24 mb-6 bg-blue-50 rounded-full flex items-center justify-center">
        <svg
          className="w-12 h-12 text-blue-500"
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

      {/* Heading */}
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Your inventory is empty
      </h2>

      {/* Subtext */}
      <p className="text-gray-500 mb-6 max-w-xs">
        Take a photo of your first item to get started
      </p>

      {/* Primary button */}
      <button
        onClick={onAddItem}
        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors active:scale-95"
      >
        Add Your First Item
      </button>
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats, isLoading: statsLoading } = useDashboardStats();
  const { items: expiringItems, isLoading: expiringLoading } = useExpiringItems(7, 3);
  const { items: recentItems, isLoading: recentLoading } = useRecentItems(5);

  const greeting = useMemo(() => getGreeting(), []);
  const displayName = useMemo(
    () => getDisplayName(user?.email),
    [user?.email]
  );
  const initials = useMemo(
    () => getInitials(user?.email),
    [user?.email]
  );

  const handleSearchClick = () => {
    navigate('/search');
  };

  const handleAddItem = () => {
    navigate('/add');
  };

  // Determine if user has no items (empty state)
  // Show empty state when stats have loaded and totalItems is 0
  const isEmptyInventory = !statsLoading && stats.totalItems === 0;

  return (
    <div className="min-h-full bg-gray-50">
      {/* Header with greeting and avatar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 pt-4 pb-3">
        {/* Greeting row */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-500">{greeting},</p>
            <h1 className="text-xl font-semibold text-gray-900">{displayName}</h1>
          </div>

          {/* User avatar */}
          <button
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm hover:bg-blue-700 transition-colors"
            aria-label="Go to settings"
          >
            {initials}
          </button>
        </div>

        {/* Search bar - always visible */}
        <button
          onClick={handleSearchClick}
          className="w-full flex items-center gap-3 px-4 py-3 bg-gray-100 rounded-xl text-left hover:bg-gray-200 transition-colors"
          aria-label="Search items"
        >
          {/* Search icon */}
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <span className="text-gray-500">Search your items...</span>
        </button>
      </div>

      {/* Main content - Empty state or regular content */}
      {isEmptyInventory ? (
        <EmptyState onAddItem={handleAddItem} />
      ) : (
      <div className="p-4 space-y-6">
        {/* Quick Stats - Horizontal scrollable cards */}
        <section>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {statsLoading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                {/* Total Items */}
                <StatCard
                  icon={
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
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  }
                  label="Items"
                  count={stats.totalItems}
                  color="text-blue-600"
                  bgColor="bg-blue-100"
                  onClick={() => navigate('/inventory')}
                />

                {/* Total Locations */}
                <StatCard
                  icon={
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
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  }
                  label="Locations"
                  count={stats.totalLocations}
                  color="text-emerald-600"
                  bgColor="bg-emerald-100"
                  onClick={() => navigate('/inventory?view=locations')}
                />

                {/* Expiring Items */}
                <StatCard
                  icon={
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
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  }
                  label="Expiring"
                  count={stats.expiringItems}
                  color="text-amber-600"
                  bgColor="bg-amber-100"
                  onClick={() => navigate('/inventory?filter=expiring')}
                />
              </>
            )}
          </div>
        </section>

        {/* Expiring Soon Section - Hidden if no expiring items */}
        {(expiringLoading || expiringItems.length > 0) && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {/* Warning icon */}
                <svg
                  className="w-5 h-5 text-amber-500"
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
                <h2 className="text-lg font-semibold text-gray-900">Expiring Soon</h2>
              </div>
              <button
                onClick={() => navigate('/inventory?filter=expiring')}
                className="text-sm text-blue-600 font-medium hover:text-blue-700"
              >
                See All
              </button>
            </div>

            {/* Expiring items list */}
            <div className="space-y-2">
              {expiringLoading ? (
                <>
                  <ExpiringItemCardSkeleton />
                  <ExpiringItemCardSkeleton />
                  <ExpiringItemCardSkeleton />
                </>
              ) : (
                expiringItems.map((item) => (
                  <ExpiringItemCard
                    key={item.id}
                    item={item}
                    onClick={() => navigate(`/item/${item.id}`)}
                  />
                ))
              )}
            </div>
          </section>
        )}

        {/* Recently Added Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {/* Clock icon */}
              <svg
                className="w-5 h-5 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">Recently Added</h2>
            </div>
            <button
              onClick={() => navigate('/inventory?sort=newest')}
              className="text-sm text-blue-600 font-medium hover:text-blue-700"
            >
              See All
            </button>
          </div>

          {/* Recent items horizontal scroll */}
          {recentLoading ? (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              <RecentItemCardSkeleton />
              <RecentItemCardSkeleton />
              <RecentItemCardSkeleton />
              <RecentItemCardSkeleton />
              <RecentItemCardSkeleton />
            </div>
          ) : recentItems.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {recentItems.map((item) => (
                <RecentItemCard
                  key={item.id}
                  item={item}
                  onClick={() => navigate(`/item/${item.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">No items yet</p>
              <button
                onClick={() => navigate('/add')}
                className="mt-3 text-sm text-blue-600 font-medium hover:text-blue-700"
              >
                Add your first item
              </button>
            </div>
          )}
        </section>

        {/* Categories Section - Placeholder */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
            <button
              onClick={() => navigate('/inventory?view=categories')}
              className="text-sm text-blue-600 font-medium hover:text-blue-700"
            >
              Browse
            </button>
          </div>

          {/* Category pills placeholder */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {/* Will be populated with actual categories */}
            <div className="flex-shrink-0 px-4 py-2 bg-gray-100 rounded-full text-gray-400 text-sm">
              Loading categories...
            </div>
          </div>
        </section>

        {/* Locations Section - Placeholder */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Locations</h2>
            <button
              onClick={() => navigate('/inventory?view=locations')}
              className="text-sm text-blue-600 font-medium hover:text-blue-700"
            >
              Manage
            </button>
          </div>

          {/* Locations grid placeholder */}
          <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
            <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-gray-400"
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
            </div>
            <p className="text-gray-500 text-sm">No locations set up</p>
            <button
              onClick={() => navigate('/settings/locations')}
              className="mt-3 text-sm text-blue-600 font-medium hover:text-blue-700"
            >
              Add a location
            </button>
          </div>
        </section>
      </div>
      )}
    </div>
  );
}
