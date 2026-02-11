import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { NotificationData, NotificationType } from '../../src/types/database';
import { supabase } from '../lib/supabase';

type NotificationRow = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  item_id: string | null;
  data: NotificationData | null;
  is_read: boolean;
  created_at: string;
};

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  itemId: string | null;
  data: NotificationData | null;
  isRead: boolean;
  createdAt: string;
};

async function fetchNotifications(userId: string): Promise<AppNotification[]> {
  const { data, error } = await (supabase.from('notifications') as ReturnType<typeof supabase.from>)
    .select('id, user_id, type, title, body, item_id, data, is_read, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as NotificationRow[]).map((notification) => ({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    itemId: notification.item_id,
    data: notification.data,
    isRead: notification.is_read,
    createdAt: notification.created_at,
  }));
}

export function useNotifications(userId: string | undefined) {
  return useQuery({
    queryKey: ['app-notifications', userId],
    enabled: Boolean(userId),
    queryFn: () => fetchNotifications(userId as string),
  });
}

type MarkNotificationReadInput = {
  userId: string;
  notificationId: string;
};

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, notificationId }: MarkNotificationReadInput) => {
      const { error } = await (supabase.from('notifications') as ReturnType<typeof supabase.from>)
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['app-notifications'] });
    },
  });
}
