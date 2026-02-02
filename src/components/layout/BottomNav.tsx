import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useMessages } from '@/hooks/useMessages'

interface NavItem {
  path: string
  label: string
  icon: ReactNode
  badgeCount?: number
  isCenter?: boolean
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-6 h-6 ${active ? 'text-teal-600' : 'text-gray-500'}`}
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
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
      xmlns="http://www.w3.org/2000/svg"
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

function MarketplaceIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-6 h-6 ${active ? 'text-teal-600' : 'text-gray-500'}`}
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={active ? 0 : 2}
        d="M3.75 7.5h16.5l-1.5 12a2.25 2.25 0 01-2.25 2h-9a2.25 2.25 0 01-2.25-2l-1.5-12z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={active ? 0 : 2}
        d="M9 7.5V6a3 3 0 116 0v1.5"
      />
    </svg>
  )
}

function MessagesIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`w-6 h-6 ${active ? 'text-teal-600' : 'text-gray-500'}`}
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={active ? 0 : 2}
        d="M6 9h8m-8 4h5m-8 7.5V7.875C3 6.563 4.063 5.5 5.375 5.5h11.25C17.938 5.5 19 6.563 19 7.875v5.625c0 1.312-1.062 2.375-2.375 2.375H9.25L5.25 19.5a.75.75 0 01-1.25-.56z"
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
      xmlns="http://www.w3.org/2000/svg"
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

export function BottomNav() {
  const location = useLocation()
  const { getUnreadCount } = useMessages()
  const [unreadCount, setUnreadCount] = useState(0)

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

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

  const navItems: NavItem[] = [
    {
      path: '/dashboard',
      label: 'Home',
      icon: <HomeIcon active={isActive('/dashboard')} />,
    },
    {
      path: '/inventory',
      label: 'Inventory',
      icon: <InventoryIcon active={isActive('/inventory')} />,
    },
    {
      path: '/marketplace',
      label: 'Marketplace',
      icon: <MarketplaceIcon active={isActive('/marketplace')} />,
    },
    {
      path: '/messages',
      label: 'Messages',
      icon: <MessagesIcon active={isActive('/messages')} />,
      badgeCount: unreadCount,
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: <SettingsIcon active={isActive('/settings')} />,
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-14 z-50">
      <div className="flex items-center justify-around h-full max-w-lg mx-auto px-4">
        {navItems.map((item) => {
          const active = isActive(item.path)
          const badgeCount = item.badgeCount ?? 0
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center flex-1 h-full"
              aria-label={item.label}
            >
              <div className="relative">
                {item.icon}
                {badgeCount > 0 ? (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] leading-none rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                ) : null}
              </div>
              <span
                className={`text-[10px] mt-0.5 ${active ? 'text-teal-600 font-medium' : 'text-gray-500'}`}
              >
                {item.label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav
