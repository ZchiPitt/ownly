import test from 'node:test';
import assert from 'node:assert/strict';

import { parsePushPayloadData, resolveNotificationTarget } from '../lib/notificationRouting';

test('resolveNotificationTarget routes marketplace chat notification to chat route', () => {
  const target = resolveNotificationTarget({
    type: 'new_message',
    data: { listing_id: 'listing-123' },
  });

  assert.deepEqual(target, {
    pathname: '/(tabs)/marketplace/messages/[listingId]',
    params: { listingId: 'listing-123' },
  });
});

test('resolveNotificationTarget routes listing-only notification to listing detail route', () => {
  const target = resolveNotificationTarget({
    type: 'system',
    data: { listing_id: 'listing-456' },
  });

  assert.deepEqual(target, {
    pathname: '/(tabs)/marketplace/[id]',
    params: { id: 'listing-456' },
  });
});

test('resolveNotificationTarget routes inventory item notifications to inventory detail', () => {
  const target = resolveNotificationTarget({
    type: 'system',
    itemId: 'item-001',
  });

  assert.deepEqual(target, {
    pathname: '/(tabs)/inventory/[id]',
    params: { id: 'item-001' },
  });
});

test('parsePushPayloadData normalizes nested payload values', () => {
  const parsed = parsePushPayloadData({
    data: {
      listing_id: 'listing-1',
      transaction_id: 'tx-1',
      sender_id: 'user-2',
      sender_name: 'Alex',
      item_name: 'Desk Lamp',
    },
  });

  assert.deepEqual(parsed, {
    listing_id: 'listing-1',
    transaction_id: 'tx-1',
    sender_id: 'user-2',
    sender_name: 'Alex',
    item_name: 'Desk Lamp',
  });
});
