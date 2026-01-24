import { useState } from 'react'
import { BottomNav } from './BottomNav'
import { InstallBanner } from '../InstallBanner'
import { IOSInstallBanner } from '../IOSInstallBanner'
import { Toast } from '../Toast'

interface AppShellProps {
  children: React.ReactNode
  /** Optional header content to show at the top */
  header?: React.ReactNode
  /** Whether to show the bottom navigation bar (default: true) */
  showBottomNav?: boolean
  /** Whether to add bottom padding for the nav bar (default: true when showBottomNav is true) */
  bottomPadding?: boolean
}

/**
 * AppShell provides the main application layout with:
 * - Optional header area at the top
 * - Main content area (children)
 * - Fixed bottom navigation bar
 *
 * The content area automatically accounts for the bottom nav height (56px / h-14).
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header area */}
      {header && (
        <header className="sticky top-0 bg-white border-b border-gray-200 z-40">
          {header}
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
