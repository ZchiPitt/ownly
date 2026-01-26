/**
 * Supabase Edge Function: generate-embedding
 *
 * Generates embeddings for items using OpenAI's text-embedding-3-small model.
 * Can accept either an item ID (to fetch and generate embedding for an existing item)
 * or a text description (to generate embedding for custom text).
 *
 * This function is designed to be called asynchronously after item creation
 * (non-blocking) to populate the embedding field for similarity search.
 *
 * @requires OPENAI_API_KEY environment variable
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Types
interface GenerateEmbeddingRequest {
  item_id?: string;
  text?: string;
}

interface GenerateEmbeddingResponse {
  success: boolean;
  item_id?: string;
  embedding_dimensions: number;
  generated_at: string;
}

interface ApiError {
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

interface ItemData {
  id: string;
  name: string | null;
  description: string | null;
  tags: string[];
  brand: string | null;
  user_id: string;
}

/**
 * Generate text representation of an item for embedding
 */
function buildEmbeddingText(item: ItemData): string {
  const parts: string[] = [];

  // Add item name (primary identifier)
  if (item.name) {
    parts.push(item.name);
  }

  // Add description
  if (item.description) {
    parts.push(item.description);
  }

  // Add tags
  if (item.tags && item.tags.length > 0) {
    parts.push(...item.tags);
  }

  // Add brand
  if (item.brand) {
    parts.push(item.brand);
  }

  // If no meaningful text, return empty string
  if (parts.length === 0) {
    return '';
  }

  return parts.join(' ');
}

/**
 * Call OpenAI Embeddings API
 */
async function generateEmbeddingWithOpenAI(
  text: string,
  apiKey: string
): Promise<number[]> {
  // Truncate text if too long (OpenAI has a token limit)
  const maxLength = 8000; // Conservative limit for text-embedding-3-small
  const truncatedText = text.length > maxLength ? text.slice(0, maxLength) : text;

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: truncatedText,
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

  if (!data.data?.[0]?.embedding) {
    throw new Error('No embedding returned from OpenAI');
  }

  return data.data[0].embedding;
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

    // Parse request body
    let body: GenerateEmbeddingRequest;
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

    // Validate request - need either item_id or text
    if (!body.item_id && !body.text) {
      const error: ApiError = {
        error: {
          message: 'Either item_id or text is required',
          code: 'INVALID_REQUEST',
        },
      };
      return new Response(JSON.stringify(error), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase admin client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    let textToEmbed: string;
    let itemId: string | undefined;

    if (body.item_id) {
      // Fetch item from database
      const { data: item, error: fetchError } = await supabaseAdmin
        .from('items')
        .select('id, name, description, tags, brand, user_id')
        .eq('id', body.item_id)
        .single();

      if (fetchError || !item) {
        const error: ApiError = {
          error: {
            message: 'Item not found',
            code: 'NOT_FOUND',
          },
        };
        return new Response(JSON.stringify(error), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify the item belongs to the authenticated user
      if (item.user_id !== auth.userId) {
        const error: ApiError = {
          error: {
            message: 'You do not have permission to modify this item',
            code: 'FORBIDDEN',
          },
        };
        return new Response(JSON.stringify(error), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Build text representation
      textToEmbed = buildEmbeddingText(item as ItemData);
      itemId = body.item_id;

      // If no meaningful text to embed, skip
      if (!textToEmbed.trim()) {
        const error: ApiError = {
          error: {
            message: 'Item has no text content for embedding generation',
            code: 'NO_CONTENT',
          },
        };
        return new Response(JSON.stringify(error), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // Use provided text directly
      textToEmbed = body.text!;

      if (!textToEmbed.trim()) {
        const error: ApiError = {
          error: {
            message: 'Text cannot be empty',
            code: 'INVALID_REQUEST',
          },
        };
        return new Response(JSON.stringify(error), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Generate embedding using OpenAI
    const embedding = await generateEmbeddingWithOpenAI(textToEmbed, openaiApiKey);

    // If we have an item_id, update the item with the embedding
    if (itemId) {
      // Format embedding as PostgreSQL vector string
      const embeddingStr = `[${embedding.join(',')}]`;

      const { error: updateError } = await supabaseAdmin
        .from('items')
        .update({ embedding: embeddingStr })
        .eq('id', itemId);

      if (updateError) {
        console.error('Error updating item embedding:', updateError);
        const error: ApiError = {
          error: {
            message: 'Failed to update item with embedding',
            code: 'DATABASE_ERROR',
            details: updateError.message,
          },
        };
        return new Response(JSON.stringify(error), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Build response
    const response: GenerateEmbeddingResponse = {
      success: true,
      item_id: itemId,
      embedding_dimensions: embedding.length,
      generated_at: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('generate-embedding error:', error);

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
