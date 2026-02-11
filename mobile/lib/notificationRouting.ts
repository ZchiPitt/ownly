import type { NotificationData, NotificationType } from '../../src/types/database';

type NotificationRoutePath =
  | '/(tabs)/marketplace/[id]'
  | '/(tabs)/marketplace/messages/[listingId]'
  | '/(tabs)/inventory/[id]';

export type NotificationTarget = {
  pathname: NotificationRoutePath;
  params: Record<string, string>;
};

type NotificationRoutingInput = {
  type?: NotificationType | string | null;
  data?: NotificationData | Record<string, unknown> | null;
  itemId?: string | null;
};

const CHAT_NOTIFICATION_TYPES = new Set<NotificationType | string>([
  'new_inquiry',
  'purchase_request',
  'request_accepted',
  'request_declined',
  'new_message',
  'transaction_complete',
]);

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

export function resolveNotificationTarget(input: NotificationRoutingInput): NotificationTarget | null {
  const listingId = readString(input.data?.listing_id);

  if (listingId && input.type && CHAT_NOTIFICATION_TYPES.has(input.type)) {
    return {
      pathname: '/(tabs)/marketplace/messages/[listingId]',
      params: { listingId },
    };
  }

  if (listingId) {
    return {
      pathname: '/(tabs)/marketplace/[id]',
      params: { id: listingId },
    };
  }

  const itemId = readString(input.itemId);
  if (itemId) {
    return {
      pathname: '/(tabs)/inventory/[id]',
      params: { id: itemId },
    };
  }

  return null;
}

export function parsePushPayloadData(payload: Record<string, unknown>) {
  const nestedData =
    payload.data && typeof payload.data === 'object' ? (payload.data as Record<string, unknown>) : payload;

  const listingId = readString(nestedData.listing_id) ?? readString(payload.listing_id);
  const transactionId = readString(nestedData.transaction_id) ?? readString(payload.transaction_id);
  const senderId = readString(nestedData.sender_id) ?? readString(payload.sender_id);
  const senderName = readString(nestedData.sender_name) ?? readString(payload.sender_name);
  const itemName = readString(nestedData.item_name) ?? readString(payload.item_name);

  return {
    listing_id: listingId ?? undefined,
    transaction_id: transactionId ?? undefined,
    sender_id: senderId ?? undefined,
    sender_name: senderName ?? undefined,
    item_name: itemName ?? undefined,
  } satisfies NotificationData;
}
