/**
 * Seller Profile Page (Placeholder)
 * Route: /marketplace/seller/:sellerId
 */

import { useNavigate, useParams } from 'react-router-dom';

function BackIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

export function SellerProfilePage() {
  const navigate = useNavigate();
  const { sellerId } = useParams<{ sellerId: string }>();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Go back"
          >
            <BackIcon />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Seller Profile</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
          <p className="text-sm text-gray-500 mb-2">Seller ID</p>
          <p className="text-base font-semibold text-gray-900">{sellerId}</p>
          <p className="text-sm text-gray-600 mt-4">Profile details coming soon.</p>
        </div>
      </div>
    </div>
  );
}
