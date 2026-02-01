# US-MKT-008: In-App Messaging

**Description:** As a buyer/seller, I want to message the other party so we can discuss details and arrange pickup.

## Acceptance Criteria

1. Create new page `/messages` listing all conversations
2. Conversation list shows: other party avatar/name, last message preview, unread count, timestamp
3. Tap conversation opens `/messages/:conversationId` chat view
4. Chat view: message bubbles (sent right blue, received left gray), timestamps, listing reference at top
5. Message input at bottom with send button
6. Real-time updates using Supabase Realtime subscription
7. Mark messages as read when conversation opened
8. Unread badge count on Messages link in Settings
9. 'Message Seller' button on listing detail creates/opens conversation
10. Empty state: 'No messages yet'
11. npm run build passes

## Technical Details

**Files to Create:**

### 1. MessagesPage.tsx
`src/pages/MessagesPage.tsx`

List of conversations:
```typescript
interface Conversation {
  id: string;  // listing_id used as conversation id
  listing: { id: string; item_name: string; photo_url: string };
  other_user: { id: string; display_name: string; avatar_url: string | null };
  last_message: { content: string; created_at: string; is_mine: boolean };
  unread_count: number;
}
```

### 2. ChatPage.tsx
`src/pages/ChatPage.tsx`

Chat view for single conversation:
```typescript
// URL: /messages/:listingId
// Uses listing_id to identify conversation between buyer and seller

interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_mine: boolean;
}
```

Layout:
- Header: listing photo + name, other user name
- Messages list (scrollable, newest at bottom)
- Input bar at bottom (textarea + send button)

### 3. useMessages.ts Hook
`src/hooks/useMessages.ts`

```typescript
export function useMessages() {
  // Get all conversations for current user
  async function getConversations(): Promise<Conversation[]>;
  
  // Get messages for a conversation (listing)
  async function getMessages(listingId: string): Promise<ChatMessage[]>;
  
  // Send a message
  async function sendMessage(listingId: string, receiverId: string, content: string): Promise<boolean>;
  
  // Mark messages as read
  async function markAsRead(listingId: string): Promise<void>;
  
  // Get unread count
  async function getUnreadCount(): Promise<number>;
  
  // Subscribe to new messages (Supabase Realtime)
  function subscribeToMessages(listingId: string, callback: (msg: ChatMessage) => void): () => void;
  
  return { getConversations, getMessages, sendMessage, markAsRead, getUnreadCount, subscribeToMessages };
}
```

### 4. Update App.tsx
Add routes:
```tsx
<Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
<Route path="/messages/:listingId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
```

### 5. Update ListingDetailPage.tsx
- 'Message Seller' button navigates to `/messages/:listingId`
- Creates initial conversation if needed

### 6. Update SettingsPage.tsx
Add Messages link with unread badge:
```tsx
<Link to="/messages">
  <ChatBubbleIcon />
  <span>Messages</span>
  {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
</Link>
```

### 7. Update src/pages/index.ts
Export MessagesPage, ChatPage

## Database Queries

```typescript
// Get conversations (group messages by listing)
const { data } = await supabase
  .from('messages')
  .select(`
    listing_id,
    listings!inner(id, item:items(name, photo_url)),
    sender:profiles!sender_id(id, display_name, avatar_url),
    receiver:profiles!receiver_id(id, display_name, avatar_url),
    content, created_at, read_at
  `)
  .or(`sender_id.eq.${myProfileId},receiver_id.eq.${myProfileId}`)
  .order('created_at', { ascending: false });

// Subscribe to new messages
supabase
  .channel('messages')
  .on('postgres_changes', { 
    event: 'INSERT', 
    schema: 'public', 
    table: 'messages',
    filter: `listing_id=eq.${listingId}`
  }, callback)
  .subscribe();
```

## Message Bubble Design

```
┌─────────────────────────────────┐
│ Received message on left        │  ← gray bg
└─────────────────────────────────┘
                    ┌─────────────────────────────────┐
                    │        Sent message on right    │  ← blue bg
                    └─────────────────────────────────┘
```

## Instructions

1. Create `src/hooks/useMessages.ts` with all messaging functions
2. Create `src/pages/MessagesPage.tsx` for conversation list
3. Create `src/pages/ChatPage.tsx` for chat view
4. Update `src/pages/index.ts` to export new pages
5. Add routes in `src/App.tsx`
6. Update `src/pages/ListingDetailPage.tsx` for Message Seller button
7. Update `src/pages/SettingsPage.tsx` with Messages link + badge
8. Run `npm run build` to verify
9. Commit with: `feat: [US-MKT-008] Add in-app messaging`
10. Append progress to `scripts/ralph-fixes/progress.txt`

When ALL acceptance criteria are met and build passes, reply with:
<promise>COMPLETE</promise>
