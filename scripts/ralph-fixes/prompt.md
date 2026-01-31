# US-FIX-006: AI Bounding Box Detection

**Description:** As a system, I want AI to return bounding box coordinates for each detected item so I can crop individual thumbnails.

**Technical Context:**
- Gemini Vision can return object locations
- Bounding box format: `[x, y, width, height]` as percentages
- Frontend can crop using Canvas API
- More complex implementation, may have accuracy issues

## Acceptance Criteria

**AI Prompt Update:**
- [ ] Add to VISION_PROMPT in `supabase/functions/analyze-image/index.ts`:
  ```
  For each item, also provide approximate bounding box as percentage of image:
  "bbox": [x_percent, y_percent, width_percent, height_percent]
  Example: "bbox": [10, 20, 30, 40] means item starts at 10% from left, 20% from top, spans 30% width and 40% height
  ```
- [ ] Parse bbox from response, validate format
- [ ] Default to full image if bbox missing/invalid

**Frontend Cropping:**
- [ ] Create `cropImageToBbox(imageUrl, bbox)` function in `src/lib/imageUtils.ts`
- [ ] Use Canvas API to crop
- [ ] Generate cropped thumbnail (200x200)
- [ ] Upload cropped thumbnail to storage

**Fallback Behavior:**
- [ ] If bbox missing: use full image (current behavior)
- [ ] If bbox invalid (out of bounds): use full image
- [ ] If crop fails: use full image, log warning

## Files to modify

```
supabase/functions/analyze-image/index.ts
  - Update VISION_PROMPT with bbox request
  - Parse and validate bbox in response

src/types/api.ts
  - Add bbox field to DetectedItem interface

src/lib/imageUtils.ts
  - Add cropImageToBbox() function
  - Add validateBbox() helper

src/pages/AddItemPage.tsx
  - Process bboxes after AI analysis
  - Generate individual thumbnails for each detected item
```

## Test Cases

- [ ] AI returns valid bbox → cropped thumbnail generated
- [ ] AI returns invalid bbox → falls back to full image
- [ ] AI returns no bbox → falls back to full image
- [ ] Cropped thumbnail displays correctly in Gallery

## Instructions

1. Read this story carefully
2. Implement all acceptance criteria
3. Run `npm run build` to verify
4. If build passes, commit with: `feat: [US-FIX-006] AI bounding box detection`
5. Append progress to `scripts/ralph-fixes/progress.txt`

When ALL acceptance criteria are met and build passes, reply with:
<promise>COMPLETE</promise>
