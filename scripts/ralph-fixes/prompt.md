# US-FIX-005: Visual Indicator for Shared Photo

**Description:** As a user, I want to understand that multiple items share the same photo so I'm not confused.

**Technical Context:**
- Multiple items can have same `photo_url` and `thumbnail_url`
- No current indicator that photo is shared
- Users may be confused why items look "the same"

## Acceptance Criteria

**Database Change:**
- [ ] Add `source_batch_id` column to items table (nullable UUID)
- [ ] Items from same multi-item capture share same batch ID
- [ ] Single-item captures have NULL batch ID

**Inventory Display:**
- [ ] In GalleryGrid, show small badge on shared-photo items
- [ ] Badge: "📷 +2" meaning "2 other items share this photo"
- [ ] Badge position: bottom-right of thumbnail
- [ ] Badge style: semi-transparent black background, white text

**Item Detail Page:**
- [ ] If item has source_batch_id, show info section:
  - "This photo contains multiple items"
  - List linked items as clickable chips
  - Example: "Also in photo: Blue Mug, Red Plate"
- [ ] Position: below main photo, before details

## Files to modify

```
supabase/migrations/XXXXX_add_source_batch_id.sql (new)
  - ALTER TABLE items ADD COLUMN source_batch_id UUID;

src/types/database.ts
  - Add source_batch_id to Item interface

src/pages/AddItemPage.tsx
  - Generate batch ID for multi-item saves
  - Pass batch ID to each item creation

src/components/GalleryGrid.tsx
  - Query for shared items count
  - Render badge on thumbnails

src/pages/ItemDetailPage.tsx
  - Query for items with same batch ID
  - Render "Also in photo" section
```

## Test Cases

- [ ] Add 3 items from one photo → all have same batch_id
- [ ] Add 1 item → batch_id is NULL
- [ ] View item in Gallery → shows "+2" badge if shared
- [ ] View item detail → shows linked items if shared

## Instructions

1. Read this story carefully
2. Implement all acceptance criteria
3. Run `npm run build` to verify
4. If build passes, commit with: `feat: [US-FIX-005] Visual indicator for shared photo`
5. Update progress in `scripts/ralph-fixes/progress.txt`

When ALL acceptance criteria are met and build passes, reply with:
<promise>COMPLETE</promise>
