/**
 * Dashboard Page - Home screen of the app
 * Shows time-based greeting, search bar, quick stats, and quick access to inventory
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats } from '@/hooks/useDashboardStats';

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

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats, isLoading } = useDashboardStats();

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

        {/* Search bar */}
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

      {/* Main content */}
      <div className="p-4 space-y-6">
        {/* Quick Stats - Horizontal scrollable cards */}
        <section>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {isLoading ? (
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

        {/* Recent Items Section - Placeholder */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Recent Items</h2>
            <button
              onClick={() => navigate('/inventory')}
              className="text-sm text-blue-600 font-medium hover:text-blue-700"
            >
              See all
            </button>
          </div>

          {/* Empty state or placeholder */}
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
    </div>
  );
}
