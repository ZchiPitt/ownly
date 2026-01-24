/**
 * Search Page - Dedicated search with auto-focus input
 * Features:
 * - Sticky search input bar at top
 * - Back arrow to navigate back
 * - Auto-focused text input
 * - Clear button when has text
 * - Microphone icon (if Speech API supported)
 * - Query preserved in URL: ?q={encoded_query}
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * Check if the Web Speech API is available
 */
function isSpeechRecognitionSupported(): boolean {
  return !!(
    window.SpeechRecognition ||
    (window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition
  );
}

/**
 * Back arrow icon
 */
function BackIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 19l-7-7 7-7"
      />
    </svg>
  );
}

/**
 * Search/magnifying glass icon
 */
function SearchIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

/**
 * Clear/X icon
 */
function ClearIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

/**
 * Microphone icon
 */
function MicrophoneIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
      />
    </svg>
  );
}

export function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  // Get initial query from URL
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);

  // Track speech recognition support
  const [speechSupported] = useState(() => isSpeechRecognitionSupported());

  // Auto-focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Update URL when query changes
  useEffect(() => {
    if (query) {
      setSearchParams({ q: query }, { replace: true });
    } else {
      // Remove query param if empty
      setSearchParams({}, { replace: true });
    }
  }, [query, setSearchParams]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleClear = () => {
    setQuery('');
    // Focus input after clearing
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleMicrophoneClick = () => {
    // Microphone functionality will be implemented in US-062
    // For now, just a placeholder
    console.log('Voice search clicked - to be implemented in US-062');
  };

  return (
    <div className="min-h-full bg-gray-50">
      {/* Sticky search header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Back button */}
          <button
            onClick={handleBack}
            className="flex-shrink-0 w-10 h-10 -ml-2 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
            aria-label="Go back"
          >
            <BackIcon />
          </button>

          {/* Search input container */}
          <div className="flex-1 relative">
            {/* Search icon */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <SearchIcon />
            </div>

            {/* Input field */}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleQueryChange}
              placeholder="Search items, tags, locations..."
              className="w-full h-10 pl-10 pr-20 bg-gray-100 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              aria-label="Search items"
            />

            {/* Right side buttons container */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {/* Clear button - shown when query has text */}
              {query && (
                <button
                  onClick={handleClear}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-200"
                  aria-label="Clear search"
                >
                  <ClearIcon />
                </button>
              )}

              {/* Microphone button - shown if Speech API supported */}
              {speechSupported && (
                <button
                  onClick={handleMicrophoneClick}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-200"
                  aria-label="Voice search"
                >
                  <MicrophoneIcon />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search content area - will be implemented in subsequent stories */}
      <div className="p-4">
        {/* Placeholder for search results (US-060), recent searches (US-061), etc. */}
        {!query && (
          <div className="text-center text-gray-500 mt-8">
            <p>Search for items by name, tags, locations, and more</p>
          </div>
        )}

        {query && (
          <div className="text-center text-gray-500 mt-8">
            <p>Searching for "{query}"...</p>
            <p className="text-sm mt-2">Search results will be implemented in US-060</p>
          </div>
        )}
      </div>
    </div>
  );
}
