# US-MKT-009: Marketplace Notifications

**Description:** As a user, I want to receive notifications about my marketplace activity so I don't miss important updates.

## Acceptance Criteria

1. New notification types: 'new_inquiry', 'purchase_request', 'request_accepted', 'request_declined', 'new_message', 'transaction_complete'
2. In-app notifications appear in existing notification center (/notifications page)
3. Notification content includes: event type icon, other party name, item name, timestamp
4. Tap notification navigates to relevant page (listing, messages, transaction)
5. Notification preferences in Settings: toggle for each marketplace notification type
6. Unread notification badge on notification bell
7. Mark notification as read when tapped
8. npm run build passes

## Technical Details

**Files to Create/Modify:**

### 1. Update notifications table (if needed)
Add marketplace notification types to existing notifications system.

### 2. Update src/lib/notifications.ts
Expand the notifications helper:

```typescript
export type MarketplaceNotificationType = 
  | 'new_inquiry'
  | 'purchase_request' 
  | 'request_accepted'
  | 'request_declined'
  | 'new_message'
  | 'transaction_complete';

export interface MarketplaceNotification {
  id: string;
  user_id: string;
  type: MarketplaceNotificationType;
  title: string;
  body: string;
  data: {
    listing_id?: string;
    transaction_id?: string;
    sender_id?: string;
    item_name?: string;
  };
  read_at: string | null;
  created_at: string;
}

// Create notification
export async function createMarketplaceNotification(
  recipientUserId: string,
  type: MarketplaceNotificationType,
  data: {
    listing_id?: string;
    transaction_id?: string;
    sender_name?: string;
    item_name?: string;
  }
): Promise<void>;

// Get notification title/body based on type
function getNotificationContent(type: MarketplaceNotificationType, data: any): { title: string; body: string };
```

### 3. Create useMarketplaceNotifications.ts Hook
`src/hooks/useMarketplaceNotifications.ts`

```typescript
export function useMarketplaceNotifications() {
  // Get all marketplace notifications for current user
  async function getNotifications(): Promise<MarketplaceNotification[]>;
  
  // Get unread count
  async function getUnreadCount(): Promise<number>;
  
  // Mark as read
  async function markAsRead(id: string): Promise<void>;
  
  // Mark all as read
  async function markAllAsRead(): Promise<void>;
  
  return { getNotifications, getUnreadCount, markAsRead, markAllAsRead };
}
```

### 4. Update NotificationsPage or Create MarketplaceNotificationsSection
Add marketplace notifications to the existing notifications page, or create a new section.

Each notification card:
```
┌─────────────────────────────────────┐
│ 🛒 Purchase Request                 │
│ John wants to buy "Blue Jacket"     │
│ 2 hours ago                    [→]  │
└─────────────────────────────────────┘
```

Icons by type:
- new_inquiry: 💬
- purchase_request: 🛒
- request_accepted: ✅
- request_declined: ❌
- new_message: 💬
- transaction_complete: 🎉

### 5. Update SettingsPage.tsx
Add notification preferences section:
```tsx
<section>
  <h3>Marketplace Notifications</h3>
  <Toggle label="Purchase requests" />
  <Toggle label="Request updates" />
  <Toggle label="New messages" />
  <Toggle label="Transaction complete" />
</section>
```

### 6. Trigger Notifications in Transaction Flow
Update these files to create notifications:
- `src/hooks/useTransactions.ts` - on create/accept/decline/complete
- `src/hooks/useMessages.ts` - on new message

Example:
```typescript
// In acceptTransaction
await createMarketplaceNotification(buyerId, 'request_accepted', {
  listing_id: listingId,
  transaction_id: transactionId,
  item_name: itemName
});
```

## Notification Content Templates

| Type | Title | Body |
|------|-------|------|
| purchase_request | "New purchase request" | "{name} wants to buy {item}" |
| request_accepted | "Request accepted!" | "{name} accepted your request for {item}" |
| request_declined | "Request declined" | "{name} declined your request for {item}" |
| new_message | "New message" | "{name} sent you a message about {item}" |
| transaction_complete | "Transaction complete!" | "Your transaction for {item} is complete" |

## Instructions

1. Update `src/lib/notifications.ts` with marketplace notification functions
2. Create `src/hooks/useMarketplaceNotifications.ts`
3. Update notifications page to show marketplace notifications
4. Update `src/hooks/useTransactions.ts` to trigger notifications
5. Update `src/hooks/useMessages.ts` to trigger notifications
6. Update `src/pages/SettingsPage.tsx` with notification preferences
7. Run `npm run build` to verify
8. Commit with: `feat: [US-MKT-009] Add marketplace notifications`
9. Append progress to `scripts/ralph-fixes/progress.txt`

When ALL acceptance criteria are met and build passes, reply with:
<promise>COMPLETE</promise>
