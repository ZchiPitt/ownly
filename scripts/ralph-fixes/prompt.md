# US-MKT-010: User Ratings and Reviews

**Description:** As a user, I want to rate and review other users after transactions so the community can identify trustworthy members.

## Acceptance Criteria

1. Create reviews table: id, transaction_id (FK), reviewer_id (FK), reviewee_id (FK), rating (1-5), comment (text 500), created_at
2. After transaction complete, both parties can leave review (prompt appears)
3. Review modal: star rating (required), comment (optional 500 chars)
4. One review per user per transaction (cannot edit after submit)
5. User profile shows: average rating, review count, recent reviews
6. Seller profile on listing detail shows rating prominently
7. Reviews visible on seller profile page
8. Calculate and update seller_rating in profiles table after review
9. npm run build passes

## Technical Details

**Files to Create/Modify:**

### 1. Database Migration
`supabase/migrations/YYYYMMDD_create_reviews_table.sql`

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(transaction_id, reviewer_id)
);

-- RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create reviews for their transactions" ON reviews
  FOR INSERT TO authenticated
  WITH CHECK (reviewer_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Function to update seller rating
CREATE OR REPLACE FUNCTION update_seller_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET 
    seller_rating = (SELECT AVG(rating)::DECIMAL(3,2) FROM reviews WHERE reviewee_id = NEW.reviewee_id),
    review_count = (SELECT COUNT(*) FROM reviews WHERE reviewee_id = NEW.reviewee_id)
  WHERE id = NEW.reviewee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_after_review
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_seller_rating();
```

### 2. ReviewModal.tsx
`src/components/ReviewModal.tsx`

```typescript
interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: {
    id: string;
    listing: { item_name: string };
    other_user: { id: string; display_name: string };
  };
  onSuccess: () => void;
}
```

Modal content:
- Header: "Rate your experience with {name}"
- Star rating: 5 clickable stars
- Comment textarea (optional, 500 chars)
- Submit button

### 3. useReviews.ts Hook
`src/hooks/useReviews.ts`

```typescript
export function useReviews() {
  // Create a review
  async function createReview(data: {
    transaction_id: string;
    reviewee_id: string;
    rating: number;
    comment?: string;
  }): Promise<boolean>;
  
  // Get reviews for a user
  async function getReviewsForUser(userId: string): Promise<Review[]>;
  
  // Check if user can review a transaction
  async function canReviewTransaction(transactionId: string): Promise<boolean>;
  
  // Get pending reviews (transactions without my review)
  async function getPendingReviews(): Promise<Transaction[]>;
  
  return { createReview, getReviewsForUser, canReviewTransaction, getPendingReviews };
}
```

### 4. Update SellerProfilePage.tsx
Add reviews section:
```
Reviews (12)
┌─────────────────────────────────────┐
│ ⭐⭐⭐⭐⭐  Jane D.                  │
│ "Great seller, fast response!"      │
│ 2 weeks ago                         │
└─────────────────────────────────────┘
```

### 5. Update Transaction Complete Flow
After transaction marked complete, show prompt to leave review:
- In MyListingsPage or a dedicated page
- "How was your experience with {name}?"
- Link to ReviewModal

### 6. StarRating Component
`src/components/StarRating.tsx`

Reusable star rating component:
- Display mode: shows filled/empty stars based on rating
- Input mode: clickable stars for selecting rating

### 7. Update types/database.ts
Add Review type.

## Star Rating Display

```
⭐⭐⭐⭐☆ 4.2 (12 reviews)
```

- Filled star: ⭐ (gold)
- Empty star: ☆ (gray)

## Instructions

1. Create migration `supabase/migrations/20260201_create_reviews_table.sql`
2. Create `src/components/StarRating.tsx`
3. Create `src/components/ReviewModal.tsx`
4. Create `src/hooks/useReviews.ts`
5. Update `src/pages/SellerProfilePage.tsx` with reviews section
6. Update `src/types/database.ts` with Review type
7. Add review prompt in transaction complete flow
8. Run `npm run build` to verify
9. Commit with: `feat: [US-MKT-010] Add user ratings and reviews`
10. Append progress to `scripts/ralph-fixes/progress.txt`

When ALL acceptance criteria are met and build passes, reply with:
<promise>COMPLETE</promise>
