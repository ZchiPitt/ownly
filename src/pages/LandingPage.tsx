/**
 * Landing Page - Public homepage for unauthenticated users
 * Showcases app features and provides login/signup CTAs
 */

import { Link } from 'react-router-dom';

export function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Ownly</h1>
                            <p className="text-[9px] text-teal-600 font-bold tracking-widest uppercase -mt-0.5">Smart Inventory</p>
                        </div>
                    </div>
                    <Link
                        to="/login"
                        className="px-5 py-2.5 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors shadow-lg shadow-teal-500/20"
                    >
                        Login
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm font-medium mb-6">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z" />
                        </svg>
                        AI-Powered Inventory Management
                    </div>
                    <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                        Know What You Own,
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">
                            Find It Instantly
                        </span>
                    </h2>
                    <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">
                        Snap a photo and let AI catalog your belongings. Never forget what you own or where you put it. Track expiration dates, get reminders, and organize your life effortlessly.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/signup"
                            className="px-8 py-4 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-all shadow-xl shadow-teal-500/30 hover:shadow-2xl hover:shadow-teal-500/40 hover:-translate-y-0.5"
                        >
                            Get Started Free
                        </Link>
                        <Link
                            to="/login"
                            className="px-8 py-4 bg-white text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors border border-slate-200 shadow-lg"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-4 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h3 className="text-3xl font-bold text-slate-900 mb-4">
                            Everything You Need to Stay Organized
                        </h3>
                        <p className="text-slate-600 max-w-2xl mx-auto">
                            Powerful features designed to make inventory management effortless
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1: AI Recognition */}
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100">
                            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z" />
                                </svg>
                            </div>
                            <h4 className="text-lg font-bold text-slate-900 mb-2">AI-Powered Recognition</h4>
                            <p className="text-slate-600 text-sm">
                                Just snap a photo. Our AI instantly identifies items, suggests categories, and auto-fills details.
                            </p>
                        </div>

                        {/* Feature 2: Smart Search */}
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-100">
                            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <h4 className="text-lg font-bold text-slate-900 mb-2">Instant Search</h4>
                            <p className="text-slate-600 text-sm">
                                Find any item in seconds. Search by name, category, location, or tags.
                            </p>
                        </div>

                        {/* Feature 3: Expiration Tracking */}
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-100">
                            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h4 className="text-lg font-bold text-slate-900 mb-2">Expiration Reminders</h4>
                            <p className="text-slate-600 text-sm">
                                Never let items expire again. Get timely notifications before things go bad.
                            </p>
                        </div>

                        {/* Feature 4: Location Tracking */}
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-green-50 to-green-100/50 border border-green-100">
                            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-green-500/20">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h4 className="text-lg font-bold text-slate-900 mb-2">Location Tracking</h4>
                            <p className="text-slate-600 text-sm">
                                Remember where you put everything. Organize by room, container, or custom locations.
                            </p>
                        </div>

                        {/* Feature 5: Categories & Tags */}
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100/50 border border-rose-100">
                            <div className="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-rose-500/20">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                            </div>
                            <h4 className="text-lg font-bold text-slate-900 mb-2">Smart Organization</h4>
                            <p className="text-slate-600 text-sm">
                                Categories, tags, and custom fields. Organize your inventory exactly how you want.
                            </p>
                        </div>

                        {/* Feature 6: Shopping List */}
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-50 to-cyan-100/50 border border-cyan-100">
                            <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/20">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h4 className="text-lg font-bold text-slate-900 mb-2">Shopping Lists</h4>
                            <p className="text-slate-600 text-sm">
                                Mark items to replenish and generate shopping lists automatically.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 bg-gradient-to-br from-teal-600 to-teal-700">
                <div className="max-w-4xl mx-auto text-center">
                    <h3 className="text-3xl font-bold text-white mb-4">
                        Ready to Get Organized?
                    </h3>
                    <p className="text-teal-100 mb-8 max-w-xl mx-auto">
                        Join thousands of users who have taken control of their belongings with Ownly.
                    </p>
                    <Link
                        to="/signup"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-white text-teal-700 font-semibold rounded-xl hover:bg-teal-50 transition-colors shadow-xl"
                    >
                        Start for Free
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-4 bg-slate-900 text-slate-400 text-sm text-center">
                <p>© 2024 Ownly. Smart Inventory Assistant.</p>
            </footer>
        </div>
    );
}
