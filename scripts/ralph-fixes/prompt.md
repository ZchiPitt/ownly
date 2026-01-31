# US-SHOP-003: Embedding-based Intent Detection

**Description:** As a user asking questions in natural language, I want the assistant to understand my intent even when I don't use exact keywords, so I get relevant responses.

## Acceptance Criteria

1. Create INTENT_EXAMPLES constant with 4-5 example phrases per intent (declutter, find, organize, compare, general)
2. Create generateMessageEmbedding() function using OpenAI text-embedding-3-small (512 dimensions)
3. Create computeCosineSimilarity() function for vector comparison
4. Create detectIntentByEmbedding() that compares message to all intent examples
5. Pre-compute intent example embeddings on first request (cache in memory using module-level variable)
6. Return intent with highest average similarity score
7. Set minimum similarity threshold (0.7) - below returns 'general'
8. Fall back to keyword matching if embedding API fails
9. User says 'help me clear out stuff' → detects 'declutter' intent
10. User says 'can you locate my keys' → detects 'find' intent
11. User says 'random question about weather' → returns 'general' (below threshold)
12. npm run build passes
13. Keep existing detectIntent() as fallback

## Technical Details

**File to Modify:**
```
supabase/functions/shopping-followup/index.ts
```

**Intent Examples to Add:**
```typescript
const INTENT_EXAMPLES: Record<UserIntent, string[]> = {
  declutter: [
    "what can I get rid of",
    "what should I throw away",
    "help me clear out some stuff",
    "what can I donate or sell",
    "I have too much stuff what should go"
  ],
  find: [
    "where is my passport",
    "do I have a blue shirt",
    "can you find my charger",
    "looking for my headphones",
    "where did I put my keys"
  ],
  organize: [
    "help me organize my closet",
    "I need to tidy up my stuff",
    "what needs to be put away",
    "how should I arrange my items"
  ],
  compare: [
    "do I have something similar to this",
    "is this like what I already own",
    "would this be a duplicate"
  ],
  general: [
    "tell me about my inventory",
    "what do I have",
    "give me a summary"
  ]
};
```

**New Functions to Add:**

```typescript
// Module-level cache for intent embeddings
let intentEmbeddingsCache: Map<string, number[][]> | null = null;

// Generate embedding for text (512 dimensions for speed)
async function generateMessageEmbedding(
  text: string,
  apiKey: string
): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: 512,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Embedding API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data[0].embedding;
}

// Cosine similarity between two vectors
function computeCosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Get or compute intent embeddings (cached)
async function getIntentEmbeddings(
  apiKey: string
): Promise<Map<string, number[][]>> {
  if (intentEmbeddingsCache) {
    return intentEmbeddingsCache;
  }
  
  const cache = new Map<string, number[][]>();
  
  for (const [intent, examples] of Object.entries(INTENT_EXAMPLES)) {
    const embeddings: number[][] = [];
    for (const example of examples) {
      const embedding = await generateMessageEmbedding(example, apiKey);
      embeddings.push(embedding);
    }
    cache.set(intent, embeddings);
  }
  
  intentEmbeddingsCache = cache;
  return cache;
}

// Detect intent using embedding similarity
async function detectIntentByEmbedding(
  message: string,
  apiKey: string
): Promise<{ intent: UserIntent; confidence: number }> {
  const SIMILARITY_THRESHOLD = 0.7;
  
  try {
    const messageEmbedding = await generateMessageEmbedding(message, apiKey);
    const intentEmbeddings = await getIntentEmbeddings(apiKey);
    
    let bestIntent: UserIntent = 'general';
    let bestScore = 0;
    
    for (const [intent, exampleEmbeddings] of intentEmbeddings.entries()) {
      const similarities = exampleEmbeddings.map(ex => 
        computeCosineSimilarity(messageEmbedding, ex)
      );
      const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;
      
      if (avgSimilarity > bestScore) {
        bestScore = avgSimilarity;
        bestIntent = intent as UserIntent;
      }
    }
    
    if (bestScore < SIMILARITY_THRESHOLD) {
      return { intent: 'general', confidence: bestScore };
    }
    
    return { intent: bestIntent, confidence: bestScore };
    
  } catch (error) {
    console.error('Embedding intent detection failed:', error);
    return { intent: detectIntent(message), confidence: 0.5 };
  }
}
```

**Update Main Handler:**
Replace the call to `detectIntent()` with `detectIntentByEmbedding()`:

```typescript
// Old:
const intent = detectIntent(body.message);

// New:
const { intent, confidence } = await detectIntentByEmbedding(
  body.message,
  openaiApiKey
);
console.log(`Detected intent: ${intent} (confidence: ${confidence.toFixed(2)})`);
```

## Instructions

1. Read current `supabase/functions/shopping-followup/index.ts`
2. Add `INTENT_EXAMPLES` constant near the top
3. Add module-level `intentEmbeddingsCache` variable
4. Add `generateMessageEmbedding()` function
5. Add `computeCosineSimilarity()` function
6. Add `getIntentEmbeddings()` function with caching
7. Add `detectIntentByEmbedding()` function
8. Update main handler to use `detectIntentByEmbedding()` instead of `detectIntent()`
9. Keep `detectIntent()` as fallback (called inside detectIntentByEmbedding on error)
10. Run `npm run build` to verify
11. Commit with: `feat: [US-SHOP-003] Embedding-based intent detection`
12. Append progress to `scripts/ralph-fixes/progress.txt`

When ALL acceptance criteria are met and build passes, reply with:
<promise>COMPLETE</promise>
