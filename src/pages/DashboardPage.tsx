/**
 * Dashboard Page - Home screen of the app (Ownly Style)
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useExpiringItems } from '@/hooks/useExpiringItems';
import { useRecentItems } from '@/hooks/useRecentItems';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/PullToRefreshIndicator';
import { Toast } from '@/components/Toast';
import { HeroSection } from '@/components/dashboard/HeroSection';
import { AgentSection } from '@/components/dashboard/AgentSection';

/**
 * Search bar component - clickable to navigate to search page
 */
function SearchBar({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-left"
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
      <span className="text-gray-500 text-sm">Search items, tags, locations...</span>
    </button>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  // const navigate = useNavigate(); // Removed unused
  const { stats, refetch: refetchStats } = useDashboardStats();
  const { refetch: refetchExpiring } = useExpiringItems(7, 3);
  const { items: recentItems, isLoading: recentLoading, refetch: refetchRecent } = useRecentItems(5);

  // Toast state for refresh feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    try {
      // Refresh all data in parallel
      await Promise.all([
        refetchStats(),
        refetchExpiring(),
        refetchRecent(),
      ]);
    } catch {
      setToast({ message: 'Refresh failed', type: 'error' });
    }
  }, [refetchStats, refetchExpiring, refetchRecent]);

  // Pull-to-refresh hook
  const {
    pullDistance,
    isPulling,
    isRefreshing,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    threshold,
  } = usePullToRefresh({ onRefresh: handleRefresh });

  return (
    <div
      className="min-h-full p-4 space-y-6 max-w-2xl mx-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        threshold={threshold}
        isPulling={isPulling}
        isRefreshing={isRefreshing}
      />

      {/* Search Bar */}
      <SearchBar onClick={() => navigate('/search')} />

      {/* Hero Section: View/Edit/Find my belongings */}
      <HeroSection
        recentItems={recentItems}
        isLoading={recentLoading}
        totalItems={stats.totalItems} // Fallback nicely inside component if loading
      />

      {/* Agent Section: Talk to the Ownly Agent! */}
      <AgentSection />

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
