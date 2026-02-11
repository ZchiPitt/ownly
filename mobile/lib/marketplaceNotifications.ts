import type { NotificationType } from '../../src/types/database';

import {
  getMarketplaceNotificationContent,
  type MarketplaceNotificationData,
  type MarketplaceNotificationType,
} from './marketplaceNotificationContent';
import { supabase } from './supabase';

export {
  getMarketplaceNotificationContent,
  type MarketplaceNotificationData,
  type MarketplaceNotificationType,
} from './marketplaceNotificationContent';

export async function createMarketplaceNotification(
  recipientUserId: string,
  type: MarketplaceNotificationType,
  data: MarketplaceNotificationData
): Promise<void> {
  const { title, body } = getMarketplaceNotificationContent(type, data);
  const dbType = type as NotificationType;

  const { error } = await (supabase.from('notifications') as ReturnType<typeof supabase.from>).insert({
    user_id: recipientUserId,
    type: dbType,
    title,
    body,
    item_id: null,
    data,
  } as Record<string, unknown>);

  if (error) {
    throw error;
  }
}
