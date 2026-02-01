# US-MKT-012: Marketplace Search

**Description:** As a buyer, I want to search for specific items in the marketplace so I can find what I need quickly.

## Acceptance Criteria

1. Search bar prominent at top of MarketplacePage
2. Search queries item name, description, category
3. Real-time search as user types (debounced 300ms)
4. Search results use same grid layout as browse
5. Highlight matching text in results (optional)
6. Recent searches saved locally (last 5)
7. Clear search button (X) when input has text
8. Empty results: "No items found for '{query}'"
9. npm run build passes

## Technical Details

**Files to Modify:**

### 1. Update useMarketplace.ts
Add search parameter to getListings:

```typescript
interface ListingFilters {
  search?: string;  // Add this
  categories?: string[];
  conditions?: string[];
  priceType?: 'all' | 'free';
  minPrice?: number | null;
  maxPrice?: number | null;
}

// In the query:
if (filters.search) {
  query = query.or(`item.name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
}
```

### 2. Update MarketplacePage.tsx
- Add search input state
- Debounce search input (300ms)
- Pass search to getListings
- Show clear button when search has value
- Store recent searches in localStorage

```typescript
const [searchQuery, setSearchQuery] = useState('');
const [debouncedSearch, setDebouncedSearch] = useState('');

// Debounce effect
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchQuery);
  }, 300);
  return () => clearTimeout(timer);
}, [searchQuery]);

// Save to recent searches on search
useEffect(() => {
  if (debouncedSearch) {
    saveRecentSearch(debouncedSearch);
  }
}, [debouncedSearch]);
```

### 3. SearchInput Component (optional)
`src/components/SearchInput.tsx`

If not already exists, create reusable search input:
- Search icon on left
- Clear (X) button on right when has value
- Placeholder: "Search marketplace..."

### 4. RecentSearches Component (optional)
Show recent searches dropdown when input focused and empty:
- List of 5 recent searches
- Tap to fill input
- "Clear all" link

### 5. localStorage Helper
```typescript
const RECENT_SEARCHES_KEY = 'marketplace_recent_searches';
const MAX_RECENT = 5;

function saveRecentSearch(query: string) {
  const recent = getRecentSearches();
  const updated = [query, ...recent.filter(s => s !== query)].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
}

function getRecentSearches(): string[] {
  const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
  return stored ? JSON.parse(stored) : [];
}
```

## Search UI Design

```
┌─────────────────────────────────┐
│ 🔍 Search marketplace...    [X]│
└─────────────────────────────────┘
```

When focused with no input, show recent searches:
```
┌─────────────────────────────────┐
│ Recent searches                 │
│ • winter jacket                 │
│ • iphone case                   │
│ • vintage lamp                  │
│                    [Clear all]  │
└─────────────────────────────────┘
```

## Instructions

1. Update `src/hooks/useMarketplace.ts` with search filter
2. Update `src/pages/MarketplacePage.tsx` with search functionality
3. Add debounce logic for search
4. Add recent searches (localStorage)
5. Run `npm run build` to verify
6. Commit with: `feat: [US-MKT-012] Add marketplace search`
7. Append progress to `scripts/ralph-fixes/progress.txt`

When ALL acceptance criteria are met and build passes, reply with:
<promise>COMPLETE</promise>
