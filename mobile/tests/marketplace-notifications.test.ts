import test from 'node:test';
import assert from 'node:assert/strict';

import { getMarketplaceNotificationContent } from '../lib/marketplaceNotificationContent';

test('getMarketplaceNotificationContent builds inquiry title/body', () => {
  const result = getMarketplaceNotificationContent('new_inquiry', {
    sender_name: 'Taylor',
    item_name: 'Standing Desk',
  });

  assert.equal(result.title, 'New inquiry from Taylor');
  assert.equal(result.body, 'Standing Desk');
});

test('getMarketplaceNotificationContent truncates long message preview', () => {
  const longPreview = 'x'.repeat(120);
  const result = getMarketplaceNotificationContent('new_message', {
    sender_name: 'Chris',
    item_name: 'Chair',
    message_preview: longPreview,
  });

  assert.equal(result.title, 'New message from Chris');
  assert.equal(result.body.length, 83);
  assert.ok(result.body.endsWith('...'));
});

test('getMarketplaceNotificationContent has stable fallback wording', () => {
  const result = getMarketplaceNotificationContent('transaction_complete', {
    sender_name: 'Any',
    item_name: 'Any',
  });

  assert.equal(result.title, 'Transaction complete!');
  assert.equal(result.body, 'Leave a review for this transaction');
});
