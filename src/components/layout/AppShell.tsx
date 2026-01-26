import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { InstallBanner } from '../InstallBanner'
import { IOSInstallBanner } from '../IOSInstallBanner'
import { OfflineBanner } from '../OfflineBanner'
import { Toast } from '../Toast'

interface AppShellProps {
  children: React.ReactNode
  /** Optional header content to show at the top. If not provided, shows default Ownly header with navigation. */
  header?: React.ReactNode
  /** Whether to show the floating add button (default: true) */
  showAddButton?: boolean
  /** Whether to show search bar in header (default: false) */
  showSearch?: boolean
  /** Callback when search is clicked */
  onSearchClick?: () => void
}

/**
 * Navigation icons
 */
function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-6 h-6 ${active ? 'text-teal-600' : 'text-gray-500'}`}
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={active ? 0 : 2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  )
}

function InventoryIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-6 h-6 ${active ? 'text-teal-600' : 'text-gray-500'}`}
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={active ? 0 : 2}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  )
}

function ShopIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-6 h-6 ${active ? 'text-teal-600' : 'text-gray-500'}`}
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={active ? 0 : 2}
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  )
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-6 h-6 ${active ? 'text-teal-600' : 'text-gray-500'}`}
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={active ? 0 : 2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={active ? 0 : 2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

/**
 * AppShell provides the main application layout with:
 * - Top header with Ownly branding and navigation icons
 * - Main content area (children)
 * - Floating add button (optional)
 */
export function AppShell({
  children,
  header,
  showAddButton = true,
  showSearch = false,
  onSearchClick,
}: AppShellProps) {
  const [showInstallToast, setShowInstallToast] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const handleInstalled = () => {
    setShowInstallToast(true)
  }

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Offline status banner */}
      <OfflineBanner />

      {/* Header area with navigation */}
      {header ? (
        <header className="sticky top-0 bg-white border-b border-gray-100 z-40">
          {header}
        </header>
      ) : (
        <header className="sticky top-0 bg-white z-40 border-b border-gray-100">
          {/* Top row: Logo + Navigation icons */}
          <div className="px-4 py-3 flex items-center justify-between">
            {/* Left: Logo and tagline */}
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">Ownly</h1>
                <p className="text-[9px] text-teal-600 font-semibold tracking-wider uppercase">
                  Know what you own
                </p>
              </div>
            </div>

            {/* Right: Navigation icons */}
            <div className="flex items-center gap-1">
              <NavLink
                to="/dashboard"
                className={`p-2 rounded-lg transition-colors ${
                  isActive('/dashboard') ? 'bg-teal-50' : 'hover:bg-gray-100'
                }`}
                aria-label="Home"
              >
                <HomeIcon active={isActive('/dashboard')} />
              </NavLink>
              <NavLink
                to="/inventory"
                className={`p-2 rounded-lg transition-colors ${
                  isActive('/inventory') ? 'bg-teal-50' : 'hover:bg-gray-100'
                }`}
                aria-label="Inventory"
              >
                <InventoryIcon active={isActive('/inventory')} />
              </NavLink>
              <NavLink
                to="/shopping"
                className={`p-2 rounded-lg transition-colors ${
                  isActive('/shopping') ? 'bg-teal-50' : 'hover:bg-gray-100'
                }`}
                aria-label="Shop"
              >
                <ShopIcon active={isActive('/shopping')} />
              </NavLink>
              <NavLink
                to="/settings"
                className={`p-2 rounded-lg transition-colors ${
                  isActive('/settings') ? 'bg-teal-50' : 'hover:bg-gray-100'
                }`}
                aria-label="Settings"
              >
                <SettingsIcon active={isActive('/settings')} />
              </NavLink>
            </div>
          </div>

          {/* Second row: Search bar (optional) */}
          {showSearch && (
            <div className="px-4 pb-3">
              <button
                onClick={onSearchClick || (() => navigate('/search'))}
                className="w-full flex items-center gap-2 px-4 py-2.5 bg-gray-100 rounded-xl text-gray-500 text-sm hover:bg-gray-200 transition-colors"
              >
                <SearchIcon />
                <span>Search items...</span>
              </button>
            </div>
          )}
        </header>
      )}

      {/* Main content area */}
      <main className="flex-1">
        {children}
      </main>

      {/* Floating Add Button */}
      {showAddButton && (
        <NavLink
          to="/add"
          className="fixed bottom-6 right-4 flex items-center gap-2 px-5 py-3.5 bg-teal-600 text-white rounded-full shadow-lg hover:bg-teal-700 active:bg-teal-800 transition-all z-40"
          aria-label="Add new item"
        >
          <CameraIcon />
          <span className="text-sm font-semibold uppercase tracking-wide">Add New Items</span>
        </NavLink>
      )}

      {/* Install banner for Android/Chrome */}
      <InstallBanner onInstalled={handleInstalled} />

      {/* Install instructions banner for iOS Safari */}
      <IOSInstallBanner />

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
