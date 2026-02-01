# US-MKT-007: Purchase Request Flow

**Description:** As a buyer, I want to request to purchase an item so the seller can accept and we can complete the transaction.

## Acceptance Criteria

1. Tap 'Buy Now' on ListingDetailPage opens PurchaseRequestModal
2. Modal shows: item summary (photo, name, price), optional message to seller (textarea)
3. For negotiable items: show 'Your Offer' input field to enter offer price
4. Submit creates transaction with status='pending'
5. Seller receives notification (in-app, can add push later)
6. Seller sees pending requests in My Listings page with Accept/Decline buttons
7. Accept: transaction status='accepted', listing status='reserved', buyer notified
8. Decline: transaction status='cancelled', buyer notified
9. After accept: show 'Transaction Accepted' state with next steps
10. Complete Transaction button for seller after handoff (status='completed', listing status='sold')
11. npm run build passes

## Technical Details

**Files to Create/Modify:**

### 1. PurchaseRequestModal.tsx
`src/components/PurchaseRequestModal.tsx`

```typescript
interface PurchaseRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: {
    id: string;
    price: number | null;
    price_type: 'fixed' | 'negotiable' | 'free';
    item: { name: string; photo_url: string };
    seller_id: string;
  };
  onSuccess: () => void;
}

// Form data
interface PurchaseRequestForm {
  offer_price: number | null;  // Only for negotiable
  message: string;
}
```

Modal layout:
- Item preview (small photo + name + price)
- If negotiable: "Your Offer" price input
- Message textarea (optional, 200 chars)
- Cancel / Send Request buttons

### 2. useTransactions.ts Hook
`src/hooks/useTransactions.ts`

```typescript
export function useTransactions() {
  // Create a purchase request
  async function createTransaction(data: {
    listing_id: string;
    seller_id: string;
    agreed_price: number | null;
    message: string;
  }): Promise<{ data: Transaction | null; error: Error | null }>;
  
  // Get transactions for a listing (seller view)
  async function getTransactionsForListing(listingId: string): Promise<Transaction[]>;
  
  // Get my transactions (buyer view)
  async function getMyTransactions(): Promise<TransactionWithListing[]>;
  
  // Accept transaction (seller)
  async function acceptTransaction(id: string): Promise<boolean>;
  
  // Decline transaction (seller)
  async function declineTransaction(id: string): Promise<boolean>;
  
  // Complete transaction (seller)
  async function completeTransaction(id: string): Promise<boolean>;
  
  return { createTransaction, getTransactionsForListing, ... };
}
```

### 3. Update ListingDetailPage.tsx
- Import PurchaseRequestModal
- Add state for modal visibility
- Wire up 'Buy Now' button to open modal
- Handle success callback

### 4. Update MyListingsPage.tsx
- Show pending transaction count on listing cards
- When listing tapped, show pending requests section
- Accept/Decline buttons for each pending request

### 5. Update EditListingModal.tsx
Add section showing pending requests:
```
Pending Requests (2)
┌─────────────────────────────────┐
│ John D. offered $40             │
│ "Is this still available?"      │
│ [Accept] [Decline]              │
└─────────────────────────────────┘
```

### 6. Create notifications helper
`src/lib/notifications.ts`

```typescript
export async function createNotification(
  userId: string,
  type: 'purchase_request' | 'request_accepted' | 'request_declined',
  data: { listing_id: string; transaction_id: string; message?: string }
): Promise<void>;
```

## Database Operations

```typescript
// Create transaction
const { data, error } = await supabase
  .from('transactions')
  .insert({
    listing_id: listingId,
    buyer_id: buyerProfileId,
    seller_id: sellerProfileId,
    status: 'pending',
    agreed_price: offerPrice,
    message: message
  })
  .select()
  .single();

// Accept transaction
await supabase.from('transactions').update({ status: 'accepted' }).eq('id', id);
await supabase.from('listings').update({ status: 'reserved' }).eq('id', listingId);

// Complete transaction
await supabase.from('transactions').update({ status: 'completed' }).eq('id', id);
await supabase.from('listings').update({ status: 'sold' }).eq('id', listingId);
```

## Instructions

1. Create `src/hooks/useTransactions.ts` with all transaction functions
2. Create `src/components/PurchaseRequestModal.tsx`
3. Update `src/pages/ListingDetailPage.tsx` to use the modal
4. Update `src/pages/MyListingsPage.tsx` to show pending requests
5. Update `src/components/EditListingModal.tsx` to handle requests
6. Run `npm run build` to verify
7. Commit with: `feat: [US-MKT-007] Add purchase request flow`
8. Append progress to `scripts/ralph-fixes/progress.txt`

When ALL acceptance criteria are met and build passes, reply with:
<promise>COMPLETE</promise>
