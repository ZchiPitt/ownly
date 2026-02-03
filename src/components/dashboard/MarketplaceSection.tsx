import { useNavigate } from 'react-router-dom';

export function MarketplaceSection() {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-[3rem] p-10 soft-shadow border border-[#f5ebe0]/40 space-y-8">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <svg className="w-6 h-6 text-[#d6ccc2]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H22.25m-12.917-2.107 1.274-5.103a.75.75 0 0 0-.727-.932H3.193a.75.75 0 0 0-.727.932l1.274 5.103a4.5 4.5 0 0 0 8.748 0ZM11.25 15V6.75A2.25 2.25 0 0 0 9 4.5H6.75a2.25 2.25 0 0 0-2.25 2.25V15m11.25 0V6.75A2.25 2.25 0 0 1 18 4.5h2.25A2.25 2.25 0 0 1 22.5 6.75V15" />
          </svg>
          <h3 className="text-sm font-black uppercase tracking-[0.25em] text-[#d6ccc2]">Marketplace Feed</h3>
        </div>
        <button onClick={() => navigate('/marketplace')} className="text-[10px] font-black text-[#4a3f35] uppercase tracking-widest hover:underline decoration-2 underline-offset-4">Enter Marketplace</button>
      </div>

      <div className="bg-[#fdf8f2]/40 rounded-[2.5rem] p-4 border border-[#f5ebe0]/30">
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Browse', path: '/marketplace', icon: '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />' },
            { label: 'Sell', path: '/marketplace/my-listings', icon: '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.5v15m7.5-7.5h-15" />' },
            { label: 'Saved', path: '/marketplace/saved', icon: '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />' },
            { label: 'Inbox', path: '/messages', icon: '<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />' }
          ].map((action, i) => (
            <button key={i} onClick={() => navigate(action.path)} className="bg-[#fdf8f2]/80 p-4 rounded-2xl border border-[#f5ebe0]/40 flex flex-col items-center gap-2 hover:bg-white hover:soft-shadow transition-all group active:scale-95">
              <div className="p-3 bg-white/60 rounded-xl group-hover:bg-[#f5ebe0] transition-colors">
                <svg className="w-5 h-5 text-[#4a3f35]" fill="none" stroke="currentColor" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: action.icon }} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest text-[#8d7b6d]">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
