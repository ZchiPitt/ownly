/**
 * Search Page - Dedicated search with auto-focus input
 * Features:
 * - Sticky search input bar at top
 * - Back arrow to navigate back
 * - Auto-focused text input
 * - Clear button when has text
 * - Microphone icon (if Speech API supported)
 * - Query preserved in URL: ?q={encoded_query}
 * - Real-time search with 300ms debounce
 * - Highlighted matching text in results
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSearch } from '@/hooks/useSearch';
import { SearchResult, SearchResultSkeleton } from '@/components/SearchResult';

/**
 * Type declaration for Web Speech API (not included in standard TypeScript lib)
 */
interface SpeechRecognitionInterface {
  new (): SpeechRecognitionInterface;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionInterface;
    webkitSpeechRecognition?: SpeechRecognitionInterface;
  }
}

/**
 * Check if the Web Speech API is available
 */
function isSpeechRecognitionSupported(): boolean {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
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

/**
 * No results magnifying glass with X
 */
function NoResultsIcon() {
  return (
    <svg
      className="w-16 h-16 text-gray-300"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M8.5 8.5l3 3m0-3l-3 3"
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

  // Use the search hook
  const { results, isLoading, error, query, setQuery, hasSearched } = useSearch({
    debounceMs: 300,
    minQueryLength: 1,
  });

  // Track speech recognition support
  const [speechSupported] = useState(() => isSpeechRecognitionSupported());

  // Initialize query from URL on mount
  useEffect(() => {
    if (initialQuery && !query) {
      setQuery(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    console.log('Voice search clicked - to be implemented in US-062');
  };

  // Render search results header
  const renderResultsHeader = () => {
    if (!hasSearched || !query) return null;

    return (
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
        <p className="text-sm text-gray-600">
          <span className="font-medium">{results.length}</span>
          {' '}result{results.length !== 1 ? 's' : ''} for "{query}"
        </p>
      </div>
    );
  };

  // Render search results or states
  const renderContent = () => {
    // Loading state - show skeleton
    if (isLoading) {
      return (
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <SearchResultSkeleton key={i} />
          ))}
        </div>
      );
    }

    // Error state
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center px-4 py-12">
          <div className="text-red-500 mb-2">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-gray-900 font-medium mb-1">Search failed</p>
          <p className="text-sm text-gray-500 text-center mb-4">
            Something went wrong. Please try again.
          </p>
          <button
            onClick={() => setQuery(query)} // Trigger re-search
            className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }

    // No query entered - show placeholder
    if (!query) {
      return (
        <div className="text-center text-gray-500 mt-8 px-4">
          <p>Search for items by name, tags, locations, and more</p>
          {/* Recent searches will be implemented in US-061 */}
        </div>
      );
    }

    // Has searched but no results
    if (hasSearched && results.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center px-4 py-12">
          <NoResultsIcon />
          <p className="text-gray-900 font-medium mt-4 mb-1">No items found</p>
          <p className="text-sm text-gray-500 text-center">
            Try different keywords or check your spelling
          </p>
        </div>
      );
    }

    // Has results - show them
    if (results.length > 0) {
      return (
        <>
          {renderResultsHeader()}
          <div className="divide-y divide-gray-100">
            {results.map((item) => (
              <SearchResult key={item.id} item={item} query={query} />
            ))}
          </div>
        </>
      );
    }

    return null;
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

      {/* Search content area */}
      <div className="pb-4">
        {renderContent()}
      </div>
    </div>
  );
}
