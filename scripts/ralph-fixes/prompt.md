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

**Files to Create/Modify:**

### 1. Create MyListingsPage
`src/pages/MyListingsPage.tsx`

```typescript
// State
const [activeTab, setActiveTab] = useState<'all' | 'active' | 'sold' | 'removed'>('all');
const [listings, setListings] = useState<ListingWithItem[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [selectedListing, setSelectedListing] = useState<ListingWithItem | null>(null);
const [showEditModal, setShowEditModal] = useState(false);

// Type for listing with joined item data
interface ListingWithItem extends Listing {
  item: {
    id: string;
    name: string;
    photo_url: string;
    thumbnail_url: string | null;
  };
}
```

Page layout:
- Header: "My Listings" with back button
- Tab bar: All | Active | Sold | Removed
- Listing cards in scrollable list
- Empty state when no listings

### 2. Create EditListingModal
`src/components/EditListingModal.tsx`

Similar to ListingFormModal but for editing:
- Pre-filled with existing values
- Additional action buttons at bottom:
  - "Mark as Sold" (green button) - only for active listings
  - "Remove Listing" (red outline button) - only for active listings
- Confirm dialog before Mark as Sold / Remove

### 3. Update useListings Hook
`src/hooks/useListings.ts`

Add functions:
```typescript
async function getMyListings(status?: ListingStatus): Promise<ListingWithItem[]>;
async function updateListing(id: string, data: Partial<Listing>): Promise<boolean>;
async function markAsSold(id: string): Promise<boolean>;
async function removeListing(id: string): Promise<boolean>;
```

### 4. Update App.tsx Routes
Add route:
```tsx
<Route path="/my-listings" element={<ProtectedRoute><MyListingsPage /></ProtectedRoute>} />
```

### 5. Update SettingsPage
Add link to My Listings:
```tsx
<Link to="/my-listings" className="...">
  <ShoppingBagIcon className="..." />
  <span>My Listings</span>
  <ChevronRightIcon className="..." />
</Link>
```

## Listing Card Design

```
┌─────────────────────────────────────┐
│ [Photo] │ Item Name                 │
│  60x60  │ $25.00 · Negotiable       │
│         │ ● Active   👁 12   📅 Jan 30│
└─────────────────────────────────────┘
```

- Photo: 60x60 thumbnail
- Status badge: green=Active, blue=Sold, gray=Removed
- View count with eye icon
- Created date

## Instructions

1. Create `src/pages/MyListingsPage.tsx` with tabs and listing cards
2. Create `src/components/EditListingModal.tsx` for editing
3. Update `src/hooks/useListings.ts` with new functions
4. Add route in `src/App.tsx`
5. Add link in `src/pages/SettingsPage.tsx`
6. Export MyListingsPage from `src/pages/index.ts`
7. Run `npm run build` to verify
8. Commit with: `feat: [US-MKT-004] Add my listings management page`
9. Append progress to `scripts/ralph-fixes/progress.txt`

When ALL acceptance criteria are met and build passes, reply with:
<promise>COMPLETE</promise>
