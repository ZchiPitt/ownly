# US-FIX-008: Color Tag UI Highlight

**Description:** As a user viewing tags, I want color tags to be visually distinct so I can quickly identify item colors.

**Technical Context:**
- Tags currently display as gray chips
- Color tags should stand out visually
- Can show actual color swatch/dot

## Acceptance Criteria

**Color Detection Utility:**
- [ ] Create `src/lib/colorUtils.ts`:
  ```typescript
  // Returns hex color if tag is a color word, null otherwise
  function getColorHex(tag: string): string | null;
  
  // Check if tag contains color word
  function isColorTag(tag: string): boolean;
  
  // Color mapping
  const COLOR_MAP: Record<string, string> = {
    'red': '#EF4444',
    'blue': '#3B82F6',
    'green': '#22C55E',
    // ... etc
  };
  ```

**Tag Display:**
- [ ] Color tags show colored dot before text
- [ ] Dot is 8x8px circle with the actual color
- [ ] Color tags have subtle tinted background matching color
- [ ] Color tags appear first in tag list (already from AI)

**Component Updates:**
- [ ] TagChip component: accept `isColor` prop, render dot
- [ ] Apply in: ItemEditor, ItemDetailPage, GalleryGrid, SearchResult

**Accessibility:**
- [ ] Color dot has `aria-label="Color: blue"`
- [ ] Don't rely on color alone (text still shows color name)

## Files to modify

```
src/lib/colorUtils.ts (new)
  - COLOR_MAP constant
  - getColorHex() function
  - isColorTag() function

src/components/TagsInput.tsx
  - Import colorUtils
  - Render color dot for color tags

src/components/GalleryGrid.tsx
  - Show color tag with dot in item card

src/pages/ItemDetailPage.tsx
  - Render color-enhanced tags
```

## Test Cases

- [ ] Tag "blue" shows blue dot
- [ ] Tag "cotton" shows no dot (not a color)
- [ ] Tag "navy blue" shows navy blue dot
- [ ] Multiple color tags all show appropriate dots

## Instructions

1. Read this story carefully
2. Implement all acceptance criteria
3. Run `npm run build` to verify
4. If build passes, commit with: `feat: [US-FIX-008] Color tag UI highlight`
5. Append progress to `scripts/ralph-fixes/progress.txt`

When ALL acceptance criteria are met and build passes, reply with:
<promise>COMPLETE</promise>
