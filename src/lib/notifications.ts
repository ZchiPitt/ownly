/**
 * Notifications helper for in-app notifications
 */

import { supabase } from '@/lib/supabase';
import type { NotificationType } from '@/types/database';

export type MarketplaceNotificationType = 'purchase_request' | 'request_accepted' | 'request_declined';

interface NotificationPayload {
  listing_id: string;
  transaction_id: string;
  message?: string;
}

function getNotificationContent(type: MarketplaceNotificationType, data: NotificationPayload) {
  switch (type) {
    case 'purchase_request':
      return {
        title: 'New purchase request',
        body: data.message ? `Message: ${data.message}` : 'You have a new purchase request.',
      };
    case 'request_accepted':
      return {
        title: 'Purchase request accepted',
        body: 'Your purchase request was accepted. Coordinate pickup and payment.',
      };
    case 'request_declined':
      return {
        title: 'Purchase request declined',
        body: 'Your purchase request was declined. You can submit another offer.',
      };
    default:
      return {
        title: 'Marketplace update',
        body: data.message ?? null,
      };
  }
}

export async function createNotification(
  userId: string,
  type: MarketplaceNotificationType,
  data: NotificationPayload
): Promise<void> {
  const { title, body } = getNotificationContent(type, data);
  const dbType: NotificationType = 'system';

  const { error } = await (supabase.from('notifications') as ReturnType<typeof supabase.from>)
    .insert({
      user_id: userId,
      type: dbType,
      title,
      body,
      item_id: null,
    } as Record<string, unknown>);

  if (error) {
    throw new Error(error.message);
  }
}
