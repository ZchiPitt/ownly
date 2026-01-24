/**
 * Supabase Edge Function: shopping-analyze
 *
 * Analyzes shopping photos using OpenAI GPT-4o Vision API and compares
 * against user's existing inventory using vector similarity search.
 * Includes rate limiting to manage API costs.
 *
 * @requires OPENAI_API_KEY environment variable
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Types matching src/types/api.ts
interface DetectedItem {
  name: string;
  category_suggestion: string | null;
  tags: string[];
  brand: string | null;
  confidence: number;
}

interface SimilarItem {
  id: string;
  name: string | null;
  photo_url: string;
  thumbnail_url: string | null;
  location_path: string | null;
  similarity: number;
}

interface ShoppingAnalyzeRequest {
  image_url: string;
}

interface ShoppingAnalyzeResponse {
  detected_item: DetectedItem | null;
  similar_items: SimilarItem[];
  advice: string | null;
  analyzed_at: string;
  usage: {
    photo_count: number;
    photo_limit: number;
  };
}

interface ApiError {
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

// Rate limits
const DAILY_PHOTO_LIMIT = 20;

// System categories for matching (from database)
const SYSTEM_CATEGORIES = [
  'Clothing',
  'Food & Beverage',
  'Electronics',
  'Kitchen',
  'Sports & Fitness',
  'Tools',
  'Books & Documents',
  'Personal Care',
  'Home Decor',
  'Other',
];

/**
 * GPT-4o Vision prompt for shopping item detection
 */
const VISION_PROMPT = `You are a smart shopping assistant helping users avoid buying duplicates.

Analyze this image of an item the user is considering buying. Identify the main item and provide:
1. A clear, descriptive name (be specific, e.g., "Blue Cotton T-Shirt" not just "Shirt")
2. A category suggestion from this list: ${SYSTEM_CATEGORIES.join(', ')}
3. Relevant tags (descriptive keywords like color, material, size, style, pattern)
4. Brand name if visible
5. Confidence score from 0.0 to 1.0

Return your analysis as a JSON object with this exact structure:
{
  "item": {
    "name": "item name",
    "category_suggestion": "category from list or null",
    "tags": ["tag1", "tag2", "tag3"],
    "brand": "brand name or null",
    "confidence": 0.95
  }
}

Important rules:
- Focus on the main/primary item being shown
- Be specific with names (include color, material, size when apparent)
- Keep tags concise (single words or short phrases)
- Only include brand if you can actually read/see it
- Return null for item if no clear item can be identified
- Always return valid JSON`;

/**
 * GPT-4o prompt for generating shopping advice based on similar items
 */
function generateAdvicePrompt(
  detectedItem: DetectedItem,
  similarItems: Array<{ name: string | null; similarity: number }>
): string {
  const itemsDesc = similarItems
    .map((item, i) => `${i + 1}. "${item.name || 'Unnamed item'}" (${Math.round(item.similarity * 100)}% match)`)
    .join('\n');

  return `The user is considering buying: "${detectedItem.name}"

They already own these similar items:
${itemsDesc || 'No similar items found in their inventory.'}

Provide brief, helpful shopping advice (2-3 sentences max). Consider:
- If they have very similar items (>90% match), gently suggest they might already have this
- If items are somewhat similar (70-90%), note what they have and ask if they need another
- If no similar items or low similarity, encourage the purchase if it seems useful

Be friendly and concise. Start directly with the advice, no greeting needed.`;
}

/**
 * Call OpenAI GPT-4o Vision API for item detection
 */
async function detectItemWithOpenAI(
  imageUrl: string,
  apiKey: string
): Promise<DetectedItem | null> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: VISION_PROMPT,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No response content from OpenAI');
  }

  // Parse JSON from response (handle potential markdown code blocks)
  let jsonContent = content;
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonContent = jsonMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonContent);
    const item = parsed.item;

    if (!item) {
      return null;
    }

    return {
      name: String(item.name || 'Unknown Item'),
      category_suggestion:
        item.category_suggestion &&
        SYSTEM_CATEGORIES.includes(String(item.category_suggestion))
          ? String(item.category_suggestion)
          : null,
      tags: Array.isArray(item.tags)
        ? item.tags.slice(0, 20).map((t: unknown) => String(t).slice(0, 50))
        : [],
      brand: item.brand ? String(item.brand).slice(0, 100) : null,
      confidence:
        typeof item.confidence === 'number'
          ? Math.min(Math.max(item.confidence, 0), 1)
          : 0.5,
    };
  } catch {
    console.error('Failed to parse OpenAI response:', content);
    return null;
  }
}

/**
 * Generate embedding for the detected item using OpenAI
 */
async function generateEmbedding(
  item: DetectedItem,
  apiKey: string
): Promise<number[]> {
  // Create text representation of the item for embedding
  const textParts = [item.name];
  if (item.category_suggestion) {
    textParts.push(item.category_suggestion);
  }
  if (item.tags.length > 0) {
    textParts.push(...item.tags);
  }
  if (item.brand) {
    textParts.push(item.brand);
  }

  const textToEmbed = textParts.join(' ');

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: textToEmbed,
      dimensions: 1536,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `OpenAI Embeddings API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
    );
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Generate shopping advice using OpenAI
 */
async function generateAdvice(
  detectedItem: DetectedItem,
  similarItems: Array<{ name: string | null; similarity: number }>,
  apiKey: string
): Promise<string | null> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using mini for cost efficiency on advice
        messages: [
          {
            role: 'user',
            content: generateAdvicePrompt(detectedItem, similarItems),
          },
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('Failed to generate advice');
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error('Error generating advice:', error);
    return null;
  }
}

/**
 * Search for similar items in user's inventory using vector similarity
 */
async function findSimilarItems(
  embedding: number[],
  userId: string,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<SimilarItem[]> {
  // Create admin client to bypass RLS for server-side search
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Format embedding as PostgreSQL vector string
  const embeddingStr = `[${embedding.join(',')}]`;

  // Call the search function with explicit user_id
  const { data, error } = await supabase.rpc('search_items_by_embedding', {
    query_embedding: embeddingStr,
    match_threshold: 0.6,
    match_count: 5,
    search_user_id: userId,
  });

  if (error) {
    console.error('Error searching similar items:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Get location paths for the matching items
  const locationIds = data
    .map((item: { location_id: string | null }) => item.location_id)
    .filter((id: string | null): id is string => id !== null);

  let locationMap: Record<string, string> = {};

  if (locationIds.length > 0) {
    const { data: locations } = await supabase
      .from('locations')
      .select('id, path')
      .in('id', locationIds);

    if (locations) {
      locationMap = Object.fromEntries(
        locations.map((loc: { id: string; path: string }) => [loc.id, loc.path])
      );
    }
  }

  return data.map(
    (item: {
      id: string;
      name: string | null;
      photo_url: string;
      thumbnail_url: string | null;
      location_id: string | null;
      similarity: number;
    }) => ({
      id: item.id,
      name: item.name,
      photo_url: item.photo_url,
      thumbnail_url: item.thumbnail_url,
      location_path: item.location_id ? locationMap[item.location_id] || null : null,
      similarity: item.similarity,
    })
  );
}

/**
 * Get or create daily usage record for user
 */
async function getDailyUsage(
  userId: string,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<{ photo_count: number; date: string }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Try to get existing usage record
  const { data: existing } = await supabase
    .from('shopping_usage')
    .select('photo_count')
    .eq('user_id', userId)
    .eq('usage_date', today)
    .single();

  if (existing) {
    return { photo_count: existing.photo_count, date: today };
  }

  // Create new usage record if doesn't exist
  const { data: created, error } = await supabase
    .from('shopping_usage')
    .insert({ user_id: userId, usage_date: today, photo_count: 0 })
    .select('photo_count')
    .single();

  if (error) {
    // Might fail due to race condition, try to get again
    const { data: retry } = await supabase
      .from('shopping_usage')
      .select('photo_count')
      .eq('user_id', userId)
      .eq('usage_date', today)
      .single();

    if (retry) {
      return { photo_count: retry.photo_count, date: today };
    }

    console.error('Error getting/creating usage:', error);
    return { photo_count: 0, date: today };
  }

  return { photo_count: created.photo_count, date: today };
}

/**
 * Increment photo usage count
 */
async function incrementPhotoUsage(
  userId: string,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const today = new Date().toISOString().split('T')[0];

  await supabase.rpc('increment_shopping_photo_usage', {
    p_user_id: userId,
    p_date: today,
  });
}

/**
 * Validate Supabase auth token
 */
async function validateAuth(
  authHeader: string | null,
  supabaseUrl: string,
  supabaseKey: string
): Promise<{ userId: string } | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return { userId: user.id };
}

/**
 * Main handler for the Edge Function
 */
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!openaiApiKey) {
      const error: ApiError = {
        error: {
          message: 'OpenAI API key not configured',
          code: 'CONFIGURATION_ERROR',
        },
      };
      return new Response(JSON.stringify(error), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      const error: ApiError = {
        error: {
          message: 'Supabase configuration missing',
          code: 'CONFIGURATION_ERROR',
        },
      };
      return new Response(JSON.stringify(error), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate auth token
    const authHeader = req.headers.get('Authorization');
    const auth = await validateAuth(authHeader, supabaseUrl, supabaseAnonKey);

    if (!auth) {
      const error: ApiError = {
        error: {
          message: 'Invalid or missing authentication token',
          code: 'UNAUTHORIZED',
        },
      };
      return new Response(JSON.stringify(error), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check rate limit
    const usage = await getDailyUsage(auth.userId, supabaseUrl, supabaseServiceKey);

    if (usage.photo_count >= DAILY_PHOTO_LIMIT) {
      const error: ApiError = {
        error: {
          message: "You've reached today's limit. Try again tomorrow!",
          code: 'RATE_LIMIT_EXCEEDED',
          details: {
            photo_count: usage.photo_count,
            photo_limit: DAILY_PHOTO_LIMIT,
          },
        },
      };
      return new Response(JSON.stringify(error), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    let body: ShoppingAnalyzeRequest;
    try {
      body = await req.json();
    } catch {
      const error: ApiError = {
        error: {
          message: 'Invalid JSON in request body',
          code: 'INVALID_REQUEST',
        },
      };
      return new Response(JSON.stringify(error), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate request
    if (!body.image_url) {
      const error: ApiError = {
        error: {
          message: 'image_url is required',
          code: 'INVALID_REQUEST',
        },
      };
      return new Response(JSON.stringify(error), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate URL format
    try {
      new URL(body.image_url);
    } catch {
      const error: ApiError = {
        error: {
          message: 'Invalid image_url format',
          code: 'INVALID_REQUEST',
        },
      };
      return new Response(JSON.stringify(error), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Increment usage count (do this before expensive API calls)
    await incrementPhotoUsage(auth.userId, supabaseUrl, supabaseServiceKey);
    const newPhotoCount = usage.photo_count + 1;

    // Step 1: Detect item using OpenAI Vision
    const detectedItem = await detectItemWithOpenAI(body.image_url, openaiApiKey);

    // If no item detected, return early
    if (!detectedItem) {
      const response: ShoppingAnalyzeResponse = {
        detected_item: null,
        similar_items: [],
        advice: "I couldn't identify a clear item in this photo. Try taking a clearer picture of the item you're considering.",
        analyzed_at: new Date().toISOString(),
        usage: {
          photo_count: newPhotoCount,
          photo_limit: DAILY_PHOTO_LIMIT,
        },
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Generate embedding for the detected item
    const embedding = await generateEmbedding(detectedItem, openaiApiKey);

    // Step 3: Search for similar items in user's inventory
    const similarItems = await findSimilarItems(
      embedding,
      auth.userId,
      supabaseUrl,
      supabaseServiceKey
    );

    // Step 4: Generate shopping advice
    const advice = await generateAdvice(
      detectedItem,
      similarItems.map((item) => ({
        name: item.name,
        similarity: item.similarity,
      })),
      openaiApiKey
    );

    // Build response
    const response: ShoppingAnalyzeResponse = {
      detected_item: detectedItem,
      similar_items: similarItems,
      advice: advice,
      analyzed_at: new Date().toISOString(),
      usage: {
        photo_count: newPhotoCount,
        photo_limit: DAILY_PHOTO_LIMIT,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('shopping-analyze error:', error);

    const apiError: ApiError = {
      error: {
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
      },
    };

    return new Response(JSON.stringify(apiError), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
