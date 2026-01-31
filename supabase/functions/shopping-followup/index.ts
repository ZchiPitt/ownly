/**
 * Supabase Edge Function: shopping-followup
 *
 * Handles follow-up questions in the Shopping Assistant chat.
 * Uses OpenAI GPT-4o-mini to respond to user questions with context
 * from the conversation history and inventory data.
 *
 * @requires OPENAI_API_KEY environment variable
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Types for conversation messages
interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'image' | 'analysis';
  imageUrl?: string;
  analysisData?: {
    detected_item?: {
      name: string;
      category_suggestion: string | null;
    } | null;
    similar_items?: Array<{
      name: string | null;
      similarity: number;
    }>;
  };
}

interface ShoppingFollowupRequest {
  message: string;
  conversation_history: ConversationMessage[];
}

interface ShoppingFollowupResponse {
  response: string;
  responded_at: string;
  usage: {
    text_count: number;
    text_limit: number;
  };
}

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
  recent_items: Array<{ name: string; category: string; added: string }>;
  locations_used: string[];
}

interface ApiError {
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

// Rate limits
const DAILY_TEXT_LIMIT = 50;

/**
 * Build conversation context from history
 */
function buildConversationContext(
  history: ConversationMessage[],
  inventorySummary: InventorySummary,
  inventorySampleItems: string[]
): string {
  const contextParts: string[] = [];
  contextParts.push(buildInventoryContext(inventorySummary, inventorySampleItems));

  if (history.length === 0) {
    contextParts.push('No previous conversation.');
    return contextParts.join('\n');
  }

  for (const msg of history.slice(-10)) { // Last 10 messages for context
    if (msg.type === 'image') {
      contextParts.push(`[User sent a photo]`);
    } else if (msg.type === 'analysis' && msg.analysisData) {
      const data = msg.analysisData;
      if (data.detected_item) {
        contextParts.push(`[Assistant analyzed: "${data.detected_item.name}" (${data.detected_item.category_suggestion || 'uncategorized'})]`);
        if (data.similar_items && data.similar_items.length > 0) {
          const matches = data.similar_items
            .map(item => `"${item.name || 'unnamed'}" (${Math.round(item.similarity * 100)}% match)`)
            .join(', ');
          contextParts.push(`[Found similar items in inventory: ${matches}]`);
        } else {
          contextParts.push(`[No similar items found in inventory]`);
        }
      }
    } else if (msg.type === 'text') {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      contextParts.push(`${role}: ${msg.content}`);
    }
  }

  return contextParts.join('\n');
}

function normalizeCategoryName(categoryName: string | null | undefined): string {
  if (!categoryName) {
    return 'Uncategorized';
  }
  const trimmed = categoryName.trim();
  return trimmed.length > 0 ? trimmed : 'Uncategorized';
}

function normalizeLocationPath(locationPath: string | null | undefined): string {
  if (!locationPath) {
    return 'Unknown location';
  }
  const trimmed = locationPath.trim();
  return trimmed.length > 0 ? trimmed : 'Unknown location';
}

function buildInventoryContext(
  summary: InventorySummary,
  sampleItems: string[]
): string {
  const categories = Object.entries(summary.items_by_category)
    .map(([category, count]) => `${category}: ${count}`)
    .join(', ');
  const recentItems = summary.recent_items.length > 0
    ? summary.recent_items
      .map(item => `${item.name} (${item.category}) on ${item.added}`)
      .join('; ')
    : 'None';
  const locations = summary.locations_used.length > 0
    ? summary.locations_used.join(', ')
    : 'None';
  const sampleList = sampleItems.length > 0
    ? sampleItems.join('\n')
    : 'No sample items available.';

  return `You have access to the user's home inventory:
- Total items: ${summary.total_items}
- By category: ${categories || 'None'}
- Recent additions: ${recentItems}
- Storage locations: ${locations}

Sample items from their inventory:
${sampleList}

Use this data to give personalized advice about their belongings.
When they ask about what they have, refer to this inventory data.`;
}

function buildInventorySampleItems(items: InventoryItem[]): string[] {
  return items.slice(0, 20).map(item => {
    const category = normalizeCategoryName(item.category_name);
    const location = normalizeLocationPath(item.location_path);
    return `- ${item.name} (${category}) in ${location}`;
  });
}

function buildInventorySummary(items: InventoryItem[]): InventorySummary {
  const itemsByCategory: Record<string, number> = {};
  const locationsUsed: string[] = [];
  const locationSet = new Set<string>();

  for (const item of items) {
    const category = normalizeCategoryName(item.category_name);
    itemsByCategory[category] = (itemsByCategory[category] || 0) + 1;

    const location = normalizeLocationPath(item.location_path);
    if (!locationSet.has(location)) {
      locationSet.add(location);
      locationsUsed.push(location);
    }
  }

  const recentItems = items.slice(0, 10).map(item => ({
    name: item.name,
    category: normalizeCategoryName(item.category_name),
    added: item.created_at,
  }));

  return {
    total_items: items.length,
    items_by_category: itemsByCategory,
    recent_items: recentItems,
    locations_used: locationsUsed,
  };
}

function buildInventoryDirectResponse(
  summary: InventorySummary,
  sampleItems: string[]
): string {
  if (summary.total_items === 0) {
    return 'Your inventory is empty.';
  }

  const categoryList = Object.entries(summary.items_by_category)
    .map(([category, count]) => `${category} (${count})`)
    .join(', ');
  const recentItems = summary.recent_items.length > 0
    ? summary.recent_items
      .map(item => `${item.name} (${item.category})`)
      .join(', ')
    : 'None';
  const locations = summary.locations_used.length > 0
    ? summary.locations_used.join(', ')
    : 'None';
  const sampleList = sampleItems.length > 0
    ? ` Sample items: ${sampleItems.join(' ')}`
    : '';

  return `You have ${summary.total_items} items. Categories: ${categoryList || 'None'}. Recent additions: ${recentItems}. Locations used: ${locations}.${sampleList}`;
}

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

  if (error) {
    console.error('Error fetching inventory items:', error);
    return [];
  }

  type RawItem = {
    id: string;
    name: string | null;
    quantity: number | null;
    created_at: string;
    tags: string[] | null;
    categories?: { name: string | null } | Array<{ name: string | null }> | null;
    locations?: { path: string | null } | Array<{ path: string | null }> | null;
  };

  return (data as RawItem[] | null || []).map(item => {
    const category =
      Array.isArray(item.categories)
        ? item.categories[0]?.name ?? null
        : item.categories?.name ?? null;
    const location =
      Array.isArray(item.locations)
        ? item.locations[0]?.path ?? null
        : item.locations?.path ?? null;

    return {
      id: item.id,
      name: item.name?.trim() || 'Unnamed item',
      category_name: category,
      location_path: location,
      quantity: item.quantity ?? 0,
      created_at: item.created_at,
      tags: Array.isArray(item.tags) ? item.tags : [],
    };
  });
}

/**
 * Generate a contextual response using OpenAI
 */
async function generateFollowupResponse(
  userMessage: string,
  conversationContext: string,
  inventorySummary: InventorySummary,
  inventorySampleItems: string[],
  apiKey: string
): Promise<string> {
  const categories = Object.entries(inventorySummary.items_by_category)
    .map(([category, count]) => `${category}: ${count}`)
    .join(', ');
  const recentItems = inventorySummary.recent_items.length > 0
    ? inventorySummary.recent_items
      .map(item => `${item.name} (${item.category}) on ${item.added}`)
      .join('; ')
    : 'None';
  const locations = inventorySummary.locations_used.length > 0
    ? inventorySummary.locations_used.join(', ')
    : 'None';
  const sampleList = inventorySampleItems.length > 0
    ? inventorySampleItems.join('\n')
    : 'No sample items available.';

  const systemPrompt = `You are a friendly shopping assistant helping users decide whether to buy items.
You have access to the user's home inventory and can search for similar items they already own.

You have access to the user's home inventory:
- Total items: ${inventorySummary.total_items}
- By category: ${categories || 'None'}
- Recent additions: ${recentItems}
- Storage locations: ${locations}

Sample items from their inventory:
${sampleList}

Use this data to give personalized advice about their belongings.
When they ask about what they have, refer to this inventory data.

Your role:
- Answer follow-up questions about the items being discussed
- Provide helpful shopping advice based on what the user already owns
- Be concise but helpful (2-4 sentences typically)
- If asked about something you don't know, suggest the user send a photo for analysis

Remember:
- You cannot browse the internet or check prices
- You can only see items the user has photographed and analyzed
- Stay focused on helping with shopping decisions`;

  const userPrompt = `Previous conversation:
${conversationContext}

User's new question: ${userMessage}

Provide a helpful, concise response.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 300,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error('No response content from OpenAI');
  }

  return content;
}

/**
 * Get or create daily text usage record for user
 */
async function getDailyTextUsage(
  userId: string,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<{ text_count: number; date: string }> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Try to get existing usage record
  const { data: existing } = await supabase
    .from('shopping_usage')
    .select('text_count')
    .eq('user_id', userId)
    .eq('usage_date', today)
    .single();

  if (existing) {
    return { text_count: existing.text_count, date: today };
  }

  // Create new usage record if doesn't exist
  const { data: created, error } = await supabase
    .from('shopping_usage')
    .insert({ user_id: userId, usage_date: today, photo_count: 0, text_count: 0 })
    .select('text_count')
    .single();

  if (error) {
    // Might fail due to race condition, try to get again
    const { data: retry } = await supabase
      .from('shopping_usage')
      .select('text_count')
      .eq('user_id', userId)
      .eq('usage_date', today)
      .single();

    if (retry) {
      return { text_count: retry.text_count, date: today };
    }

    console.error('Error getting/creating usage:', error);
    return { text_count: 0, date: today };
  }

  return { text_count: created.text_count, date: today };
}

/**
 * Increment text usage count
 */
async function incrementTextUsage(
  userId: string,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const today = new Date().toISOString().split('T')[0];

  await supabase.rpc('increment_shopping_text_usage', {
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
    console.error('Auth validation failed: Missing or invalid Authorization header');
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
    console.error('Auth validation failed:', error?.message || 'No user returned');
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
    console.log('Auth header present:', !!authHeader, 'starts with Bearer:', authHeader?.startsWith('Bearer '));
    const auth = await validateAuth(authHeader, supabaseUrl, supabaseAnonKey);
    console.log('Auth result:', auth ? 'success' : 'failed');

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
    const usage = await getDailyTextUsage(auth.userId, supabaseUrl, supabaseServiceKey);

    if (usage.text_count >= DAILY_TEXT_LIMIT) {
      const error: ApiError = {
        error: {
          message: "You've reached today's question limit. Try again tomorrow!",
          code: 'RATE_LIMIT_EXCEEDED',
          details: {
            text_count: usage.text_count,
            text_limit: DAILY_TEXT_LIMIT,
          },
        },
      };
      return new Response(JSON.stringify(error), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    let body: ShoppingFollowupRequest;
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
    if (!body.message || typeof body.message !== 'string' || body.message.trim().length === 0) {
      const error: ApiError = {
        error: {
          message: 'message is required and must be a non-empty string',
          code: 'INVALID_REQUEST',
        },
      };
      return new Response(JSON.stringify(error), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Increment usage count before API call
    await incrementTextUsage(auth.userId, supabaseUrl, supabaseServiceKey);
    const newTextCount = usage.text_count + 1;

    // Fetch inventory and build summary
    const inventoryItems = await fetchUserInventory(auth.userId, supabaseUrl, supabaseServiceKey);
    const inventorySummary = buildInventorySummary(inventoryItems);
    const inventorySampleItems = buildInventorySampleItems(inventoryItems);

    // Build conversation context
    const conversationContext = buildConversationContext(
      body.conversation_history || [],
      inventorySummary,
      inventorySampleItems
    );

    // Generate response
    const normalizedMessage = body.message.trim().toLowerCase();
    const isInventoryQuestion = normalizedMessage.includes('what do i have');
    const aiResponse = isInventoryQuestion
      ? buildInventoryDirectResponse(inventorySummary, inventorySampleItems)
      : await generateFollowupResponse(
        body.message.trim(),
        conversationContext,
        inventorySummary,
        inventorySampleItems,
        openaiApiKey
      );

    const response: ShoppingFollowupResponse = {
      response: aiResponse,
      responded_at: new Date().toISOString(),
      usage: {
        text_count: newTextCount,
        text_limit: DAILY_TEXT_LIMIT,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('shopping-followup error:', error);

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
