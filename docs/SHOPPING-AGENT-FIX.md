# Shopping Agent - Inventory Context Fix

> Created: 2026-01-31
> Status: Planning

---

## Problem Statement

The shopping assistant (`shopping-followup` Edge Function) doesn't query the user's inventory database before answering questions. When a user asks questions like:
- "I need some space, what are the things that I can drop?"
- "Do I have too many kitchen items?"
- "What should I organize first?"

The AI has no data to work with and gives generic responses.

---

## US-SHOP-001: Basic Inventory Context

**Priority:** P0 | **Effort:** 2 hrs

**Description:** As a user chatting with the shopping assistant, I want it to know what items I own so it can give relevant advice.

### Technical Context

- Current `shopping-followup` only uses `conversation_history`
- Need to query `items` table for user's inventory
- Must handle large inventories without token explosion
- Supabase client already available in the function

### Acceptance Criteria

**Database Query:**
- [ ] Query user's items with fields: `id`, `name`, `category_id`, `location_id`, `quantity`, `created_at`, `tags`
- [ ] Join with `categories` to get category name
- [ ] Join with `locations` to get location path
- [ ] Filter: `deleted_at IS NULL` and `user_id = auth.userId`
- [ ] Limit to 100 most recent items (prevent token explosion)

**Inventory Summary:**
- [ ] Generate summary stats:
  ```typescript
  interface InventorySummary {
    total_items: number;
    items_by_category: Record<string, number>;  // e.g., {"Kitchen": 15, "Clothing": 23}
    recent_items: Array<{name: string, category: string, added: string}>;  // last 10
    locations_used: string[];  // unique location paths
  }
  ```

**Context Integration:**
- [ ] Add `inventorySummary` to context passed to AI
- [ ] Update `buildConversationContext()` to include inventory data
- [ ] Format inventory as readable text for AI

**System Prompt Update:**
- [ ] Add to system prompt:
  ```
  You have access to the user's home inventory summary:
  - Total items they own
  - Breakdown by category
  - Their 10 most recently added items
  - Storage locations they use
  
  Use this data to give personalized advice when they ask about their belongings.
  ```

**Sample Items List:**
- [ ] Include first 20 items with: name, category, location
- [ ] Format: "- Blue T-Shirt (Clothing) in Bedroom > Closet"

### Files to Modify

```
supabase/functions/shopping-followup/index.ts
  - Add fetchUserInventory() function
  - Add buildInventorySummary() function
  - Update buildConversationContext() to include inventory
  - Update system prompt with inventory context
```

### Test Cases

- [ ] User asks "what do I have?" → AI lists summary
- [ ] User asks "what can I drop?" → AI suggests based on inventory
- [ ] User with 0 items → AI says inventory is empty
- [ ] User with 500 items → Only fetches 100, no timeout

---

## US-SHOP-002: Smart Inventory Search

**Priority:** P1 | **Effort:** 3 hrs

**Description:** As a user asking specific questions about my inventory, I want the AI to find relevant items using semantic search.

### Technical Context

- `items` table has `embedding` column (pgvector)
- `search_items_by_embedding` RPC already exists
- Need to detect user intent and query accordingly
- Different intents need different item selection strategies

### Acceptance Criteria

**Intent Detection:**
- [ ] Detect user intent from message:
  ```typescript
  type UserIntent = 
    | 'declutter'      // "what can I drop/donate/sell"
    | 'organize'       // "what should I organize"
    | 'find'           // "do I have X", "where is my X"
    | 'compare'        // "do I have something similar"
    | 'general'        // other questions
  ```
- [ ] Use keyword matching + AI classification
- [ ] Keywords: declutter → ["drop", "donate", "sell", "get rid of", "throw away", "declutter"]

**Intent-Specific Queries:**

**Declutter Intent:**
- [ ] Find potential items to drop:
  - Oldest items (by `created_at`)
  - Items with quantity > 1 (duplicates)
  - Items with no location set (disorganized)
  - Items in "Other" category (uncategorized)
- [ ] Return up to 10 candidates with reasoning

**Organize Intent:**
- [ ] Find items needing organization:
  - Items with no location
  - Categories with most items
  - Recently added items not yet organized
- [ ] Suggest organization priorities

**Find Intent:**
- [ ] Extract search query from user message
- [ ] Use `search_items_by_embedding` for semantic search
- [ ] Return matching items with location info

**Compare Intent:**
- [ ] Extract item description from message
- [ ] Generate embedding for description
- [ ] Search for similar items in inventory
- [ ] Return matches with similarity scores

**Context Enhancement:**
- [ ] Add `relevantItems` array to context
- [ ] Format based on intent:
  - Declutter: "Items you might consider removing: ..."
  - Find: "Found these items matching your query: ..."
  - Organize: "Items that need organization: ..."

**System Prompt Update:**
- [ ] Add intent-aware instructions:
  ```
  When the user asks about decluttering:
  - Suggest items they've had the longest
  - Point out duplicates (same category, similar names)
  - Mention uncategorized items
  
  When the user is looking for something:
  - Search their inventory semantically
  - Include location information
  - Suggest similar alternatives if exact match not found
  ```

### Files to Modify

```
supabase/functions/shopping-followup/index.ts
  - Add detectIntent() function
  - Add fetchRelevantItems() function with intent-based logic
  - Add declutter/organize/find/compare query strategies
  - Update context builder with relevant items
  - Update system prompt with intent-specific guidance
```

### Test Cases

- [ ] "what can I drop" → Intent: declutter, returns oldest/duplicate items
- [ ] "do I have a blue shirt" → Intent: find, searches semantically
- [ ] "where's my passport" → Intent: find, returns location if found
- [ ] "I bought too much, help me organize" → Intent: organize, suggests priorities
- [ ] "is this similar to what I have" (after photo) → Intent: compare, uses embedding

---

## Implementation Order

1. **US-SHOP-001** first - basic context
2. Deploy and test
3. **US-SHOP-002** - smart search
4. Deploy and test

---

## Database Considerations

**Existing RPC functions available:**
- `search_items_by_embedding(query_embedding, match_threshold, match_count, search_user_id)`
- `search_similar_items` (similar)

**May need new RPC:**
- `get_declutter_candidates(user_id, limit)` - oldest + duplicates + uncategorized

---

## Token Budget

Estimate for 100-item inventory:
- Summary stats: ~100 tokens
- 20 sample items: ~400 tokens
- System prompt addition: ~200 tokens
- **Total addition: ~700 tokens** ✅ (within budget)

For smart search (US-SHOP-002):
- Relevant items (10): ~200 tokens
- Intent context: ~100 tokens
- **Total addition: ~300 tokens** ✅

---

## Edge Cases

- Empty inventory → Special message: "Your inventory is empty. Add some items first!"
- Very large inventory (1000+) → Summary only, no item list
- No matching items for search → "I couldn't find anything matching that description"
- Ambiguous intent → Default to general, ask clarifying question
