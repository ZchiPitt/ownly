# US-MKT-004: My Listings Management Page

**Description:** As a seller, I want to manage my listings so I can update prices, mark items as sold, or remove listings.

## Acceptance Criteria

1. Create new page `/my-listings` with route in App.tsx
2. Page accessible from Settings page (add link)
3. Display all user's listings in a list view
4. Each listing card shows: item photo, item name, price, status badge, view count, created date
5. Status tabs/filter at top: All, Active, Sold, Removed
6. Tap listing opens edit modal with: price, price_type, condition, description
7. Edit modal has actions: Save Changes, Mark as Sold, Remove Listing
8. Mark as Sold: sets status='sold', shows success toast
9. Remove Listing: sets status='removed', shows success toast
10. Empty state: 'No listings yet. List your first item!' with link to inventory
11. Pull-to-refresh to reload listings
12. npm run build passes

## Technical Details

**Files to Create:**

### 1. MyListingsPage.tsx
`src/pages/MyListingsPage.tsx`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { useListings, ListingWithItem } from '@/hooks/useListings';
import { useToast } from '@/hooks/useToast';
import { EditListingModal } from '@/components/EditListingModal';

type TabFilter = 'all' | 'active' | 'sold' | 'removed';

export function MyListingsPage() {
  const { user } = useAuth();
  const { getMyListings } = useListings();
  const { success, error: showError } = useToast();
  
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [listings, setListings] = useState<ListingWithItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<ListingWithItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  // ... fetch and render logic
}
```

### 2. EditListingModal.tsx
`src/components/EditListingModal.tsx`

Similar to ListingFormModal but:
- Pre-filled with existing listing data
- Has "Mark as Sold" button (green, only for active)
- Has "Remove Listing" button (red outline, only for active)
- Uses confirm dialog before destructive actions

### 3. Update useListings.ts

Add to hook:
```typescript
export interface ListingWithItem extends Listing {
  item: {
    id: string;
    name: string | null;
    photo_url: string;
    thumbnail_url: string | null;
  };
}

async function getMyListings(status?: ListingStatus): Promise<ListingWithItem[]>;
async function updateListing(id: string, data: Partial<Listing>): Promise<boolean>;
async function markAsSold(id: string): Promise<boolean>;
async function removeListing(id: string): Promise<boolean>;
```

### 4. Update App.tsx
Add route:
```tsx
import { MyListingsPage } from '@/pages';
// ...
<Route path="/my-listings" element={<ProtectedRoute><MyListingsPage /></ProtectedRoute>} />
```

### 5. Update SettingsPage.tsx
Add link in account section:
```tsx
<Link to="/my-listings" className="flex items-center justify-between p-4 hover:bg-gray-50">
  <div className="flex items-center gap-3">
    <TagIcon className="w-5 h-5 text-gray-500" />
    <span>My Listings</span>
  </div>
  <ChevronRightIcon className="w-5 h-5 text-gray-400" />
</Link>
```

### 6. Update src/pages/index.ts
Export MyListingsPage

## Listing Card UI

```
┌─────────────────────────────────────────┐
│ [Photo]  Item Name                      │
│  60x60   $25.00 · Negotiable            │
│          ● Active  👁 12  📅 Jan 30     │
└─────────────────────────────────────────┘
```

Status colors:
- Active: green badge
- Sold: blue badge  
- Removed: gray badge

## Instructions

1. Update `src/hooks/useListings.ts` with getMyListings, updateListing, markAsSold, removeListing
2. Create `src/components/EditListingModal.tsx`
3. Create `src/pages/MyListingsPage.tsx`
4. Update `src/pages/index.ts` to export MyListingsPage
5. Add route in `src/App.tsx`
6. Add link in `src/pages/SettingsPage.tsx`
7. Run `npm run build` to verify
8. Commit with: `feat: [US-MKT-004] Add my listings management page`
9. Append progress to `scripts/ralph-fixes/progress.txt`

When ALL acceptance criteria are met and build passes, reply with:
<promise>COMPLETE</promise>
