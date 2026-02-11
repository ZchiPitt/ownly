import type { NotificationData } from '../../src/types/database';

export type MarketplaceNotificationType =
  | 'new_inquiry'
  | 'purchase_request'
  | 'request_accepted'
  | 'request_declined'
  | 'new_message'
  | 'transaction_complete';

export type MarketplaceNotificationData = NotificationData & {
  message_preview?: string;
};

export function getMarketplaceNotificationContent(
  type: MarketplaceNotificationType,
  data: MarketplaceNotificationData
): { title: string; body: string } {
  const senderName = data.sender_name?.trim() || 'Someone';
  const itemName = data.item_name?.trim() || 'an item';

  switch (type) {
    case 'new_inquiry':
      return {
        title: `New inquiry from ${senderName}`,
        body: itemName,
      };
    case 'purchase_request':
      return {
        title: `${senderName} wants to buy ${itemName}`,
        body: 'Tap to view the purchase request',
      };
    case 'request_accepted':
      return {
        title: `${senderName} accepted your request`,
        body: `Your request for ${itemName} was accepted`,
      };
    case 'request_declined':
      return {
        title: `${senderName} declined your request`,
        body: 'Your purchase request was declined',
      };
    case 'new_message': {
      const preview = (data.message_preview || '').trim();
      const truncatedPreview = preview.length > 80 ? `${preview.slice(0, 80)}...` : preview;
      return {
        title: `New message from ${senderName}`,
        body: truncatedPreview || `Message about ${itemName}`,
      };
    }
    case 'transaction_complete':
      return {
        title: 'Transaction complete!',
        body: 'Leave a review for this transaction',
      };
    default:
      return {
        title: 'Marketplace update',
        body: 'You have a new marketplace update',
      };
  }
}
