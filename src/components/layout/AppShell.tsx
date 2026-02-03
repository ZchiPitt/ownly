import { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { InstallBanner } from '../InstallBanner'
import { IOSInstallBanner } from '../IOSInstallBanner'
import { OfflineBanner } from '../OfflineBanner'
import { Toast } from '../Toast'
import { useMessages } from '@/hooks/useMessages'

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
 * OwnlyLogo - Minimal, warm icon for the brand.
 */
const OwnlyLogo = ({ className = 'w-14 h-14' }: { className?: string }) => (
  <div className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-white soft-shadow border border-[#f5ebe0] ${className}`}>
    <svg viewBox="0 0 100 100" className="w-full h-full p-2">
      <defs>
        <linearGradient id="softGrad" x1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f8e1d7" />
          <stop offset="100%" stopColor="#fbc4ab" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="35" fill="url(#softGrad)" opacity="0.4" />
      <path d="M50,25 L50,75 M25,50 L75,50" stroke="#4a3f35" strokeWidth="2" strokeLinecap="round" opacity="0.2" />
      <rect x="35" y="35" width="30" height="30" rx="6" fill="white" />
      <circle cx="50" cy="50" r="6" fill="#fcf6bd" />
    </svg>
  </div>
);

/**
 * AppShell provides the main application layout.
 */
export function AppShell({
  children,
  header: _header,
  showAddButton = true,
  showSearch = false,
  onSearchClick,
}: AppShellProps) {
  const [showInstallToast, setShowInstallToast] = useState(false)
  const [_unreadCount, setUnreadCount] = useState(0)
  const location = useLocation()
  const navigate = useNavigate()
  const { getUnreadCount } = useMessages()

  useEffect(() => {
    let isMounted = true
    const loadUnreadCount = async () => {
      const count = await getUnreadCount()
      if (isMounted) {
        setUnreadCount(count)
      }
    }
    loadUnreadCount()
    return () => {
      isMounted = false
    }
  }, [getUnreadCount, location.pathname])

  const handleInstalled = () => {
    setShowInstallToast(true)
  }

  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/'

  return (
    <div className="min-h-screen pb-12 transition-colors duration-1000 bg-[#fdf8f2]">
      {/* Offline status banner */}
      <OfflineBanner />

      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-[#f5ebe0]/40 px-6 py-5 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5 flex-1">
            {!isDashboard ? (
              <button onClick={() => navigate('/dashboard')} className="p-4 bg-white/60 rounded-3xl text-[#8d7b6d] active:scale-95 transition-all soft-shadow border border-white/50">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
              </button>
            ) : (
              <OwnlyLogo className="w-14 h-14 animate-breathing" />
            )}
            <div className="flex-1">
              <div className="flex flex-col">
                <div className="flex items-baseline gap-3">
                  <h1 className="text-4xl font-black tracking-tighter text-[#4a3f35] leading-none">Ownly</h1>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Your AI Inventory & Ownership Assistant</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <p className="text-xs font-bold text-[#8d7b6d] uppercase tracking-[0.15em] leading-none">Know what you own, find quicker, buy smarter, live lighter</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `p-4 rounded-3xl transition-all active:scale-95 ${isActive ? 'bg-[#d6ccc2] text-white soft-shadow' : 'bg-white/40 text-[#8d7b6d] hover:bg-white/60'}`}
            >
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
            </NavLink>
            <NavLink
              to="/marketplace"
              className={({ isActive }) => `p-4 rounded-3xl transition-all active:scale-95 ${isActive ? 'bg-[#d6ccc2] text-white soft-shadow' : 'bg-white/40 text-[#8d7b6d] hover:bg-white/60'}`}
            >
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H22.25m-12.917-2.107 1.274-5.103a.75.75 0 0 0-.727-.932H3.193a.75.75 0 0 0-.727.932l1.274 5.103a4.5 4.5 0 0 0 8.748 0ZM11.25 15V6.75A2.25 2.25 0 0 0 9 4.5H6.75a2.25 2.25 0 0 0-2.25 2.25V15m11.25 0V6.75A2.25 2.25 0 0 1 18 4.5h2.25A2.25 2.25 0 0 1 22.5 6.75V15" /></svg>
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) => `p-4 rounded-3xl transition-all active:scale-95 ${isActive ? 'bg-[#d6ccc2] text-white soft-shadow' : 'bg-white/40 text-[#8d7b6d] hover:bg-white/60'}`}
            >
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" /></svg>
            </NavLink>
          </div>
        </div>

        {/* Search Bar - only if needed */}
        {showSearch && (
          <div className="flex items-center gap-3 animate-in fade-in duration-500">
            <button
              onClick={onSearchClick || (() => navigate('/search'))}
              className="relative flex-1 bg-white/50 rounded-[1.5rem] px-6 py-4 flex items-center border border-white/60 soft-shadow text-left group transition-all hover:bg-white"
            >
              <svg className="w-5 h-5 text-[#d6ccc2] mr-4 group-hover:text-[#4a3f35]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" /></svg>
              <span className="font-bold text-base text-[#d6ccc2] group-hover:text-[#4a3f35]">Find a memory...</span>
            </button>
          </div>
        )}
      </header>

      {/* Main content area */}
      <main className="flex-1 p-6 max-w-4xl mx-auto">
        {children}
      </main>

      {/* 2 Floating Global Buttons */}
      {showAddButton && !location.pathname.startsWith('/settings') && (
        <div className="fixed bottom-10 right-10 z-[60] flex flex-col gap-6">
          <button
            onClick={() => navigate('/search')}
            className="w-20 h-20 bg-[#e3ead3] text-[#4a3f35] rounded-full soft-shadow flex items-center justify-center active:scale-90 transition-all shadow-2xl hover:bg-[#d0f4de] border-2 border-white/50"
            title="Talk to Ownly"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" /></svg>
          </button>
          <button
            onClick={() => navigate('/add')}
            className="w-20 h-20 bg-[#f8e1d7] text-[#4a3f35] rounded-full soft-shadow flex items-center justify-center active:scale-90 transition-all shadow-2xl hover:bg-[#fbc4ab] border-2 border-white/50"
            title="Add Items"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" /></svg>
          </button>
        </div>
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
