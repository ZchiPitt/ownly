# US-MKT-002: Seller Profile Extension

**Description:** As a user, I want to have a public profile so buyers can see my information and trustworthiness.

## Acceptance Criteria

1. Add to profiles table: display_name (varchar 100), bio (text), avatar_url (text), location_city (varchar 100)
2. Add to profiles table: seller_rating (decimal 3,2 default null), review_count (integer default 0), is_verified (boolean default false)
3. Add to profiles table: total_sold (integer default 0), response_rate (decimal 3,2 default null)
4. Create RLS policy: display_name, avatar_url, location_city, seller_rating, review_count, is_verified, total_sold are publicly readable by authenticated users
5. Create RLS policy: users can only update their own profile fields
6. Migration runs successfully
7. Update TypeScript Profile interface in database.ts
8. npm run build passes

## Technical Details

**Migration File:** `supabase/migrations/YYYYMMDDHHMMSS_extend_profiles_for_marketplace.sql`

```sql
-- Extend profiles table for marketplace seller features
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS display_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS location_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS seller_rating DECIMAL(3, 2),
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS total_sold INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS response_rate DECIMAL(3, 2),
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE;

-- Update RLS policies for profiles (keep existing + add new)
-- Note: profiles table should already have RLS enabled

-- Policy for reading public seller info (anyone authenticated can read)
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON profiles;
CREATE POLICY "Public profiles are viewable by authenticated users" ON profiles
  FOR SELECT TO authenticated
  USING (true);

-- Policy for users updating their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Index for seller lookups
CREATE INDEX IF NOT EXISTS idx_profiles_seller_rating ON profiles(seller_rating DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(location_city);
```

**TypeScript Types Update (src/types/database.ts):**

Find the existing Profile interface and add/update these fields:

```typescript
export interface Profile {
  id: string;
  user_id: string;
  // ... existing fields ...
  
  // Marketplace seller fields
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  location_city: string | null;
  seller_rating: number | null;
  review_count: number;
  is_verified: boolean;
  total_sold: number;
  response_rate: number | null;
  last_active_at: string | null;
}
```

## Instructions

1. Create the migration file in `supabase/migrations/` with timestamp prefix
2. Update the Profile interface in `src/types/database.ts` to include new fields
3. Run `npm run build` to verify types compile
4. Commit with: `feat: [US-MKT-002] Extend profiles for marketplace sellers`
5. Append progress to `scripts/ralph-fixes/progress.txt`

When ALL acceptance criteria are met and build passes, reply with:
<promise>COMPLETE</promise>
