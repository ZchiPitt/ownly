/**
 * Supabase Edge Function: analyze-image
 *
 * Analyzes images using Google Gemini 3.0 Flash to detect items,
 * suggest categories, extract tags, and identify brands.
 *
 * @requires GOOGLE_AI_API_KEY environment variable
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenAI } from 'npm:@google/genai@1.37.0';
import { corsHeaders } from '../_shared/cors.ts';

// Types matching src/types/api.ts
interface DetectedItem {
  name: string;
  category_suggestion: string | null;
  tags: string[];
  brand: string | null;
  confidence: number;
}

interface AnalyzeImageRequest {
  image_url: string;
}

interface AnalyzeImageResponse {
  detected_items: DetectedItem[];
  analysis_model: string;
  analyzed_at: string;
}

interface ApiError {
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

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
 * Gemini 3.0 Flash Vision prompt for item detection
 */
const VISION_PROMPT = `You are an expert inventory assistant analyzing photos of household items.

Analyze this image and identify all distinct items you can see. For each item, provide:
1. A clear, descriptive name (be specific, e.g., "Blue Cotton T-Shirt" not just "Shirt")
2. A category suggestion from this list: ${SYSTEM_CATEGORIES.join(', ')}
3. Relevant tags (descriptive keywords like color, material, condition, size, style)
4. Brand name if visible on the item
5. Confidence score from 0.0 to 1.0 (how certain you are about the identification)

Return your analysis as a JSON object with this exact structure:
{
  "items": [
    {
      "name": "item name",
      "category_suggestion": "category from list or null",
      "tags": ["tag1", "tag2", "tag3"],
      "brand": "brand name or null",
      "confidence": 0.95
    }
  ]
}

Important rules:
- Only identify items that are clearly visible
- Be specific with names (include color, material, size when apparent)
- Keep tags concise (single words or short phrases)
- Only include brand if you can actually read/see it
- Set confidence lower if the item is partially obscured or unclear
- Return an empty items array if no items can be identified
- Always return valid JSON`;

/**
 * Fetch image and convert to base64
 */
async function fetchImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
  return btoa(binary);
}

/**
 * Detect MIME type from URL or default to JPEG
 */
function detectMimeType(url: string): string {
  const urlLower = url.toLowerCase();
  if (urlLower.includes('.png')) return 'image/png';
  if (urlLower.includes('.webp')) return 'image/webp';
  if (urlLower.includes('.heic')) return 'image/heic';
  return 'image/jpeg'; // Default
}

/**
 * Call Gemini 3.0 Flash Vision API
 */
async function analyzeWithGemini(imageUrl: string, apiKey: string): Promise<DetectedItem[]> {
  const ai = new GoogleGenAI({ apiKey: apiKey });

  // Fetch and encode image
  const imageBase64 = await fetchImageAsBase64(imageUrl);
  const mimeType = detectMimeType(imageUrl);

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        role: 'user',
        parts: [
          { text: VISION_PROMPT },
          {
            inlineData: {
              mimeType: mimeType,
              data: imageBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3, // Lower temperature for consistent results
      maxOutputTokens: 1000,
      responseMimeType: 'application/json', // Native JSON output
    },
  });

  const text = response.text;

  if (!text) {
    throw new Error('No response content from Gemini');
  }

  try {
    const parsed = JSON.parse(text);
    const items = parsed.items || [];

    // Validate and sanitize response
    return items.map((item: Record<string, unknown>) => ({
      name: String(item.name || 'Unknown Item'),
      category_suggestion:
        item.category_suggestion && SYSTEM_CATEGORIES.includes(String(item.category_suggestion))
          ? String(item.category_suggestion)
          : null,
      tags: Array.isArray(item.tags)
        ? item.tags.slice(0, 20).map((t) => String(t).slice(0, 50)) // Max 20 tags, 50 chars each
        : [],
      brand: item.brand ? String(item.brand).slice(0, 100) : null, // Max 100 chars
      confidence:
        typeof item.confidence === 'number'
          ? Math.min(Math.max(item.confidence, 0), 1) // Clamp to 0-1
          : 0.5,
    })) as DetectedItem[];
  } catch (error) {
    console.error('Failed to parse Gemini response:', text);
    throw new Error('Failed to parse AI analysis result');
  }
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

  // Create Supabase client with the user's token
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
    const geminiApiKey = Deno.env.get('GOOGLE_AI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!geminiApiKey) {
      const error: ApiError = {
        error: {
          message: 'Google AI API key not configured',
          code: 'CONFIGURATION_ERROR',
        },
      };
      return new Response(JSON.stringify(error), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!supabaseUrl || !supabaseKey) {
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
    const auth = await validateAuth(authHeader, supabaseUrl, supabaseKey);

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
    let body: AnalyzeImageRequest;
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

    // Call Gemini Vision API
    const detectedItems = await analyzeWithGemini(body.image_url, geminiApiKey);

    // Build response
    const response: AnalyzeImageResponse = {
      detected_items: detectedItems,
      analysis_model: 'gemini-3-flash-preview',
      analyzed_at: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('analyze-image error:', error);

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
