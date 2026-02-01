# US-MKT-011: Saved Listings / Wishlist

**Description:** As a buyer, I want to save listings I'm interested in so I can find them later.

## Acceptance Criteria

1. Create saved_listings table: user_id, listing_id, created_at (composite PK)
2. Heart/bookmark icon on listing cards and detail page
3. Tap to save/unsave (optimistic UI update)
4. New page /saved-listings showing all saved items
5. Remove from saved when listing is sold/removed (or show 'No longer available' state)
6. Empty state: 'No saved items yet'
7. Add link to saved listings in Settings or profile area
8. npm run build passes

## Technical Details

**Files to Create/Modify:**

### 1. Database Migration
`supabase/migrations/YYYYMMDD_create_saved_listings_table.sql`

```sql
CREATE TABLE saved_listings (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, listing_id)
);

ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their saved listings" ON saved_listings
  FOR SELECT TO authenticated
  USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can save listings" ON saved_listings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can unsave listings" ON saved_listings
  FOR DELETE TO authenticated
  USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE INDEX idx_saved_listings_user ON saved_listings(user_id);
```

### 2. useSavedListings.ts Hook
`src/hooks/useSavedListings.ts`

```typescript
export function useSavedListings() {
  // Get all saved listings for current user
  async function getSavedListings(): Promise<MarketplaceListing[]>;
  
  // Check if a listing is saved
  async function isListingSaved(listingId: string): Promise<boolean>;
  
  // Save a listing
  async function saveListing(listingId: string): Promise<boolean>;
  
  // Unsave a listing
  async function unsaveListing(listingId: string): Promise<boolean>;
  
  // Toggle save status
  async function toggleSave(listingId: string): Promise<boolean>;
  
  return { getSavedListings, isListingSaved, saveListing, unsaveListing, toggleSave };
}
```

### 3. SavedListingsPage.tsx
`src/pages/SavedListingsPage.tsx`

- Grid of saved listings (reuse MarketplaceCard)
- Show "No longer available" overlay for sold/removed
- Empty state with link to marketplace
- Pull to refresh

### 4. SaveButton Component
`src/components/SaveButton.tsx`

```typescript
interface SaveButtonProps {
  listingId: string;
  initialSaved?: boolean;
  size?: 'sm' | 'md';
  onToggle?: (saved: boolean) => void;
}
```

- Heart icon (outline when not saved, filled when saved)
- Optimistic update on click
- Toast feedback: "Saved!" / "Removed from saved"

### 5. Update MarketplaceCard.tsx
Add SaveButton in top-right corner of card.

### 6. Update ListingDetailPage.tsx
Add SaveButton next to share button in header.

### 7. Update App.tsx
Add route: `/saved-listings`

### 8. Update SettingsPage.tsx
Add link to Saved Listings.

### 9. Update src/pages/index.ts
Export SavedListingsPage.

## UI Design

Card with save button:
```
┌─────────────────┐
│ [Photo]    [♡] │  ← Heart icon top-right
│                 │
├─────────────────┤
│ Item Name       │
│ $25 · Good      │
└─────────────────┘
```

Saved state: ♥ (filled red)
Unsaved state: ♡ (outline gray)

## Instructions

1. Create migration `supabase/migrations/20260201_create_saved_listings_table.sql`
2. Create `src/hooks/useSavedListings.ts`
3. Create `src/components/SaveButton.tsx`
4. Create `src/pages/SavedListingsPage.tsx`
5. Update `src/components/MarketplaceCard.tsx` with SaveButton
6. Update `src/pages/ListingDetailPage.tsx` with SaveButton
7. Update `src/pages/index.ts`, `src/App.tsx`, `src/pages/SettingsPage.tsx`
8. Run `npm run build` to verify
9. Commit with: `feat: [US-MKT-011] Add saved listings / wishlist`
10. Append progress to `scripts/ralph-fixes/progress.txt`

When ALL acceptance criteria are met and build passes, reply with:
<promise>COMPLETE</promise>
