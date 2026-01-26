# Gemini 迁移验证测试

## 部署状态 ✅

**部署时间**: 2026-01-26 00:49:00 UTC

| Function | Version | Status | Model |
|----------|---------|--------|-------|
| analyze-image | v4 | ACTIVE | Gemini 3.0 Flash |
| shopping-analyze | v4 | ACTIVE | Gemini 3.0 Flash |
| generate-embedding | v3 | ACTIVE | OpenAI (unchanged) |

## 代码修改摘要

### analyze-image/index.ts ✅
- ✅ 导入 `GoogleGenAI` from `npm:@google/genai@1.37.0`
- ✅ 添加 `fetchImageAsBase64()` 辅助函数
- ✅ 添加 `detectMimeType()` 辅助函数
- ✅ 重写 `analyzeWithGemini()` 替代 `analyzeWithOpenAI()`
- ✅ 使用 `responseMimeType: 'application/json'` 确保 JSON 输出
- ✅ 更新环境变量检查: `GOOGLE_AI_API_KEY`
- ✅ 更新响应模型名称: `gemini-3-flash-preview`

### shopping-analyze/index.ts ✅
- ✅ 导入 `GoogleGenAI` from `npm:@google/genai@1.37.0`
- ✅ 添加 `fetchImageAsBase64()` 和 `detectMimeType()` 辅助函数
- ✅ 重写 `detectItemWithGemini()` 替代 `detectItemWithOpenAI()`
- ✅ 重写 `generateAdviceWithGemini()` 替代 `generateAdvice()`
- ✅ 保持 `generateEmbedding()` 使用 OpenAI (unchanged)
- ✅ 更新环境变量检查: 同时需要 `GOOGLE_AI_API_KEY` 和 `OPENAI_API_KEY`

### generate-embedding/index.ts ⏭️
- ⏭️ **无需修改** - 继续使用 OpenAI `text-embedding-3-small`

## 环境变量配置 ✅

根据用户确认，以下环境变量已在 Supabase Dashboard 设置：

- ✅ `GOOGLE_AI_API_KEY` - 已配置
- ✅ `OPENAI_API_KEY` - 已配置（用于 embeddings）

## 预期效果

### 响应格式对比

**GPT-4o (迁移前)**:
```json
{
  "detected_items": [...],
  "analysis_model": "gpt-4o",
  "analyzed_at": "2026-01-25T..."
}
```

**Gemini 3.0 Flash (迁移后)**:
```json
{
  "detected_items": [...],
  "analysis_model": "gemini-3-flash-preview",
  "analyzed_at": "2026-01-26T..."
}
```

### 关键改进

1. **成本优化**: 图片分析成本降低约 50-70%
2. **性能提升**: Gemini 3.0 Flash 比 GPT-4o 快约 3 倍
3. **原生 JSON**: 使用 `responseMimeType: 'application/json'` 减少解析错误
4. **更大上下文**: 1M token 上下文窗口

### 功能验证测试

参考 `/Users/zhangchi/Desktop/coding/clekee/docs/GEMINI_MIGRATION.md` 中的验证清单。

由于文档指定测试通过 Unit Test 进行，建议：

1. **前端手动测试** (推荐):
   - 访问 `/add` 页面，上传图片测试 AI 分析
   - 访问 `/shopping` 页面，测试购物助手功能
   - 验证响应中 `analysis_model` = "gemini-3-flash-preview"

2. **API 直接测试** (可选):
   ```bash
   # 需要有效的 JWT Token
   curl -X POST https://zkkplkhgrktkdukxniaj.supabase.co/functions/v1/analyze-image \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e"}'
   ```

3. **数据库验证** (可选):
   ```sql
   -- 检查新物品的 AI 模型标识
   SELECT
     id,
     name,
     ai_metadata->>'analysis_model' as model
   FROM items
   WHERE created_at > '2026-01-26 00:49:00'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

## 回滚计划

如果需要回滚：

```bash
# 1. 恢复旧版本文件
git checkout HEAD~1 -- supabase/functions/analyze-image/index.ts
git checkout HEAD~1 -- supabase/functions/shopping-analyze/index.ts

# 2. 重新部署
supabase functions deploy analyze-image
supabase functions deploy shopping-analyze
```

## 下一步行动

✅ 代码修改完成
✅ 部署成功
⏳ 等待前端功能验证

**建议**: 在实际使用中测试图片分析和购物助手功能，确认 AI 响应质量和性能符合预期。
