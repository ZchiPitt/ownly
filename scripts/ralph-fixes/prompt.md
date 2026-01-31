# US-SHOP-002: Smart Inventory Search by Intent

**Description:** As a user asking specific questions about my inventory, I want the AI to find relevant items using semantic search and intent detection so I get precise answers.

## Acceptance Criteria

1. Create `detectIntent()` function that classifies user message into: declutter, organize, find, compare, general
2. Intent detection uses keyword matching: declutter=['drop','donate','sell','get rid of','throw away'], find=['where is','do I have','find my'], organize=['organize','sort','arrange']
3. Create `fetchRelevantItems()` that queries differently based on intent
4. Declutter intent: return oldest 10 items (by created_at), items with quantity>1, items with no location
5. Find intent: extract search terms, use search_items_by_embedding RPC for semantic search
6. Organize intent: return items with no location, categories with most items
7. Compare intent: generate embedding for user description, search similar items
8. Add relevantItems array to conversation context
9. Format relevant items with reasoning: 'Items you might consider removing: [list with reasons]'
10. Update system prompt with intent-specific guidance
11. User asks 'what can I drop' → AI suggests oldest/duplicate items with reasons
12. User asks 'where is my passport' → AI searches and returns location if found
13. User asks 'do I have a blue shirt' → AI uses semantic search and responds
14. No matching items → AI says 'I couldn't find anything matching that'
15. npm run build passes
16. Deploy to Supabase and test manually

## Technical Details

**File to Modify:**
```
supabase/functions/shopping-followup/index.ts
```

**New Types:**
```typescript
type UserIntent = 'declutter' | 'organize' | 'find' | 'compare' | 'general';

interface RelevantItem {
  id: string;
  name: string;
  category_name: string | null;
  location_path: string | null;
  reason: string;
  similarity?: number;
}
```

**Intent Keywords:**
```typescript
const INTENT_KEYWORDS = {
  declutter: ['drop', 'donate', 'sell', 'get rid of', 'throw away', 'declutter', 'remove', 'toss', 'discard'],
  find: ['where is', 'where are', 'do i have', 'find my', 'looking for', 'search for', 'got any', 'have any'],
  organize: ['organize', 'sort', 'arrange', 'tidy', 'clean up', 'put away', 'need space'],
  compare: ['similar', 'like this', 'compared to', 'already have something like']
};
```

**New Functions:**

```typescript
// Detect intent from user message
function detectIntent(message: string): UserIntent {
  const lowerMessage = message.toLowerCase();
  
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (keywords.some(kw => lowerMessage.includes(kw))) {
      return intent as UserIntent;
    }
  }
  return 'general';
}

// Fetch relevant items based on intent
async function fetchRelevantItems(
  intent: UserIntent,
  message: string,
  userId: string,
  inventoryItems: InventoryItem[],
  supabaseUrl: string,
  supabaseServiceKey: string,
  openaiApiKey: string
): Promise<RelevantItem[]> {
  switch (intent) {
    case 'declutter':
      return fetchDeclutterCandidates(inventoryItems);
    case 'find':
      return await fetchSearchResults(message, userId, supabaseUrl, supabaseServiceKey, openaiApiKey);
    case 'organize':
      return fetchOrganizeCandidates(inventoryItems);
    case 'compare':
      return await fetchSimilarItems(message, userId, supabaseUrl, supabaseServiceKey, openaiApiKey);
    default:
      return [];
  }
}

// Get declutter candidates: oldest, duplicates, no location
function fetchDeclutterCandidates(items: InventoryItem[]): RelevantItem[] {
  const candidates: RelevantItem[] = [];
  
  // Oldest 5 items
  const sorted = [...items].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  sorted.slice(0, 5).forEach(item => {
    candidates.push({
      id: item.id,
      name: item.name,
      category_name: item.category_name,
      location_path: item.location_path,
      reason: 'Oldest item in your inventory'
    });
  });
  
  // Items with no location
  items.filter(i => !i.location_path).slice(0, 3).forEach(item => {
    if (!candidates.find(c => c.id === item.id)) {
      candidates.push({
        id: item.id,
        name: item.name,
        category_name: item.category_name,
        location_path: item.location_path,
        reason: 'No storage location set'
      });
    }
  });
  
  return candidates.slice(0, 10);
}

// Search items using embedding
async function fetchSearchResults(
  message: string,
  userId: string,
  supabaseUrl: string,
  supabaseServiceKey: string,
  openaiApiKey: string
): Promise<RelevantItem[]> {
  // Extract search query (remove common phrases)
  const searchQuery = message
    .toLowerCase()
    .replace(/where is|where are|do i have|find my|looking for|search for|got any|have any/g, '')
    .trim();
  
  if (!searchQuery) return [];
  
  // Generate embedding
  const embedding = await generateQueryEmbedding(searchQuery, openaiApiKey);
  
  // Search using existing RPC
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const embeddingStr = `[${embedding.join(',')}]`;
  
  const { data, error } = await supabase.rpc('search_items_by_embedding', {
    query_embedding: embeddingStr,
    match_threshold: 0.5,
    match_count: 5,
    search_user_id: userId,
  });
  
  if (error || !data) return [];
  
  return data.map((item: any) => ({
    id: item.id,
    name: item.name || 'Unnamed',
    category_name: null,
    location_path: null, // Would need to join
    reason: `${Math.round(item.similarity * 100)}% match`,
    similarity: item.similarity
  }));
}

// Generate embedding for search query
async function generateQueryEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: 1536,
    }),
  });
  
  const data = await response.json();
  return data.data[0].embedding;
}
```

**Update Context with Relevant Items:**
```typescript
function formatRelevantItems(intent: UserIntent, items: RelevantItem[]): string {
  if (items.length === 0) return '';
  
  const headers = {
    declutter: 'Items you might consider removing:',
    find: 'Found these items matching your search:',
    organize: 'Items that need organization:',
    compare: 'Similar items you already have:',
    general: ''
  };
  
  const header = headers[intent];
  const itemList = items.map(i => 
    `- ${i.name}${i.location_path ? ` (in ${i.location_path})` : ''}: ${i.reason}`
  ).join('\n');
  
  return `\n${header}\n${itemList}`;
}
```

## Instructions

1. Read `supabase/functions/shopping-followup/index.ts` (already modified with US-SHOP-001)
2. Add the intent detection constants and types
3. Add `detectIntent()` function
4. Add `fetchRelevantItems()` and helper functions for each intent
5. Add `generateQueryEmbedding()` for semantic search
6. Add `formatRelevantItems()` to format results
7. Update main handler to detect intent and fetch relevant items
8. Include relevant items in context sent to AI
9. Update system prompt with intent-specific guidance
10. Run `npm run build` to verify
11. Commit with: `feat: [US-SHOP-002] Add smart inventory search by intent`
12. Append progress to `scripts/ralph-fixes/progress.txt`

When ALL acceptance criteria are met and build passes, reply with:
<promise>COMPLETE</promise>
