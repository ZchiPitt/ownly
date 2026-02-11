import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

import type { NotificationType } from '../../src/types/database';
import { parsePushPayloadData, resolveNotificationTarget } from '../lib/notificationRouting';

function getPayload(notification: Notifications.Notification | Notifications.NotificationResponse) {
  const source = 'notification' in notification ? notification.notification : notification;
  return source.request.content.data ?? {};
}

export function usePushNotificationRouting() {
  const router = useRouter();

  useEffect(() => {
    const handleRoute = (notification: Notifications.Notification | Notifications.NotificationResponse) => {
      const payload = getPayload(notification) as Record<string, unknown>;
      const typeValue = payload.notification_type ?? payload.type;
      const type = typeof typeValue === 'string' ? (typeValue as NotificationType) : 'system';
      const data = parsePushPayloadData(payload);
      const itemId = typeof payload.item_id === 'string' ? payload.item_id : null;
      const target = resolveNotificationTarget({
        type,
        data,
        itemId,
      });

      if (target) {
        router.push({ pathname: target.pathname, params: target.params });
      }
    };

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      handleRoute(response);
    });

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleRoute(response);
      }
    });

    return () => {
      responseSubscription.remove();
    };
  }, [router]);
}
