/**
 * Marketplace listing card
 */

import type { MarketplaceListing } from '@/hooks/useMarketplace';

interface MarketplaceCardProps {
  listing: MarketplaceListing;
  onClick: () => void;
}

const conditionLabels: Record<string, string> = {
  new: 'New',
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
};

const conditionStyles: Record<string, string> = {
  new: 'bg-emerald-50 text-emerald-700',
  like_new: 'bg-teal-50 text-teal-700',
  good: 'bg-blue-50 text-blue-700',
  fair: 'bg-amber-50 text-amber-700',
  poor: 'bg-rose-50 text-rose-700',
};

function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return 'Free';

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return formatter.format(price);
}

export function MarketplaceCard({ listing, onClick }: MarketplaceCardProps) {
  const imageUrl = listing.item.thumbnail_url || listing.item.photo_url;
  const displayName = listing.item.name || 'Untitled Item';
  const sellerName = listing.seller.display_name || 'Unknown seller';
  const locationCity = listing.seller.location_city;
  const isFree = listing.price_type === 'free' || listing.price === null;
  const conditionLabel = conditionLabels[listing.condition] || listing.condition;
  const conditionStyle = conditionStyles[listing.condition] || 'bg-gray-100 text-gray-600';

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
    >
      <div className="relative w-full aspect-square bg-gray-100">
        <img
          src={imageUrl}
          alt={displayName}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {isFree && (
          <span className="absolute top-3 left-3 inline-flex items-center px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-semibold uppercase tracking-wide rounded-md">
            Free
          </span>
        )}
      </div>

      <div className="p-3">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 mb-1.5">
          {displayName}
        </h3>

        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-sm font-semibold text-teal-600">
            {isFree ? 'Free' : formatPrice(listing.price)}
          </span>
          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${conditionStyle}`}
          >
            {conditionLabel}
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span>👤 {sellerName}</span>
          {locationCity && <span className="text-gray-300">·</span>}
          {locationCity && <span className="uppercase tracking-wide">{locationCity}</span>}
        </div>
      </div>
    </button>
  );
}

export function MarketplaceCardSkeleton() {
  return (
    <div className="w-full bg-white rounded-2xl overflow-hidden shadow-sm">
      <div className="w-full aspect-square bg-gray-200 animate-pulse" />
      <div className="p-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mb-2" />
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
          <div className="h-4 bg-gray-200 rounded-full animate-pulse w-14" />
        </div>
        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}
