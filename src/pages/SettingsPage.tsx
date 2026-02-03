/**
 * Settings Page
 * Allows users to configure preferences and log out
 * US-020: Create logout functionality in settings
 * US-064: Create Settings page - reminder settings section
 * US-065: Implement push notification permission flow
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { useUserSettings } from '@/hooks/useUserSettings';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useToast } from '@/hooks/useToast';

// Unused item reminder threshold options (days)
const UNUSED_THRESHOLD_OPTIONS = [
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' },
  { value: 180, label: '180 days' },
  { value: 365, label: '1 year' },
];

// Expiration reminder options (days before) - used in Reminders & Notifications section
const EXPIRATION_REMINDER_OPTIONS = [
  { value: 3, label: '3 days before' },
  { value: 7, label: '7 days before' },
  { value: 14, label: '14 days before' },
  { value: 30, label: '30 days before' },
];

// Expiry reminder options for Item Reminders section (per US-015)
const EXPIRY_REMINDER_OPTIONS = [
  { value: 1, label: '1 day before' },
  { value: 3, label: '3 days before' },
  { value: 7, label: '7 days before' },
  { value: 14, label: '14 days before' },
];

// Warranty reminder options (days before)
const WARRANTY_REMINDER_OPTIONS = [
  { value: 7, label: '7 days before' },
  { value: 14, label: '14 days before' },
  { value: 30, label: '30 days before' },
  { value: 60, label: '60 days before' },
];

function TagIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 7h.01M3 11l8.586 8.586a2 2 0 002.828 0l6.586-6.586a2 2 0 000-2.828L12.414 1.586a2 2 0 00-1.414-.586H5a2 2 0 00-2 2v6.586a2 2 0 00.586 1.414z"
      />
    </svg>
  );
}

function ChevronRightIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function ChatBubbleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8L3 20l1.2-4A7.76 7.76 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

function HeartIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 10-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
      />
    </svg>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { getUnreadCount } = useMessages();
  const { settings, updateSettings, isLoading: isLoadingSettings } = useUserSettings();
  const {
    permissionState,
    isSupported: isPushSupported,
    isRequesting: isRequestingPush,
    requestPermission,
    unsubscribe: unsubscribePush,
  } = usePushNotifications();
  const { success, error } = useToast();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editingName, setEditingName] = useState(user?.user_metadata?.display_name || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadUnreadCount = async () => {
      const count = await getUnreadCount();
      setUnreadCount(count);
    };

    loadUnreadCount();

    const handleFocus = () => {
      loadUnreadCount();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [getUnreadCount]);

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  // Handle settings updates with optimistic UI
  const handleSettingChange = async (
    key: 'reminder_enabled' | 'reminder_threshold_days' | 'expiration_reminder_days' | 'push_notifications_enabled' | 'default_view'
      | 'marketplace_new_inquiry_enabled'
      | 'marketplace_purchase_request_enabled'
      | 'marketplace_request_accepted_enabled'
      | 'marketplace_request_declined_enabled'
      | 'marketplace_new_message_enabled'
      | 'marketplace_transaction_complete_enabled'
      | 'warranty_reminder_enabled'
      | 'warranty_reminder_days'
      | 'custom_reminder_enabled',
    value: boolean | number | string
  ) => {
    if (isUpdating || isRequestingPush) return;

    // Special handling for push notifications toggle
    if (key === 'push_notifications_enabled' && value === true) {
      await handleEnablePushNotifications();
      return;
    }

    // If disabling push notifications, also unsubscribe
    if (key === 'push_notifications_enabled' && value === false) {
      await handleDisablePushNotifications();
      return;
    }

    setIsUpdating(true);
    const success = await updateSettings({ [key]: value });
    setIsUpdating(false);

    if (!success) {
      error('Failed to update setting');
    }
  };

  // Handle enabling push notifications
  const handleEnablePushNotifications = async () => {
    if (!isPushSupported) {
      error('Push notifications are not supported in this browser');
      return;
    }

    const result = await requestPermission();

    if (result === 'granted') {
      // Update user settings in database
      setIsUpdating(true);
      const updateSuccess = await updateSettings({ push_notifications_enabled: true });
      setIsUpdating(false);

      if (updateSuccess) {
        success('Push notifications enabled');
      } else {
        error('Failed to save notification setting');
      }
    } else if (result === 'denied') {
      error('Notifications blocked. Please enable in browser settings.');
    } else {
      error('Failed to enable notifications');
    }
  };

  // Handle disabling push notifications
  const handleDisablePushNotifications = async () => {
    // Unsubscribe from push notifications
    await unsubscribePush();

    // Update user settings in database
    setIsUpdating(true);
    const success = await updateSettings({ push_notifications_enabled: false });
    setIsUpdating(false);

    if (!success) {
      error('Failed to update setting');
    }
  };

  const handleCancelLogout = () => {
    setShowLogoutDialog(false);
  };

  const handleEditProfileClick = () => {
    setEditingName(user?.user_metadata?.display_name || '');
    setShowEditProfile(true);
  };

  const handleCancelEditProfile = () => {
    setShowEditProfile(false);
    setEditingName(user?.user_metadata?.display_name || '');
  };

  const handleSaveEditProfile = async () => {
    // Validate input
    const name = editingName.trim();
    if (!name) {
      error('Display name cannot be empty');
      return;
    }

    if (name.length > 50) {
      error('Display name must be 50 characters or less');
      return;
    }

    setIsSavingName(true);
    try {
      // Update the user metadata in Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        data: { display_name: name },
      });

      if (updateError) {
        console.error('Error updating display name:', updateError);
        error('Failed to update display name');
      } else {
        success('Display name updated successfully');
        setShowEditProfile(false);
      }
    } catch (err) {
      console.error('Error updating display name:', err);
      error('Failed to update display name');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      const { error: signOutError } = await signOut();
      if (signOutError) {
        throw signOutError;
      }
      // Use hard redirect to ensure clean state - avoids React routing race conditions
      window.location.href = '/login';
    } catch {
      setIsLoggingOut(false);
      setShowLogoutDialog(false);
      error('Failed to log out. Please try again.');
    }
  };

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Settings Content */}
      <div className="p-4 space-y-6">
        {/* Account Section - US-088 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Account
          </h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* User Profile Info */}
            <div className="px-4 py-4 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                {/* User Avatar or Initials */}
                <div className="h-14 w-14 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  {user?.user_metadata?.display_name
                    ? user.user_metadata.display_name
                      .split(' ')
                      .map((n: string) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()
                    : user?.email?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  {/* Display Name */}
                  <h3 className="text-base font-semibold text-gray-900">
                    {user?.user_metadata?.display_name || 'User'}
                  </h3>
                  {/* Email */}
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Edit Profile Button */}
            <button
              onClick={handleEditProfileClick}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between border-b border-gray-100 last:border-b-0"
            >
              <div>
                <p className="text-base font-medium text-gray-900">Edit Profile</p>
                <p className="text-sm text-gray-500">Change your display name</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Change Password Link */}
            <button
              onClick={() => navigate('/reset-password')}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <div>
                <p className="text-base font-medium text-gray-900">Change Password</p>
                <p className="text-sm text-gray-500">Reset your password</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>

            {/* My Listings Link */}
            <Link
              to="/my-listings"
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors border-t border-gray-100"
            >
              <div className="flex items-center gap-3">
                <TagIcon className="w-5 h-5 text-gray-500" />
                <span className="text-base font-medium text-gray-900">My Listings</span>
              </div>
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            </Link>

            {/* Saved Listings Link */}
            <Link
              to="/saved-listings"
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors border-t border-gray-100"
            >
              <div className="flex items-center gap-3">
                <HeartIcon className="w-5 h-5 text-gray-500" />
                <span className="text-base font-medium text-gray-900">Saved Listings</span>
              </div>
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            </Link>

            {/* Messages Link */}
            <Link
              to="/messages"
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors border-t border-gray-100"
            >
              <div className="flex items-center gap-3">
                <ChatBubbleIcon className="w-5 h-5 text-gray-500" />
                <span className="text-base font-medium text-gray-900">Messages</span>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-teal-600 text-white text-xs font-semibold">
                    {unreadCount}
                  </span>
                )}
                <ChevronRightIcon className="w-5 h-5 text-gray-400" />
              </div>
            </Link>
          </div>
        </section>

        {/* Reminders & Notifications Section - US-064 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Reminders & Notifications
          </h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Loading state */}
            {isLoadingSettings ? (
              <div className="px-4 py-4 flex items-center justify-center">
                <div className="animate-pulse flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded-full" />
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                </div>
              </div>
            ) : (
              <>
                {/* Master Toggle: Enable Reminders */}
                <div className="px-4 py-4 flex items-center justify-between border-b border-gray-100">
                  <div className="flex-1">
                    <label htmlFor="reminder-toggle" className="text-base font-medium text-gray-900">
                      Enable Reminders
                    </label>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Get notified about unused and expiring items
                    </p>
                  </div>
                  <button
                    id="reminder-toggle"
                    role="switch"
                    aria-checked={settings?.reminder_enabled ?? true}
                    onClick={() => handleSettingChange('reminder_enabled', !settings?.reminder_enabled)}
                    disabled={isUpdating}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${settings?.reminder_enabled ? 'bg-teal-600' : 'bg-gray-200'
                      }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings?.reminder_enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                    />
                  </button>
                </div>

                {/* Sub-options (shown when reminders enabled) */}
                {settings?.reminder_enabled && (
                  <div className="pl-8">
                    {/* Unused Item Reminder Threshold */}
                    <div className="px-4 py-4 flex items-center justify-between border-b border-gray-100">
                      <div className="flex-1 pr-4">
                        <label htmlFor="unused-threshold" className="text-sm font-medium text-gray-900">
                          Unused Item Reminder
                        </label>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Remind about items not viewed for
                        </p>
                      </div>
                      <select
                        id="unused-threshold"
                        value={settings?.reminder_threshold_days ?? 90}
                        onChange={(e) => handleSettingChange('reminder_threshold_days', parseInt(e.target.value, 10))}
                        disabled={isUpdating}
                        className="block w-32 rounded-md border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {UNUSED_THRESHOLD_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Expiration Reminder Days */}
                    <div className="px-4 py-4 flex items-center justify-between border-b border-gray-100">
                      <div className="flex-1 pr-4">
                        <label htmlFor="expiration-reminder" className="text-sm font-medium text-gray-900">
                          Expiration Reminder
                        </label>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Remind before items expire
                        </p>
                      </div>
                      <select
                        id="expiration-reminder"
                        value={settings?.expiration_reminder_days ?? 7}
                        onChange={(e) => handleSettingChange('expiration_reminder_days', parseInt(e.target.value, 10))}
                        disabled={isUpdating}
                        className="block w-40 rounded-md border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {EXPIRATION_REMINDER_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Push Notifications Toggle */}
                    <div className="px-4 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <label htmlFor="push-toggle" className="text-sm font-medium text-gray-900">
                            Push Notifications
                          </label>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Receive reminders on your device
                          </p>
                        </div>
                        {isPushSupported ? (
                          <button
                            id="push-toggle"
                            role="switch"
                            aria-checked={settings?.push_notifications_enabled ?? false}
                            onClick={() => handleSettingChange('push_notifications_enabled', !settings?.push_notifications_enabled)}
                            disabled={isUpdating || isRequestingPush}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${settings?.push_notifications_enabled ? 'bg-teal-600' : 'bg-gray-200'
                              }`}
                          >
                            {isRequestingPush ? (
                              <span className="pointer-events-none inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow">
                                <svg
                                  className="animate-spin h-3 w-3 text-teal-500"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  />
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </span>
                            ) : (
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings?.push_notifications_enabled ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                              />
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">Not supported</span>
                        )}
                      </div>

                      {/* Notifications blocked message */}
                      {isPushSupported && permissionState === 'denied' && (
                        <div className="mt-2 p-2 bg-amber-50 rounded-md border border-amber-200">
                          <p className="text-xs text-amber-800">
                            Notifications blocked in browser settings.{' '}
                            <button
                              type="button"
                              onClick={() => {
                                error('Go to browser settings > Site Settings > Notifications to enable');
                              }}
                              className="font-medium underline hover:no-underline"
                            >
                              How to enable
                            </button>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Push Notifications Section - US-013 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Notifications
          </h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Master Toggle: Enable Push Notifications */}
            <div className="px-4 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label htmlFor="push-notifications-master" className="text-base font-medium text-gray-900">
                    Enable Push Notifications
                  </label>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Receive alerts on your device for messages and reminders
                  </p>
                </div>
                {isPushSupported ? (
                  <button
                    id="push-notifications-master"
                    role="switch"
                    aria-checked={settings?.push_notifications_enabled ?? false}
                    onClick={() => handleSettingChange('push_notifications_enabled', !settings?.push_notifications_enabled)}
                    disabled={isUpdating || isRequestingPush || permissionState === 'denied'}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      settings?.push_notifications_enabled && permissionState === 'granted' ? 'bg-teal-600' : 'bg-gray-200'
                    }`}
                  >
                    {isRequestingPush ? (
                      <span className="pointer-events-none inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow">
                        <svg
                          className="animate-spin h-3 w-3 text-teal-500"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      </span>
                    ) : (
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          settings?.push_notifications_enabled && permissionState === 'granted' ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    )}
                  </button>
                ) : (
                  <span className="text-sm text-gray-400">Not supported</span>
                )}
              </div>
            </div>

            {/* Permission Status Display */}
            {isPushSupported && (
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  {permissionState === 'granted' && (
                    <>
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-green-700">Notifications allowed</span>
                    </>
                  )}
                  {permissionState === 'denied' && (
                    <>
                      <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-red-700">Notifications blocked</span>
                    </>
                  )}
                  {permissionState === 'default' && (
                    <>
                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-600">Permission not yet requested</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Instructions for denied state */}
            {isPushSupported && permissionState === 'denied' && (
              <div className="px-4 py-4 bg-amber-50">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800">
                      Notifications are blocked in your browser
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      To enable notifications, you'll need to update your browser settings:
                    </p>
                    <ul className="text-sm text-amber-700 mt-2 space-y-1 list-disc list-inside">
                      <li><strong>Chrome:</strong> Click the lock icon in the address bar → Site settings → Notifications → Allow</li>
                      <li><strong>Safari:</strong> Safari menu → Settings → Websites → Notifications → Allow for this site</li>
                      <li><strong>Firefox:</strong> Click the lock icon → Clear permissions → Reload page</li>
                      <li><strong>Mobile:</strong> Go to device Settings → find this app → enable Notifications</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Not supported message */}
            {!isPushSupported && (
              <div className="px-4 py-3 bg-gray-50">
                <p className="text-sm text-gray-500">
                  Push notifications are not supported in this browser. Try using Chrome, Firefox, Safari, or Edge on a supported device.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Marketplace Notifications Section - US-MKT-009 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Marketplace Notifications
          </h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 py-4 flex items-center justify-between border-b border-gray-100">
              <div className="flex-1">
                <label className="text-base font-medium text-gray-900">
                  New inquiries
                </label>
                <p className="text-sm text-gray-500 mt-0.5">
                  Get notified when someone asks about your listing
                </p>
              </div>
              <button
                role="switch"
                aria-checked={settings?.marketplace_new_inquiry_enabled ?? true}
                onClick={() => handleSettingChange(
                  'marketplace_new_inquiry_enabled',
                  !settings?.marketplace_new_inquiry_enabled
                )}
                disabled={isUpdating}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${settings?.marketplace_new_inquiry_enabled ? 'bg-teal-600' : 'bg-gray-200'
                  }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings?.marketplace_new_inquiry_enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>

            <div className="px-4 py-4 flex items-center justify-between border-b border-gray-100">
              <div className="flex-1">
                <label className="text-base font-medium text-gray-900">
                  Purchase requests
                </label>
                <p className="text-sm text-gray-500 mt-0.5">
                  Alerts when someone wants to buy your item
                </p>
              </div>
              <button
                role="switch"
                aria-checked={settings?.marketplace_purchase_request_enabled ?? true}
                onClick={() => handleSettingChange(
                  'marketplace_purchase_request_enabled',
                  !settings?.marketplace_purchase_request_enabled
                )}
                disabled={isUpdating}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${settings?.marketplace_purchase_request_enabled ? 'bg-teal-600' : 'bg-gray-200'
                  }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings?.marketplace_purchase_request_enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>

            <div className="px-4 py-4 flex items-center justify-between border-b border-gray-100">
              <div className="flex-1">
                <label className="text-base font-medium text-gray-900">
                  Request accepted
                </label>
                <p className="text-sm text-gray-500 mt-0.5">
                  Updates when a seller accepts your request
                </p>
              </div>
              <button
                role="switch"
                aria-checked={settings?.marketplace_request_accepted_enabled ?? true}
                onClick={() => handleSettingChange(
                  'marketplace_request_accepted_enabled',
                  !settings?.marketplace_request_accepted_enabled
                )}
                disabled={isUpdating}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${settings?.marketplace_request_accepted_enabled ? 'bg-teal-600' : 'bg-gray-200'
                  }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings?.marketplace_request_accepted_enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>

            <div className="px-4 py-4 flex items-center justify-between border-b border-gray-100">
              <div className="flex-1">
                <label className="text-base font-medium text-gray-900">
                  Request declined
                </label>
                <p className="text-sm text-gray-500 mt-0.5">
                  Updates when a seller declines your request
                </p>
              </div>
              <button
                role="switch"
                aria-checked={settings?.marketplace_request_declined_enabled ?? true}
                onClick={() => handleSettingChange(
                  'marketplace_request_declined_enabled',
                  !settings?.marketplace_request_declined_enabled
                )}
                disabled={isUpdating}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${settings?.marketplace_request_declined_enabled ? 'bg-teal-600' : 'bg-gray-200'
                  }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings?.marketplace_request_declined_enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>

            <div className="px-4 py-4 flex items-center justify-between border-b border-gray-100">
              <div className="flex-1">
                <label className="text-base font-medium text-gray-900">
                  New messages
                </label>
                <p className="text-sm text-gray-500 mt-0.5">
                  Alerts when you receive a marketplace message
                </p>
              </div>
              <button
                role="switch"
                aria-checked={settings?.marketplace_new_message_enabled ?? true}
                onClick={() => handleSettingChange(
                  'marketplace_new_message_enabled',
                  !settings?.marketplace_new_message_enabled
                )}
                disabled={isUpdating}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${settings?.marketplace_new_message_enabled ? 'bg-teal-600' : 'bg-gray-200'
                  }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings?.marketplace_new_message_enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>

            <div className="px-4 py-4 flex items-center justify-between">
              <div className="flex-1">
                <label className="text-base font-medium text-gray-900">
                  Transaction complete
                </label>
                <p className="text-sm text-gray-500 mt-0.5">
                  Confirmation when a transaction is completed
                </p>
              </div>
              <button
                role="switch"
                aria-checked={settings?.marketplace_transaction_complete_enabled ?? true}
                onClick={() => handleSettingChange(
                  'marketplace_transaction_complete_enabled',
                  !settings?.marketplace_transaction_complete_enabled
                )}
                disabled={isUpdating}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${settings?.marketplace_transaction_complete_enabled ? 'bg-teal-600' : 'bg-gray-200'
                  }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings?.marketplace_transaction_complete_enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Item Reminders Section - US-014, US-015 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Item Reminders
          </h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Expiry reminders toggle */}
            <div className="px-4 py-4 flex items-center justify-between border-b border-gray-100">
              <div className="flex-1">
                <label className="text-base font-medium text-gray-900">
                  Expiry reminders
                </label>
                <p className="text-sm text-gray-500 mt-0.5">
                  Get notified before items expire
                </p>
              </div>
              <button
                role="switch"
                aria-checked={settings?.reminder_enabled ?? true}
                onClick={() => handleSettingChange(
                  'reminder_enabled',
                  !settings?.reminder_enabled
                )}
                disabled={isUpdating}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${settings?.reminder_enabled ? 'bg-teal-600' : 'bg-gray-200'
                  }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings?.reminder_enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>

            {/* Expiry reminder timing dropdown - US-015 */}
            {settings?.reminder_enabled && (
              <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 bg-gray-50">
                <div className="flex-1 pr-4">
                  <label htmlFor="expiry-reminder-timing" className="text-sm font-medium text-gray-700">
                    Expiry reminder timing
                  </label>
                </div>
                <select
                  id="expiry-reminder-timing"
                  value={settings?.expiration_reminder_days ?? 7}
                  onChange={(e) => handleSettingChange('expiration_reminder_days', parseInt(e.target.value, 10))}
                  disabled={isUpdating}
                  className="block w-36 rounded-md border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {EXPIRY_REMINDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Warranty reminders toggle */}
            <div className="px-4 py-4 flex items-center justify-between border-b border-gray-100">
              <div className="flex-1">
                <label className="text-base font-medium text-gray-900">
                  Warranty reminders
                </label>
                <p className="text-sm text-gray-500 mt-0.5">
                  Alerts before warranty expires
                </p>
              </div>
              <button
                role="switch"
                aria-checked={settings?.warranty_reminder_enabled ?? true}
                onClick={() => handleSettingChange(
                  'warranty_reminder_enabled',
                  !settings?.warranty_reminder_enabled
                )}
                disabled={isUpdating}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${settings?.warranty_reminder_enabled ? 'bg-teal-600' : 'bg-gray-200'
                  }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings?.warranty_reminder_enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>

            {/* Warranty reminder timing dropdown - US-015 */}
            {settings?.warranty_reminder_enabled && (
              <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 bg-gray-50">
                <div className="flex-1 pr-4">
                  <label htmlFor="warranty-reminder-timing" className="text-sm font-medium text-gray-700">
                    Warranty reminder timing
                  </label>
                </div>
                <select
                  id="warranty-reminder-timing"
                  value={settings?.warranty_reminder_days ?? 30}
                  onChange={(e) => handleSettingChange('warranty_reminder_days', parseInt(e.target.value, 10))}
                  disabled={isUpdating}
                  className="block w-40 rounded-md border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {WARRANTY_REMINDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Custom reminders toggle */}
            <div className="px-4 py-4 flex items-center justify-between">
              <div className="flex-1">
                <label className="text-base font-medium text-gray-900">
                  Custom reminders
                </label>
                <p className="text-sm text-gray-500 mt-0.5">
                  Notifications for your scheduled reminders
                </p>
              </div>
              <button
                role="switch"
                aria-checked={settings?.custom_reminder_enabled ?? true}
                onClick={() => handleSettingChange(
                  'custom_reminder_enabled',
                  !settings?.custom_reminder_enabled
                )}
                disabled={isUpdating}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${settings?.custom_reminder_enabled ? 'bg-teal-600' : 'bg-gray-200'
                  }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings?.custom_reminder_enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Display Section - US-087 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Display
          </h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Default View Toggle - Gallery / List */}
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-900">
                    Default View
                  </label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Choose how your inventory displays by default
                  </p>
                </div>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => handleSettingChange('default_view', 'gallery')}
                    disabled={isUpdating}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${settings?.default_view === 'gallery'
                        ? 'bg-white text-teal-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Gallery
                  </button>
                  <button
                    onClick={() => handleSettingChange('default_view', 'list')}
                    disabled={isUpdating}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${settings?.default_view === 'list'
                        ? 'bg-white text-teal-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    List
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Logout Section */}
        <section className="pb-24">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <button
              onClick={handleLogoutClick}
              className="w-full px-4 py-4 text-left hover:bg-red-50 transition-colors flex items-center gap-3"
            >
              <svg
                className="w-5 h-5 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="text-base font-medium text-red-600">Log out</span>
            </button>
          </div>
        </section>
      </div>

      {/* Logout Confirmation Dialog */}
      {showLogoutDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleCancelLogout}
          />

          {/* Dialog */}
          <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Log out?
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to log out?
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleCancelLogout}
                disabled={isLoggingOut}
                className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                disabled={isLoggingOut}
                className="flex-1 py-2.5 px-4 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isLoggingOut ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Logging out...
                  </>
                ) : (
                  'Log out'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Dialog */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={handleCancelEditProfile} />

          {/* Dialog */}
          <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Edit Profile
            </h2>

            {/* Display Name Input */}
            <div className="mb-4">
              <label htmlFor="display-name" className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                id="display-name"
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                maxLength={50}
                placeholder="Enter your display name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">Up to 50 characters</p>
            </div>

            {/* Email (read-only) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <p className="px-3 py-2 bg-gray-50 rounded-md text-gray-900 border border-gray-200">
                {user?.email}
              </p>
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCancelEditProfile}
                disabled={isSavingName}
                className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditProfile}
                disabled={isSavingName || !editingName.trim() || editingName.trim().length > 50}
                className="flex-1 py-2.5 px-4 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isSavingName ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
