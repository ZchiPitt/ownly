# US-MKT-005: Marketplace Browse Page

**Description:** As a buyer, I want to browse items listed by the community so I can find things I want to purchase.

## Acceptance Criteria

1. Create new page `/marketplace` with route in App.tsx
2. Display active listings in responsive grid (2 cols mobile, 3-4 cols desktop)
3. Each listing card shows: photo, item name, price (or 'Free'), condition badge, seller display_name, location_city
4. Filter button opens FilterBottomSheet with: category (multi-select), price range (min-max), condition (multi-select), price type (all/free only)
5. Sort dropdown: Newest, Price Low-High, Price High-Low
6. Search bar at top for text search in listing name/description
7. Pull-to-refresh updates listings
8. Infinite scroll pagination (20 items per page)
9. Empty state: 'No listings found' with clear filters button
10. Exclude user's own listings from browse view
11. npm run build passes

## Technical Details

**Files to Create/Modify:**

### 1. MarketplacePage.tsx
`src/pages/MarketplacePage.tsx`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { useMarketplace } from '@/hooks/useMarketplace';
import { MarketplaceCard } from '@/components/MarketplaceCard';
import { MarketplaceFilterSheet } from '@/components/MarketplaceFilterSheet';

interface MarketplaceFilters {
  categories: string[];
  conditions: string[];
  priceType: 'all' | 'free';
  minPrice: number | null;
  maxPrice: number | null;
  search: string;
}

type SortOption = 'newest' | 'price_asc' | 'price_desc';

export function MarketplacePage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<MarketplaceFilters>({...});
  const [sort, setSort] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);
  // ...
}
```

### 2. MarketplaceCard.tsx
`src/components/MarketplaceCard.tsx`

Card displaying:
- Item photo (square, 1:1 aspect ratio)
- Item name (truncate if long)
- Price or "Free" badge
- Condition badge (small, colored)
- Seller name + location

```typescript
interface MarketplaceCardProps {
  listing: MarketplaceListing;
  onClick: () => void;
}
```

### 3. useMarketplace.ts Hook
`src/hooks/useMarketplace.ts`

```typescript
export interface MarketplaceListing {
  id: string;
  item_id: string;
  price: number | null;
  price_type: 'fixed' | 'negotiable' | 'free';
  condition: string;
  description: string | null;
  created_at: string;
  item: {
    id: string;
    name: string | null;
    photo_url: string;
    thumbnail_url: string | null;
  };
  seller: {
    id: string;
    display_name: string | null;
    location_city: string | null;
    seller_rating: number | null;
  };
}

export function useMarketplace() {
  async function getListings(options: {
    filters?: MarketplaceFilters;
    sort?: SortOption;
    page?: number;
    pageSize?: number;
    excludeUserId?: string;
  }): Promise<{ listings: MarketplaceListing[]; hasMore: boolean }>;
  
  return { getListings, ... };
}
```

### 4. MarketplaceFilterSheet.tsx
`src/components/MarketplaceFilterSheet.tsx`

Bottom sheet with filter options:
- Category checkboxes
- Condition checkboxes
- Price type toggle (All / Free Only)
- Price range inputs
- Apply / Clear buttons

### 5. Update App.tsx
Add route:
```tsx
<Route path="/marketplace" element={<ProtectedRoute><MarketplacePage /></ProtectedRoute>} />
```

### 6. Update src/pages/index.ts
Export MarketplacePage

## Card Design

```
┌─────────────────┐
│    [Photo]      │
│    1:1 ratio    │
├─────────────────┤
│ Item Name       │
│ $25 · Good      │
│ 👤 John · NYC   │
└─────────────────┘
```

## Database Query

```typescript
const { data, error } = await supabase
  .from('listings')
  .select(`
    id, price, price_type, condition, description, created_at,
    item:items!inner(id, name, photo_url, thumbnail_url),
    seller:profiles!inner(id, display_name, location_city, seller_rating)
  `)
  .eq('status', 'active')
  .neq('seller_id', excludeUserId)  // Exclude own listings
  .order(sortColumn, { ascending: sortAsc })
  .range(offset, offset + pageSize - 1);
```

## Instructions

1. Create `src/hooks/useMarketplace.ts` with getListings function
2. Create `src/components/MarketplaceCard.tsx` for listing cards
3. Create `src/components/MarketplaceFilterSheet.tsx` for filters
4. Create `src/pages/MarketplacePage.tsx` with grid, search, filters, sort
5. Update `src/pages/index.ts` to export MarketplacePage
6. Add route in `src/App.tsx`
7. Run `npm run build` to verify
8. Commit with: `feat: [US-MKT-005] Add marketplace browse page`
9. Append progress to `scripts/ralph-fixes/progress.txt`

When ALL acceptance criteria are met and build passes, reply with:
<promise>COMPLETE</promise>
