/**
 * Notifications helper for in-app notifications
 */

import { supabase } from '@/lib/supabase';
import type { NotificationType } from '@/types/database';

export type MarketplaceNotificationType =
  | 'new_inquiry'
  | 'purchase_request'
  | 'request_accepted'
  | 'request_declined'
  | 'new_message'
  | 'transaction_complete';

export interface MarketplaceNotificationData {
  listing_id?: string;
  transaction_id?: string;
  sender_id?: string;
  sender_name?: string;
  item_name?: string;
  /** Message preview for new_message notifications (first 50 chars) */
  message_preview?: string;
}

export interface MarketplaceNotification {
  id: string;
  user_id: string;
  type: MarketplaceNotificationType;
  title: string;
  body: string;
  data: MarketplaceNotificationData;
  read_at: string | null;
  created_at: string;
}

function getNotificationContent(
  type: MarketplaceNotificationType,
  data: MarketplaceNotificationData
): { title: string; body: string } {
  const senderName = data.sender_name ?? 'Someone';
  const itemName = data.item_name ?? 'an item';

  switch (type) {
    case 'new_inquiry':
      return {
        title: 'New inquiry',
        body: `${senderName} asked about ${itemName}`,
      };
    case 'purchase_request':
      return {
        title: 'New purchase request',
        body: `${senderName} wants to buy ${itemName}`,
      };
    case 'request_accepted':
      return {
        title: 'Request accepted!',
        body: `${senderName} accepted your request for ${itemName}`,
      };
    case 'request_declined':
      return {
        title: 'Request declined',
        body: `${senderName} declined your request for ${itemName}`,
      };
    case 'new_message': {
      // Format: "New message from {sender_name}" / message preview (first 50 chars)
      const messagePreview = data.message_preview ?? '';
      const truncatedPreview = messagePreview.length > 50
        ? `${messagePreview.slice(0, 50)}...`
        : messagePreview;
      return {
        title: `New message from ${senderName}`,
        body: truncatedPreview || `Message about ${itemName}`,
      };
    }
    case 'transaction_complete':
    default:
      return {
        title: 'Transaction complete!',
        body: `${senderName} marked the transaction for ${itemName} complete`,
      };
  }
}

export async function createMarketplaceNotification(
  recipientUserId: string,
  type: MarketplaceNotificationType,
  data: MarketplaceNotificationData
): Promise<void> {
  const { title, body } = getNotificationContent(type, data);
  const dbType: NotificationType = type;

  const { error } = await (supabase.from('notifications') as ReturnType<typeof supabase.from>)
    .insert({
      user_id: recipientUserId,
      type: dbType,
      title,
      body,
      item_id: null,
      data,
    } as Record<string, unknown>);

  if (error) {
    throw new Error(error.message);
  }
}
