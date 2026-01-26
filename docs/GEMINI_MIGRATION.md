# Gemini 3.0 Flash 迁移方案

> **目标**: 将图片分析功能从 OpenAI GPT-4o 迁移到 Google Gemini 3.0 Flash，保持 Embedding 模型不变

---

## 📊 迁移概览

### 范围界定

**需要迁移的组件**:
- ✅ `supabase/functions/analyze-image/index.ts` - GPT-4o Vision → Gemini 3.0 Flash
- ✅ `supabase/functions/shopping-analyze/index.ts` - GPT-4o Vision + GPT-4o-mini → Gemini 3.0 Flash

**保持不变的组件**:
- ⏭️ `supabase/functions/generate-embedding/index.ts` - 继续使用 `text-embedding-3-small`
- ⏭️ 所有前端代码 - API 接口保持兼容

### 成本效益分析

| 模型服务 | 当前 (OpenAI) | 迁移后 (Gemini) | 节省比例 |
|----------|--------------|----------------|---------|
| 图片分析 (Vision) | GPT-4o: $2.50-$5.00/1M tokens | Gemini 3.0 Flash: $0.50/1M input + $3/1M output | ~50-70% |
| 文本生成 (Advice) | GPT-4o-mini: $0.15/1M input + $0.60/1M output | Gemini 3.0 Flash: $0.50/1M input + $3/1M output | 混合计算 |
| Embeddings | text-embedding-3-small: $0.02/1M tokens | **保持不变** | - |

**预计月度节省**: 基于每月 10,000 次图片分析，预计节省 $50-$150

### 技术优势

1. **原生 JSON 支持**: Gemini 支持 `responseMimeType: 'application/json'`，减少解析错误
2. **更快推理速度**: Gemini 3.0 Flash 比 GPT-4o 快约 3 倍
3. **1M Token 上下文**: 更大的上下文窗口
4. **多模态能力**: 支持 text, images, audio, video, PDF

---

## 🛠️ 实施步骤

### Phase 1: 准备工作


#### 1.2 配置环境变量

**Supabase Dashboard 设置**:


GOOGLE_AI_API_KEY，OPENAI_API_KEY我已经在supabase网站上设置在了secrets里，请直接测试


### Phase 2: 代码修改

#### 2.1 修改 `analyze-image/index.ts`

<details>
<summary><b>完整修改代码（点击展开）</b></summary>

```typescript
/**
 * Supabase Edge Function: analyze-image
 *
 * Analyzes images using Google Gemini 3.0 Flash to detect items,
 * suggest categories, extract tags, and identify brands.
 *
 * @requires GOOGLE_AI_API_KEY environment variable
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenAI } from 'https://esm.sh/@google/genai@0.21.0';
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
  const genAI = new GoogleGenAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',
  });

  // Fetch and encode image
  const imageBase64 = await fetchImageAsBase64(imageUrl);
  const mimeType = detectMimeType(imageUrl);

  const response = await model.generateContent({
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

  const text = response.response.text();

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
```

</details>

**关键变更点**:
1. ✅ 导入 `GoogleGenAI` 替代 OpenAI SDK
2. ✅ 添加 `fetchImageAsBase64()` 和 `detectMimeType()` 辅助函数
3. ✅ 重写 `analyzeWithGemini()` 函数使用 Gemini API
4. ✅ 使用 `responseMimeType: 'application/json'` 确保 JSON 输出
5. ✅ 更新环境变量检查和错误消息
6. ✅ 更新响应中的 `analysis_model` 字段

#### 2.2 修改 `shopping-analyze/index.ts`

<details>
<summary><b>核心修改摘要（完整代码见附录）</b></summary>

**主要修改**:
1. 添加 Gemini SDK 导入
2. 重写 `detectItemWithGemini()` - 物品检测
3. 重写 `generateAdviceWithGemini()` - 购物建议
4. 保持 `generateEmbedding()` 使用 OpenAI（不变）
5. 保持 `findSimilarItems()` 逻辑不变
6. 更新环境变量：同时需要 `GOOGLE_AI_API_KEY` 和 `OPENAI_API_KEY`

**函数调用流程**:
```
1. detectItemWithGemini() ────→ Gemini Vision
2. generateEmbedding()     ────→ OpenAI Embeddings (不变)
3. findSimilarItems()      ────→ Vector Search (不变)
4. generateAdviceWithGemini() ─→ Gemini Text
```

</details>

完整代码见: [附录 A: shopping-analyze 完整代码](#附录-a-shopping-analyze-完整代码)

#### 2.3 保持 `generate-embedding/index.ts` 不变

**无需修改**: 继续使用 OpenAI `text-embedding-3-small` 模型

**原因**:
- ✅ Embedding 模型已优化且成本低廉 ($0.02/1M tokens)
- ✅ 现有向量索引与 OpenAI embeddings 兼容
- ✅ 避免重新生成所有物品的 embeddings

### Phase 3: 部署与测试


#### 3.2 生产部署

**部署 Edge Functions**:
```bash
# 1. 设置生产环境变量


# 2. 部署修改后的函数
supabase functions deploy analyze-image
supabase functions deploy shopping-analyze

# 3. 验证部署状态
supabase functions list

# 4. 查看函数日志
supabase functions logs analyze-image --limit 50
```



---

## ✅ 验证清单

使用supabase mcp来进行对supabase的连接并测试

### 功能验证 (Functional Testing)

#### Test Case 1: 图片分析基础功能

**测试目标**: 验证 Gemini 能够正确识别图片中的物品

**测试步骤**:通过unit test测试

---

#### Test Case 2: 购物助手完整流程

**测试目标**: 验证购物分析的端到端功能（Vision + Embeddings + Advice）

**测试步骤**:通过unit test测试

---

#### Test Case 3: Embedding 功能未受影响

**测试目标**: 确认 Embedding 生成仍使用 OpenAI

**测试步骤**:通过unit test测试
---

#### Test Case 4: 错误处理

**测试目标**: 验证各种错误场景的处理
通过unit test测试


---

### 回归测试 (Regression Testing)

#### Test Case 6: 前端兼容性

**测试目标**: 确认前端 API 调用无需修改

**测试步骤**:通过unit test测试

---

#### Test Case 7: 数据库完整性

**测试目标**: 验证数据存储和检索正常

**SQL 验证查询**:通过unit test测试

---


## 📚 参考资料

### 官方文档
- [Gemini 3 Developer Guide](https://ai.google.dev/gemini-api/docs/gemini-3)
- [Gemini API Quickstart](https://ai.google.dev/gemini-api/docs/quickstart)
- [Google GenAI TypeScript SDK](https://github.com/googleapis/js-genai)
- [Gemini 3 Flash Performance](https://blog.google/technology/developers/build-with-gemini-3-flash/)

### 成本与定价
- [Gemini 3 Flash Pricing](https://www.glbgpt.com/hub/how-much-does-the-gemini-3-flash-cost/)
- [Vertex AI Pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing)

### Supabase 集成
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Deno 第三方模块](https://deno.land/x)

---

Output <promise>COMPLETE</promise> when all phases done.
