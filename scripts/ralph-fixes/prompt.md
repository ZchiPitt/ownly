# US-MKT-003: List Item for Sale UI

**Description:** As a user, I want to list my inventory items for sale so others in the community can purchase them.

## Acceptance Criteria

1. Add 'Sell / Share' button on ItemDetailPage (only visible for item owner)
2. Button opens ListingFormModal with fields: price (number input), price_type (radio: Fixed/Negotiable/Free), condition (dropdown: New/Like New/Good/Fair/Poor), description (textarea max 500 chars)
3. When price_type is 'Free', hide price input field
4. Form validation: price required if not free, condition required, description optional
5. Submit creates new listing in database with status='active'
6. On success: show toast 'Item listed!', close modal, refresh page
7. On error: show error toast, keep modal open
8. Item card in Inventory/Gallery shows 'Listed' badge when item has active listing
9. Cannot list item that is already listed (show 'Already Listed' disabled state)
10. npm run build passes

## Technical Details

**Files to Create/Modify:**

### 1. Create ListingFormModal Component
`src/components/ListingFormModal.tsx`

```typescript
interface ListingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    name: string;
    photo_url: string;
  };
  onSuccess: () => void;
}

// Form fields
interface ListingFormData {
  price: number | null;
  price_type: 'fixed' | 'negotiable' | 'free';
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  description: string;
}
```

Modal should include:
- Item preview (thumbnail + name) at top
- Price type radio buttons (Fixed / Negotiable / Free)
- Price input (hidden when Free selected)
- Condition dropdown
- Description textarea (500 char limit with counter)
- Cancel and Submit buttons

### 2. Update ItemDetailPage
`src/pages/ItemDetailPage.tsx`

- Import ListingFormModal
- Add state: `showListingModal`, `existingListing`
- Fetch existing listing for this item on load
- Add "Sell / Share" button in action area (only if owner and not already listed)
- If already listed, show "Listed" badge and "Edit Listing" button instead

### 3. Create Hook for Listings
`src/hooks/useListings.ts`

```typescript
export function useListings() {
  const { user } = useAuth();
  
  async function createListing(data: {
    item_id: string;
    price: number | null;
    price_type: 'fixed' | 'negotiable' | 'free';
    condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
    description: string;
  }): Promise<{ data: Listing | null; error: Error | null }>;
  
  async function getListingByItemId(itemId: string): Promise<Listing | null>;
  
  return { createListing, getListingByItemId };
}
```

### 4. Update GalleryGrid/ItemList
Add "Listed" badge overlay on items that have active listings.

Query to check: join with listings table where status='active'

## Database Query

```typescript
// Create listing
const { data, error } = await supabase
  .from('listings')
  .insert({
    item_id: itemId,
    seller_id: userProfileId,  // Need to get from profiles table
    price: priceType === 'free' ? null : price,
    price_type: priceType,
    condition: condition,
    description: description,
    status: 'active'
  })
  .select()
  .single();

// Check if item already listed
const { data: existing } = await supabase
  .from('listings')
  .select('id, status')
  .eq('item_id', itemId)
  .eq('status', 'active')
  .single();
```

## UI Components

Use existing Tailwind patterns:
- Modal: similar to ConfirmDialog pattern
- Radio buttons: styled radio group
- Dropdown: existing select styling
- Textarea: existing input styling with character counter
- Buttons: existing Button component

## Instructions

1. Create `src/hooks/useListings.ts` with createListing and getListingByItemId
2. Create `src/components/ListingFormModal.tsx` with the form UI
3. Update `src/pages/ItemDetailPage.tsx` to add Sell button and modal
4. Update `src/components/GalleryGrid.tsx` to show Listed badge (optional, can be next story)
5. Run `npm run build` to verify
6. Commit with: `feat: [US-MKT-003] Add list item for sale UI`
7. Append progress to `scripts/ralph-fixes/progress.txt`

When ALL acceptance criteria are met and build passes, reply with:
<promise>COMPLETE</promise>
