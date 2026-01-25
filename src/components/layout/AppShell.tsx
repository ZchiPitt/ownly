import { useState } from 'react'
import { BottomNav } from './BottomNav'
import { InstallBanner } from '../InstallBanner'
import { IOSInstallBanner } from '../IOSInstallBanner'
import { OfflineBanner } from '../OfflineBanner'
import { Toast } from '../Toast'

interface AppShellProps {
  children: React.ReactNode
  /** Optional header content to show at the top. If not provided, shows default Ownly header. */
  header?: React.ReactNode
  /** Whether to show the bottom navigation bar (default: true) */
  showBottomNav?: boolean
  /** Whether to add bottom padding for the nav bar (default: true when showBottomNav is true) */
  bottomPadding?: boolean
}

/**
 * AppShell provides the main application layout with:
 * - White Header with Ownly branding
 * - Main content area (children)
 * - Fixed bottom navigation bar
 */
export function AppShell({
  children,
  header,
  showBottomNav = true,
  bottomPadding = true,
}: AppShellProps) {
  const [showInstallToast, setShowInstallToast] = useState(false)

  const handleInstalled = () => {
    setShowInstallToast(true)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Offline status banner */}
      <OfflineBanner />

      {/* Header area - Default to Ownly style if no custom header provided */}
      {header ? (
        <header className="sticky top-0 bg-white border-b border-gray-100 z-40">
          {header}
        </header>
      ) : (
        <header className="sticky top-0 bg-white z-40 px-4 py-4 flex items-center justify-center relative">
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Ownly</h1>
            <p className="text-[10px] text-teal-600 font-bold tracking-widest uppercase">Smart Inventory Assistant</p>
          </div>
          {/* Quick actions placeholder (top right) - per design */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
             {/* Device/Sync Icon placeholder */}
             <div className="flex items-center gap-1 text-gray-400 text-xs">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
                <span className="hidden sm:inline">Device</span>
             </div>
          </div>
        </header>
      )}

      {/* Main content area */}
      <main
        className={`flex-1 ${
          showBottomNav && bottomPadding ? 'pb-14' : ''
        }`}
      >
        {children}
      </main>

      {/* Install banner for Android/Chrome */}
      {showBottomNav && (
        <InstallBanner onInstalled={handleInstalled} />
      )}

      {/* Install instructions banner for iOS Safari */}
      {showBottomNav && (
        <IOSInstallBanner />
      )}

      {/* Bottom navigation */}
      {showBottomNav && <BottomNav />}

      {/* Install success toast */}
      {showInstallToast && (
        <Toast
          message="App installed!"
          type="success"
          onClose={() => setShowInstallToast(false)}
        />
      )}
    </div>
  )
}

export default AppShell
