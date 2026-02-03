import { useNavigate } from 'react-router-dom'
import type { RecentItem } from '@/hooks/useRecentItems'

interface HeroSectionProps {
    recentItems: RecentItem[]
    isLoading: boolean
    totalItems: number
}

export function HeroSection({ recentItems, isLoading, totalItems }: HeroSectionProps) {
    const navigate = useNavigate()

    return (
        <div className="bg-white rounded-[3rem] p-8 soft-shadow border border-[#f5ebe0]/40 overflow-hidden relative">
            <div className="flex items-center justify-between mb-6">
                <div onClick={() => navigate('/inventory')} className="cursor-pointer group">
                    <h2 className="text-3xl font-black text-[#4a3f35] tracking-tight group-hover:text-[#d6ccc2] transition-colors">Your Belongings</h2>
                    <div className="flex items-center gap-2.5 mt-1">
                        <span className="w-2 h-2 bg-[#e3ead3] rounded-full animate-pulse"></span>
                        <p className="text-[10px] font-black text-[#8d7b6d] uppercase tracking-[0.25em]">{totalItems} Items Preserved</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/inventory')}
                    className="p-4 bg-[#fdf8f2] text-[#d6ccc2] rounded-2xl hover:bg-[#e3ead3] hover:text-[#4a3f35] transition-all soft-shadow"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                </button>
            </div>

            {/* Collection Preview */}
            <div className="mb-8 space-y-4">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2.5">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-[#fbc4ab]">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                        </svg>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#d6ccc2]">RECENTLY ADDED</h3>
                    </div>
                    <button onClick={() => navigate('/inventory')} className="text-[10px] font-black text-[#4a3f35] uppercase tracking-widest hover:underline decoration-2 underline-offset-4">View All</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {isLoading ? (
                        [1, 2].map(i => (
                            <div key={i} className="aspect-[4/3] bg-[#fdf8f2] rounded-[2rem] animate-pulse"></div>
                        ))
                    ) : (
                        recentItems.slice(0, 2).map(item => (
                            <div
                                key={item.id}
                                onClick={() => navigate(`/item/${item.id}`)}
                                className="bg-[#fdf8f2] rounded-[2rem] overflow-hidden border border-[#f5ebe0]/40 soft-shadow hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group"
                            >
                                <div className="aspect-[4/3] bg-white relative overflow-hidden">
                                    {item.thumbnail_url || item.photo_url ? (
                                        <img src={item.thumbnail_url || item.photo_url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[#d6ccc2]">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3">
                                        <span className="px-3 py-1 bg-white/85 backdrop-blur-md rounded-full text-[8px] font-black text-[#4a3f35] uppercase tracking-widest border border-white/50">{item.category_name || 'Other'}</span>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-black text-[#4a3f35] text-[11px] truncate">{item.name}</h3>
                                    <div className="mt-2 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-[8px] font-black text-[#8d7b6d] uppercase tracking-wider">
                                            <svg className="w-2.5 h-2.5 text-[#e3ead3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                                            {(item as any).location_name || 'A safe spot'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Shortcuts */}
            <div className="bg-[#fdf8f2]/40 rounded-[2.5rem] p-7 border border-[#f5ebe0]/30 shadow-inner">
                <div className="grid grid-cols-4 gap-6 w-full text-center">
                    {[
                        { icon: 'Shirt', label: 'Clothes', color: 'rose' },
                        { icon: 'Bed', label: 'Bedroom', color: 'misty' },
                        { icon: 'Utensils', label: 'Kitchen', color: 'cream' },
                        { icon: 'Wrench', label: 'Tools', color: 'sage' }
                    ].map((cat, i) => (
                        <button key={i} onClick={() => navigate('/inventory')} className="flex flex-col items-center gap-2 group active:scale-95 transition-all">
                            <div className={`p-4 bg-white rounded-2xl shadow-sm group-hover:bg-[#f8e1d7] transition-colors border border-white/50`}>
                                <div className="w-5 h-5 text-[#4a3f35]">
                                    {/* Placeholder for Lucide icons as SVG or emoji */}
                                    {cat.label === 'Clothes' && '👕'}
                                    {cat.label === 'Bedroom' && '🛏️'}
                                    {cat.label === 'Kitchen' && '🍴'}
                                    {cat.label === 'Tools' && '🔧'}
                                </div>
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-tighter text-[#8d7b6d]">{cat.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
