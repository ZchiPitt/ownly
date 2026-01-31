# US-SHOP-001: Basic Inventory Context for Shopping Assistant

**Description:** As a user chatting with the shopping assistant, I want it to know what items I own so it can give relevant advice based on my actual inventory.

## Acceptance Criteria

1. Create `fetchUserInventory()` function that queries items table with user_id filter
2. Query includes: id, name, category (joined), location path (joined), quantity, created_at, tags
3. Filter out deleted items (deleted_at IS NULL)
4. Limit to 100 most recent items to prevent token explosion
5. Create `buildInventorySummary()` that returns: total_items, items_by_category count, recent 10 items, unique locations
6. Update `buildConversationContext()` to include inventory summary
7. Include 20 sample items formatted as: '- Item Name (Category) in Location'
8. Update system prompt to explain inventory data is available
9. User asks 'what do I have' → AI responds with inventory summary
10. User with empty inventory → AI says 'Your inventory is empty'
11. User with 500+ items → Function completes under 3 seconds
12. npm run build passes
13. Deploy to Supabase and test manually

## Technical Details

**File to Modify:**
```
supabase/functions/shopping-followup/index.ts
```

**New Types:**
```typescript
interface InventoryItem {
  id: string;
  name: string;
  category_name: string | null;
  location_path: string | null;
  quantity: number;
  created_at: string;
  tags: string[];
}

interface InventorySummary {
  total_items: number;
  items_by_category: Record<string, number>;
  recent_items: Array<{name: string, category: string, added: string}>;
  locations_used: string[];
}
```

**New Functions to Add:**

```typescript
// Fetch user's inventory items (limit 100)
async function fetchUserInventory(
  userId: string,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<InventoryItem[]> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data, error } = await supabase
    .from('items')
    .select(`
      id,
      name,
      quantity,
      created_at,
      tags,
      categories(name),
      locations(path)
    `)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(100);
  
  // Transform and return
}

// Build summary from items
function buildInventorySummary(items: InventoryItem[]): InventorySummary {
  // Count by category
  // Get recent 10
  // Get unique locations
}
```

**System Prompt Addition:**
```
You have access to the user's home inventory:
- Total items: {total}
- By category: {Kitchen: 12, Clothing: 23, ...}
- Recent additions: {list of last 10}
- Storage locations: {list}

Sample items from their inventory:
{20 items formatted as "- Name (Category) in Location"}

Use this data to give personalized advice about their belongings.
When they ask about what they have, refer to this inventory data.
```

**Update Main Handler:**
- Call `fetchUserInventory()` after auth validation
- Call `buildInventorySummary()` 
- Pass both to `buildConversationContext()`
- Include in AI prompt

## Instructions

1. Read `supabase/functions/shopping-followup/index.ts`
2. Add the new types and functions
3. Update `buildConversationContext()` to accept and format inventory
4. Update the system prompt in `generateFollowupResponse()`
5. Update the main handler to fetch inventory and pass it through
6. Run `npm run build` to verify no TypeScript errors
7. Commit with: `feat: [US-SHOP-001] Add inventory context to shopping assistant`
8. Append progress to `scripts/ralph-fixes/progress.txt`

When ALL acceptance criteria are met and build passes, reply with:
<promise>COMPLETE</promise>
