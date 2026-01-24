/**
 * Settings Page
 * Allows users to configure preferences and log out
 * US-020: Create logout functionality in settings
 * US-064: Create Settings page - reminder settings section
 * US-065: Implement push notification permission flow
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
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

// Expiration reminder options (days before)
const EXPIRATION_REMINDER_OPTIONS = [
  { value: 3, label: '3 days before' },
  { value: 7, label: '7 days before' },
  { value: 14, label: '14 days before' },
  { value: 30, label: '30 days before' },
];

export function SettingsPage() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
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

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  // Handle settings updates with optimistic UI
  const handleSettingChange = async (
    key: 'reminder_enabled' | 'reminder_threshold_days' | 'expiration_reminder_days' | 'push_notifications_enabled',
    value: boolean | number
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

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      // Show toast briefly before redirect
      success('Logged out successfully');
      // Small delay to allow user to see success message
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 500);
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
        {/* Account Section Placeholder - will be expanded in US-088 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Account
          </h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 py-3">
              <p className="text-sm text-gray-600">
                Signed in as <span className="font-medium text-gray-900">{user?.email}</span>
              </p>
            </div>
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
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      settings?.reminder_enabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        settings?.reminder_enabled ? 'translate-x-5' : 'translate-x-0'
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
                        className="block w-32 rounded-md border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        className="block w-40 rounded-md border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                              settings?.push_notifications_enabled ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            {isRequestingPush ? (
                              <span className="pointer-events-none inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow">
                                <svg
                                  className="animate-spin h-3 w-3 text-blue-500"
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
                                  settings?.push_notifications_enabled ? 'translate-x-5' : 'translate-x-0'
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

        {/* Spacer to push logout to bottom */}
        <div className="flex-1" />
      </div>

      {/* Logout Button - Fixed at bottom */}
      <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 bg-gray-50">
        <button
          onClick={handleLogoutClick}
          className="w-full py-3 px-4 bg-white border-2 border-red-500 rounded-lg text-red-600 font-semibold hover:bg-red-50 active:bg-red-100 transition-colors"
        >
          Log out
        </button>
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
    </div>
  );
}
