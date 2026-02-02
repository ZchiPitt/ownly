import { useNavigate } from 'react-router-dom';

interface QuickAction {
  label: string;
  path: string;
  icon: React.ReactNode;
}

export function MarketplaceSection() {
  const navigate = useNavigate();

  const quickActions: QuickAction[] = [
    {
      label: 'Browse',
      path: '/marketplace',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      label: 'Sell',
      path: '/marketplace/my-listings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
    },
    {
      label: 'Saved',
      path: '/marketplace/saved',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
    {
      label: 'Messages',
      path: '/messages',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl p-5 text-white relative overflow-hidden shadow-lg">
      {/* Background decoration */}
      <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 pointer-events-none">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <circle cx="80" cy="20" r="40" fill="currentColor" />
          <circle cx="60" cy="80" r="30" fill="currentColor" />
        </svg>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-white/20 rounded-xl p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 7.5h16.5l-1.5 12a2.25 2.25 0 01-2.25 2h-9a2.25 2.25 0 01-2.25-2l-1.5-12z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7.5V6a3 3 0 116 0v1.5" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold">Marketplace</h2>
            <p className="text-white/80 text-sm">Buy & sell with neighbors</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-2">
          {quickActions.map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-1.5 bg-white/15 hover:bg-white/25 active:bg-white/30 transition-colors rounded-xl py-3 px-2"
            >
              {action.icon}
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
