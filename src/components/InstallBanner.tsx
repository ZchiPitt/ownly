/**
 * Install Banner component for Android/Chrome PWA installation
 * US-070: Create install prompt for Android/Chrome
 *
 * Shows a banner prompting users to install the app when:
 * - beforeinstallprompt event is captured
 * - User has viewed 2+ pages
 * - User has spent 30+ seconds
 * - Banner not dismissed within 7 days
 * - App not already installed
 */

import { useState } from 'react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

interface InstallBannerProps {
  /** Callback when app is successfully installed */
  onInstalled?: () => void;
}

export function InstallBanner({ onInstalled }: InstallBannerProps) {
  const {
    shouldShowBanner,
    isInstalling,
    promptInstall,
    dismissBanner,
  } = useInstallPrompt();

  const [isClosing, setIsClosing] = useState(false);

  // Don't render if shouldn't show
  if (!shouldShowBanner || isClosing) {
    return null;
  }

  const handleInstall = async () => {
    const result = await promptInstall();

    if (result === 'accepted') {
      // Trigger closing animation
      setIsClosing(true);

      // Notify parent
      onInstalled?.();
    }
  };

  const handleDismiss = () => {
    // Start closing animation
    setIsClosing(true);

    // Wait for animation then dismiss
    setTimeout(() => {
      dismissBanner();
    }, 300);
  };

  return (
    <div
      className={`fixed bottom-24 left-0 right-0 z-40 px-4 pb-4 transition-all duration-300 ${
        isClosing ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
      }`}
    >
      <div className="mx-auto max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Main content */}
        <div className="p-4 flex items-start gap-4">
          {/* App icon */}
          <div className="flex-shrink-0">
            <img
              src="/icons/icon-192x192.png"
              alt="Clekee"
              className="w-14 h-14 rounded-xl shadow-md"
            />
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-base">
              Add Clekee to Home Screen
            </h3>
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
              Install this app for quick access to your inventory anytime
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-4 pb-4 flex gap-3">
          <button
            onClick={handleDismiss}
            disabled={isInstalling}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Not Now
          </button>
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isInstalling ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
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
                Installing...
              </>
            ) : (
              <>
                {/* Download/Install icon */}
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Install
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
