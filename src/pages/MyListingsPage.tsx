/**
 * MyListingsPage - Manage seller marketplace listings
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EditListingModal } from '@/components/EditListingModal';
import { PullToRefreshIndicator } from '@/components/PullToRefreshIndicator';
import { useListings, type ListingWithItem } from '@/hooks/useListings';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useToast } from '@/hooks/useToast';
import type { ListingStatus } from '@/types/database';

type ListingTab = 'all' | 'active' | 'sold' | 'removed';

const tabs: Array<{ id: ListingTab; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'sold', label: 'Sold' },
  { id: 'removed', label: 'Removed' },
];

const statusStyles: Record<ListingStatus, { label: string; badge: string; dot: string }> = {
  active: {
    label: 'Active',
    badge: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  sold: {
    label: 'Sold',
    badge: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
  },
  removed: {
    label: 'Removed',
    badge: 'bg-gray-100 text-gray-600',
    dot: 'bg-gray-400',
  },
  reserved: {
    label: 'Reserved',
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
  },
};

const statusFilters: Record<ListingTab, ListingStatus | undefined> = {
  all: undefined,
  active: 'active',
  sold: 'sold',
  removed: 'removed',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatPrice(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return 'Price not set';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

function getListingPriceLabel(listing: ListingWithItem): string {
  if (listing.price_type === 'free') {
    return 'Free';
  }

  const priceLabel = formatPrice(listing.price);
  if (listing.price_type === 'negotiable') {
    return `${priceLabel} · Negotiable`;
  }

  return priceLabel;
}

function BackIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function EyeIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function CalendarIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function MyListingsPage() {
  const navigate = useNavigate();
  const { getMyListings } = useListings();
  const { error } = useToast();
  const [activeTab, setActiveTab] = useState<ListingTab>('all');
  const [listings, setListings] = useState<ListingWithItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<ListingWithItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const loadListings = useCallback(async (options?: { refresh?: boolean }) => {
    if (!options?.refresh) {
      setIsLoading(true);
    }

    try {
      const data = await getMyListings(statusFilters[activeTab]);
      setListings(data);
    } catch (err) {
      console.error('Error loading listings:', err);
      error('Failed to load listings');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, error, getMyListings]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const handleRefresh = useCallback(async () => {
    await loadListings({ refresh: true });
  }, [loadListings]);

  const {
    pullDistance,
    isPulling,
    isRefreshing: isPullRefreshing,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    threshold: pullThreshold,
  } = usePullToRefresh({ onRefresh: handleRefresh });

  const emptyState = useMemo(() => {
    if (activeTab !== 'all') {
      const label = tabs.find((tab) => tab.id === activeTab)?.label ?? 'Active';
      return `No ${label.toLowerCase()} listings yet.`;
    }
    return 'No listings yet. List your first item!';
  }, [activeTab]);

  const handleCardClick = (listing: ListingWithItem) => {
    setSelectedListing(listing);
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setSelectedListing(null);
  };

  return (
    <div className="min-h-full bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2 px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex-shrink-0 w-10 h-10 -ml-2 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
            aria-label="Go back"
          >
            <BackIcon />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-4 pb-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List content with pull-to-refresh */}
      <div
        className="overflow-y-auto relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <PullToRefreshIndicator
          pullDistance={pullDistance}
          threshold={pullThreshold}
          isPulling={isPulling}
          isRefreshing={isPullRefreshing}
        />

        <div className="p-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`listing-skeleton-${index}`}
                  className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-8 text-center">
              <p className="text-gray-600 font-medium mb-2">{emptyState}</p>
              {activeTab === 'all' && (
                <Link
                  to="/inventory"
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Go to inventory
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map((listing) => {
                const statusStyle = statusStyles[listing.status];
                return (
                  <button
                    key={listing.id}
                    type="button"
                    onClick={() => handleCardClick(listing)}
                    className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={listing.item.thumbnail_url || listing.item.photo_url}
                        alt={listing.item.name || 'Listing item'}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-base font-semibold text-gray-900 truncate">
                              {listing.item.name || 'Untitled item'}
                            </p>
                            <p className="text-sm text-gray-600 mt-0.5">
                              {getListingPriceLabel(listing)}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle.badge}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                            {statusStyle.label}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <EyeIcon />
                            {listing.view_count}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <CalendarIcon />
                            {formatDate(listing.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <EditListingModal
        isOpen={showEditModal}
        listing={selectedListing}
        onClose={handleCloseModal}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
