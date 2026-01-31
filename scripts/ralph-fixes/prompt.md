# US-MKT-006: Listing Detail Page

**Description:** As a buyer, I want to see full details of a listing so I can decide whether to purchase.

## Acceptance Criteria

1. Create new page `/marketplace/:listingId` with route in App.tsx
2. Hero section: large item photo (tap to fullscreen)
3. Info section: item name, price, condition, description
4. Seller section: avatar, display_name, rating stars, review count, location city, member since
5. Tap seller name navigates to seller profile page (can be placeholder for now)
6. Action buttons (sticky bottom): 'Message Seller' (outline), 'Buy Now' or 'Request Item' for free items (primary)
7. If item is user's own listing: show 'This is your listing' with Edit button
8. If listing is sold/removed: show 'This item is no longer available'
9. Back button in header
10. Share button to copy link
11. npm run build passes

## Technical Details

**Files to Create/Modify:**

### 1. ListingDetailPage.tsx
`src/pages/ListingDetailPage.tsx`

```typescript
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { useMarketplace, MarketplaceListing } from '@/hooks/useMarketplace';
import { useToast } from '@/hooks/useToast';

export function ListingDetailPage() {
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getListingById } = useMarketplace();
  const { success } = useToast();
  
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // ...
}
```

### 2. Update useMarketplace.ts
Add getListingById function:
```typescript
async function getListingById(id: string): Promise<MarketplaceListing | null> {
  const { data, error } = await supabase
    .from('listings')
    .select(`
      id, price, price_type, condition, description, status, view_count, created_at,
      item:items!inner(id, name, photo_url, thumbnail_url, category_id),
      seller:profiles!inner(id, user_id, display_name, avatar_url, location_city, seller_rating, review_count, created_at)
    `)
    .eq('id', id)
    .single();
  
  return data;
}
```

### 3. Update App.tsx
Add route:
```tsx
<Route path="/marketplace/:listingId" element={<ProtectedRoute><ListingDetailPage /></ProtectedRoute>} />
```

### 4. Update src/pages/index.ts
Export ListingDetailPage

## Page Layout

```
┌─────────────────────────────────┐
│ ←  Listing Details      [Share]│  Header
├─────────────────────────────────┤
│                                 │
│        [Large Photo]            │  Hero (300px max)
│                                 │
├─────────────────────────────────┤
│ Blue Winter Jacket              │  Item Name
│ $45.00 · Negotiable             │  Price
│ ● Like New                      │  Condition badge
├─────────────────────────────────┤
│ This is a warm winter jacket... │  Description
│ Perfect for cold weather.       │
├─────────────────────────────────┤
│ Seller                          │
│ [Avatar] John D.  ⭐ 4.8 (12)   │
│ 📍 San Francisco                │
│ Member since Jan 2025           │
├─────────────────────────────────┤
│                                 │
│ [Message Seller] [Buy Now]      │  Sticky bottom actions
│                                 │
└─────────────────────────────────┘
```

## Condition Badge Colors
- new: green
- like_new: teal
- good: blue
- fair: yellow
- poor: gray

## Instructions

1. Add `getListingById` to `src/hooks/useMarketplace.ts`
2. Create `src/pages/ListingDetailPage.tsx` with full layout
3. Update `src/pages/index.ts` to export ListingDetailPage
4. Add route in `src/App.tsx`
5. Implement share button (copy URL to clipboard with toast)
6. Handle own listing case (show edit button)
7. Handle sold/removed case (show unavailable message)
8. Run `npm run build` to verify
9. Commit with: `feat: [US-MKT-006] Add listing detail page`
10. Append progress to `scripts/ralph-fixes/progress.txt`

When ALL acceptance criteria are met and build passes, reply with:
<promise>COMPLETE</promise>
