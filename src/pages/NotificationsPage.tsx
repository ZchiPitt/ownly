/**
 * Notifications Page - View and manage in-app notifications
 * Shows list of notifications with unread indicators and mark as read functionality
 * Organized into Messages and Reminders tabs with unread count badges
 */

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { useReviews, type PendingReviewTransaction } from '@/hooks/useReviews';
import { ReviewModal } from '@/components/ReviewModal';
import type { MarketplaceNotificationType } from '@/lib/notifications';
import type { Notification, NotificationData, NotificationType } from '@/types';

// Tab definitions
type NotificationTab = 'messages' | 'reminders';

// Notification types for each tab
const MESSAGE_TYPES: NotificationType[] = [
  'new_inquiry',
  'purchase_request',
  'request_accepted',
  'request_declined',
  'new_message',
  'transaction_complete',
];

const REMINDER_TYPES: NotificationType[] = [
  'unused_item',
  'expiring_item',
  'warranty_expiring',
  'custom_reminder',
  'system',
];

const MARKETPLACE_TYPES: MarketplaceNotificationType[] = [
  'new_inquiry',
  'purchase_request',
  'request_accepted',
  'request_declined',
  'new_message',
  'transaction_complete',
];

const MARKETPLACE_ICONS: Record<MarketplaceNotificationType, string> = {
  new_inquiry: '💬',
  purchase_request: '🛒',
  request_accepted: '✅',
  request_declined: '❌',
  new_message: '💬',
  transaction_complete: '🎉',
};

const MARKETPLACE_ICON_COLORS: Record<MarketplaceNotificationType, string> = {
  new_inquiry: 'text-sky-600 bg-sky-100',
  purchase_request: 'text-indigo-600 bg-indigo-100',
  request_accepted: 'text-emerald-600 bg-emerald-100',
  request_declined: 'text-rose-600 bg-rose-100',
  new_message: 'text-sky-600 bg-sky-100',
  transaction_complete: 'text-amber-600 bg-amber-100',
};

function isMarketplaceType(type: NotificationType): type is MarketplaceNotificationType {
  return MARKETPLACE_TYPES.includes(type as MarketplaceNotificationType);
}

/**
 * Get relative time string from date
 */
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return 'Just now';
  } else if (diffMins < 60) {
    return diffMins === 1 ? '1 minute ago' : `${diffMins} minutes ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}

/**
 * Date group types for notification grouping
 */
type DateGroup = 'today' | 'yesterday' | 'this_week' | 'earlier';

const DATE_GROUP_LABELS: Record<DateGroup, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  this_week: 'This Week',
  earlier: 'Earlier',
};

/**
 * Determine which date group a notification belongs to
 */
function getDateGroup(dateString: string): DateGroup {
  const date = new Date(dateString);
  const now = new Date();

  // Reset time components for accurate day comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Calculate start of this week (Sunday)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(startOfWeek.getDate() - today.getDay());

  const notificationDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (notificationDate.getTime() >= today.getTime()) {
    return 'today';
  } else if (notificationDate.getTime() >= yesterday.getTime()) {
    return 'yesterday';
  } else if (notificationDate.getTime() >= startOfWeek.getTime()) {
    return 'this_week';
  } else {
    return 'earlier';
  }
}

/**
 * Group notifications by date
 */
function groupNotificationsByDate(notifications: Notification[]): Map<DateGroup, Notification[]> {
  const groups = new Map<DateGroup, Notification[]>();

  // Initialize all groups to maintain order
  const groupOrder: DateGroup[] = ['today', 'yesterday', 'this_week', 'earlier'];
  groupOrder.forEach(group => groups.set(group, []));

  // Notifications are already sorted by created_at (newest first)
  // Group them while maintaining that order within each group
  notifications.forEach(notification => {
    const group = getDateGroup(notification.created_at);
    groups.get(group)!.push(notification);
  });

  return groups;
}

/**
 * Get icon component based on notification type
 */
function NotificationIcon({ type }: { type: NotificationType }) {
  if (isMarketplaceType(type)) {
    return (
      <span className="text-lg leading-none" aria-hidden="true">
        {MARKETPLACE_ICONS[type]}
      </span>
    );
  }

  switch (type) {
    case 'unused_item':
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case 'expiring_item':
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      );
    case 'warranty_expiring':
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      );
    case 'custom_reminder':
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      );
    case 'system':
    default:
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
  }
}

/**
 * Get icon color classes based on notification type
 */
function getIconColorClasses(type: NotificationType): string {
  if (isMarketplaceType(type)) {
    return MARKETPLACE_ICON_COLORS[type];
  }

  switch (type) {
    case 'unused_item':
      return 'text-blue-600 bg-blue-100';
    case 'expiring_item':
      return 'text-amber-600 bg-amber-100';
    case 'warranty_expiring':
      return 'text-purple-600 bg-purple-100';
    case 'custom_reminder':
      return 'text-teal-600 bg-teal-100';
    case 'system':
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

/**
 * Skeleton component for notification item loading state
 */
function NotificationItemSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4 bg-white border-b border-gray-100">
      {/* Icon skeleton */}
      <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
      {/* Content skeleton */}
      <div className="flex-1 min-w-0">
        <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="w-full h-3 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="w-20 h-3 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Notification item component
 */
interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
}

function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const isUnread = !notification.is_read;
  const iconColorClasses = getIconColorClasses(notification.type);

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 p-4 text-left transition-colors hover:bg-gray-50 active:bg-gray-100 border-b border-gray-100 ${
        isUnread ? 'bg-blue-50/50' : 'bg-white'
      }`}
    >
      {/* Type icon */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconColorClasses}`}
      >
        <NotificationIcon type={notification.type} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          {/* Title */}
          <p
            className={`text-sm flex-1 ${
              isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
            }`}
          >
            {notification.title}
          </p>

          {/* Unread indicator */}
          {isUnread && (
            <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5" />
          )}
        </div>

        {/* Body preview */}
        {notification.body && (
          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
            {notification.body}
          </p>
        )}

        {/* Relative time */}
        <p className="text-xs text-gray-400 mt-1">
          {getRelativeTime(notification.created_at)}
        </p>
      </div>
    </button>
  );
}

/**
 * Empty state component
 */
function EmptyState({ tab }: { tab: NotificationTab }) {
  const isMessages = tab === 'messages';

  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {/* Icon with muted styling */}
      <div className="w-16 h-16 mb-4 bg-gray-100 rounded-full flex items-center justify-center">
        {isMessages ? (
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        ) : (
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        )}
      </div>

      <h2 className="text-lg font-medium text-gray-900 mb-1">
        {isMessages ? 'No messages yet' : 'No reminders yet'}
      </h2>
      <p className="text-sm text-gray-500 max-w-xs">
        {isMessages
          ? 'When you receive messages from buyers or sellers, they\'ll appear here.'
          : 'When you receive reminders about your items, they\'ll appear here.'}
      </p>
    </div>
  );
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    notifications,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const { getPendingReviews } = useReviews();

  const [pendingReviews, setPendingReviews] = useState<PendingReviewTransaction[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [selectedReview, setSelectedReview] = useState<PendingReviewTransaction | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Calculate unread counts per tab and group notifications by date
  const { messagesUnreadCount, remindersUnreadCount, filteredNotifications, groupedNotifications, activeTab } = useMemo(() => {
    const messagesUnread = notifications.filter(
      (n) => MESSAGE_TYPES.includes(n.type) && !n.is_read
    ).length;
    const remindersUnread = notifications.filter(
      (n) => REMINDER_TYPES.includes(n.type) && !n.is_read
    ).length;

    // Determine active tab from URL param or default based on unread
    const tabParam = searchParams.get('tab') as NotificationTab | null;
    let tab: NotificationTab;
    if (tabParam === 'messages' || tabParam === 'reminders') {
      tab = tabParam;
    } else {
      // Default: messages if any unread messages exist, otherwise reminders
      tab = messagesUnread > 0 ? 'messages' : 'reminders';
    }

    // Filter notifications based on active tab
    const types = tab === 'messages' ? MESSAGE_TYPES : REMINDER_TYPES;
    const filtered = notifications.filter((n) => types.includes(n.type));

    // Group filtered notifications by date
    const grouped = groupNotificationsByDate(filtered);

    return {
      messagesUnreadCount: messagesUnread,
      remindersUnreadCount: remindersUnread,
      filteredNotifications: filtered,
      groupedNotifications: grouped,
      activeTab: tab,
    };
  }, [notifications, searchParams]);

  // Handle tab change
  const handleTabChange = useCallback((tab: NotificationTab) => {
    setSearchParams({ tab }, { replace: true });
  }, [setSearchParams]);

  const fetchPendingReviews = useCallback(async () => {
    setIsLoadingReviews(true);
    try {
      const data = await getPendingReviews();
      setPendingReviews(data);
    } catch (err) {
      console.error('Failed to load pending reviews:', err);
    } finally {
      setIsLoadingReviews(false);
    }
  }, [getPendingReviews]);

  useEffect(() => {
    fetchPendingReviews();
  }, [fetchPendingReviews]);

  const getNotificationTarget = (notification: Notification): string | null => {
    const data = notification.data as NotificationData | null;
    const listingId = data?.listing_id;

    if (notification.type === 'new_message' || notification.type === 'request_accepted') {
      return listingId ? `/messages/${listingId}` : null;
    }

    if (
      notification.type === 'new_inquiry' ||
      notification.type === 'purchase_request' ||
      notification.type === 'request_declined' ||
      notification.type === 'transaction_complete'
    ) {
      return listingId ? `/marketplace/${listingId}` : null;
    }

    if (notification.item_id) {
      return `/item/${notification.item_id}`;
    }

    return null;
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    const target = getNotificationTarget(notification);
    if (target) {
      navigate(target);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleOpenReview = (review: PendingReviewTransaction) => {
    setSelectedReview(review);
    setIsReviewModalOpen(true);
  };

  const handleReviewSuccess = () => {
    fetchPendingReviews();
  };

  return (
    <div className="min-h-full bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            {/* Back button */}
            <button
              onClick={handleBack}
              className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Go back"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            {/* Title */}
            <h1 className="text-xl font-semibold text-gray-900">Notifications</h1>
          </div>

          {/* Mark All Read link */}
          {(messagesUnreadCount > 0 || remindersUnreadCount > 0) && (
            <button
              onClick={markAllAsRead}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Mark All Read
            </button>
          )}
        </div>

        {/* Tab Bar */}
        <div className="flex border-t border-gray-100">
          <button
            onClick={() => handleTabChange('messages')}
            className={`flex-1 relative py-3 text-sm font-medium transition-colors ${
              activeTab === 'messages'
                ? 'text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              Messages
              {messagesUnreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold text-white bg-blue-600 rounded-full">
                  {messagesUnreadCount > 99 ? '99+' : messagesUnreadCount}
                </span>
              )}
            </span>
            {activeTab === 'messages' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
          <button
            onClick={() => handleTabChange('reminders')}
            className={`flex-1 relative py-3 text-sm font-medium transition-colors ${
              activeTab === 'reminders'
                ? 'text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              Reminders
              {remindersUnreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold text-white bg-blue-600 rounded-full">
                  {remindersUnreadCount > 99 ? '99+' : remindersUnreadCount}
                </span>
              )}
            </span>
            {activeTab === 'reminders' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="pb-20">
        <div className="px-4 pt-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Pending Reviews</h2>
              {isLoadingReviews && <span className="text-xs text-gray-500">Loading...</span>}
            </div>
            {pendingReviews.length === 0 ? (
              <p className="text-sm text-gray-500">You're all caught up.</p>
            ) : (
              <div className="space-y-3">
                {pendingReviews.map((review) => (
                  <div
                    key={review.id}
                    className="border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        How was your experience with {review.other_user.display_name ?? 'this member'}?
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {review.listing.item_name ?? 'Transaction'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenReview(review)}
                      className="px-3 py-2 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
                    >
                      Leave Review
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          // Loading skeletons
          <div>
            <NotificationItemSkeleton />
            <NotificationItemSkeleton />
            <NotificationItemSkeleton />
            <NotificationItemSkeleton />
            <NotificationItemSkeleton />
          </div>
        ) : error ? (
          // Error state
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="w-16 h-16 mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-1">
              Couldn't load notifications
            </h2>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          // Empty state
          <EmptyState tab={activeTab} />
        ) : (
          // Notifications list grouped by date
          <div>
            {(['today', 'yesterday', 'this_week', 'earlier'] as const).map((group) => {
              const groupNotifications = groupedNotifications.get(group) || [];
              if (groupNotifications.length === 0) return null;

              return (
                <div key={group}>
                  {/* Section header */}
                  <div className="sticky top-[116px] z-[5] px-4 py-2 bg-gray-100 border-b border-gray-200">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {DATE_GROUP_LABELS[group]}
                    </h3>
                  </div>
                  {/* Notifications in this group */}
                  {groupNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedReview && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          transaction={{
            id: selectedReview.id,
            listing: { item_name: selectedReview.listing.item_name },
            other_user: {
              id: selectedReview.other_user.id,
              display_name: selectedReview.other_user.display_name,
            },
          }}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
}
