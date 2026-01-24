import { useNavigate } from 'react-router-dom'

export const NotFoundPage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="text-center space-y-6">
        {/* 404 Icon */}
        <div className="flex justify-center">
          <div className="bg-gray-100 rounded-full p-8">
            <svg
              className="w-16 h-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.563M15 6.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM9 6.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
              />
            </svg>
          </div>
        </div>

        {/* Error message */}
        <div className="space-y-2">
          <h1 className="text-5xl font-bold text-gray-900">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700">Page not found</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>

        {/* Helpful links */}
        <div className="pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-3">Or try these:</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => navigate('/inventory')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              My Inventory
            </button>
            <button
              onClick={() => navigate('/add')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Add Item
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Settings
            </button>
            <button
              onClick={() => navigate('/shopping')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Shopping Assistant
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
