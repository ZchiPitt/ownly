# US-MKT-001: Marketplace Database Schema

**Description:** As a developer, I need the database schema for marketplace functionality including listings, transactions, and messages tables.

## Acceptance Criteria

1. Create listings table with: id (UUID PK), item_id (FK to items), seller_id (FK to profiles), status (active/sold/reserved/removed), price (decimal 10,2), price_type (fixed/negotiable/free), condition (new/like_new/good/fair/poor), description (text), created_at, updated_at
2. Create transactions table with: id (UUID PK), listing_id (FK), buyer_id (FK to profiles), seller_id (FK to profiles), status (pending/accepted/completed/cancelled), agreed_price (decimal 10,2), message (text), created_at, updated_at
3. Create messages table with: id (UUID PK), listing_id (FK), sender_id (FK to profiles), receiver_id (FK to profiles), content (text), read_at (timestamp nullable), created_at
4. Add RLS policies: users can only see their own transactions (as buyer or seller)
5. Add RLS policies: sellers can see all transactions for their listings
6. Add RLS policies: messages visible only to sender or receiver
7. Add RLS policies: listings readable by all authenticated users, writable only by seller
8. Create indexes on: listings(seller_id, status), listings(item_id), transactions(buyer_id), transactions(seller_id), transactions(listing_id), messages(listing_id), messages(sender_id), messages(receiver_id)
9. Migration runs successfully
10. TypeScript types added to src/types/database.ts
11. npm run build passes

## Technical Details

**Migration File:** `supabase/migrations/YYYYMMDDHHMMSS_create_marketplace_tables.sql`

```sql
-- Enable UUID extension if not already
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Listings table
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'reserved', 'removed')),
  price DECIMAL(10, 2),
  price_type TEXT NOT NULL DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'negotiable', 'free')),
  condition TEXT NOT NULL CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
  description TEXT,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled')),
  agreed_price DECIMAL(10, 2),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_listings_seller_status ON listings(seller_id, status);
CREATE INDEX idx_listings_item ON listings(item_id);
CREATE INDEX idx_listings_status ON listings(status) WHERE status = 'active';
CREATE INDEX idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX idx_transactions_seller ON transactions(seller_id);
CREATE INDEX idx_transactions_listing ON transactions(listing_id);
CREATE INDEX idx_messages_listing ON messages(listing_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_conversation ON messages(sender_id, receiver_id, listing_id);

-- Enable RLS
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Listings policies
CREATE POLICY "Listings are viewable by authenticated users" ON listings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create listings for their items" ON listings
  FOR INSERT TO authenticated
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers can update their own listings" ON listings
  FOR UPDATE TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers can delete their own listings" ON listings
  FOR DELETE TO authenticated
  USING (seller_id = auth.uid());

-- Transactions policies
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Buyers can create transactions" ON transactions
  FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Participants can update transactions" ON transactions
  FOR UPDATE TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their sent messages" ON messages
  FOR UPDATE TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**TypeScript Types to Add (src/types/database.ts):**

```typescript
// Marketplace types
export type ListingStatus = 'active' | 'sold' | 'reserved' | 'removed';
export type PriceType = 'fixed' | 'negotiable' | 'free';
export type ItemCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor';
export type TransactionStatus = 'pending' | 'accepted' | 'completed' | 'cancelled';

export interface Listing {
  id: string;
  item_id: string;
  seller_id: string;
  status: ListingStatus;
  price: number | null;
  price_type: PriceType;
  condition: ItemCondition;
  description: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  status: TransactionStatus;
  agreed_price: number | null;
  message: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  listing_id: string | null;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}
```

## Instructions

1. Create the migration file in `supabase/migrations/` with timestamp prefix
2. Add the TypeScript types to `src/types/database.ts`
3. Run `npm run build` to verify types compile
4. Commit with: `feat: [US-MKT-001] Add marketplace database schema`
5. Append progress to `scripts/ralph-fixes/progress.txt`

When ALL acceptance criteria are met and build passes, reply with:
<promise>COMPLETE</promise>
