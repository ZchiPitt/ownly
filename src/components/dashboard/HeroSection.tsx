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
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                    View/Edit/Find my belongings
                </h2>
                <button
                    onClick={() => navigate('/inventory')}
                    className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 hover:bg-teal-100 transition-colors group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:translate-x-0.5 transition-transform">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                </button>
            </div>

            <div className="flex items-center gap-2 mb-8">
                <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{totalItems} ITEMS ADDED</span>
            </div>

            <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">RECENTLY ADDED</span>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide snap-x">
                    {/* Recent Items */}
                    {isLoading ? (
                        <>
                            {[1, 2].map((i) => (
                                <div key={i} className="flex-shrink-0 w-48 h-56 bg-slate-100 rounded-2xl animate-pulse"></div>
                            ))}
                        </>
                    ) : (
                        recentItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => navigate(`/item/${item.id}`)}
                                className="flex-shrink-0 w-48 snap-start text-left group"
                            >
                                <div className="w-full aspect-square bg-slate-100 rounded-2xl mb-3 overflow-hidden border border-slate-100 relative">
                                    {item.thumbnail_url || item.photo_url ? (
                                        <img
                                            src={item.thumbnail_url || item.photo_url}
                                            alt={item.name || 'Item'}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <h3 className="font-bold text-slate-900 truncate">{item.name || 'Unnamed Item'}</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{item.category_name || 'NO CATEGORY'}</p>
                            </button>
                        ))
                    )}

                    {/* Add New Item Card - Highlighted */}
                    <button
                        onClick={() => navigate('/add')}
                        className="flex-shrink-0 w-48 snap-start"
                    >
                        <div className="w-full aspect-square bg-teal-600 rounded-2xl p-5 flex flex-col justify-between text-white hover:bg-teal-700 transition-colors shadow-lg hover:shadow-teal-200">
                            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                            </div>
                            <div>
                                <span className="block font-bold text-lg leading-tight mb-1">Add new items</span>
                                <span className="block text-[10px] opacity-80 font-medium">Capture instantly</span>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    )
}
