/**
 * Item Editor Page
 *
 * Page wrapper for the ItemEditor component.
 * Receives item data via router state and provides page-level navigation and save handling.
 *
 * Route: /add/edit
 *
 * Expected location.state:
 * - detectedItem: DetectedItem | null - AI-detected item data
 * - imageUrl: string - URL of the item photo
 * - thumbnailUrl: string - URL of the thumbnail
 * - imagePath: string - Storage path for image
 * - thumbnailPath: string - Storage path for thumbnail
 * - itemQueue: DetectedItem[] - Remaining items to process
 * - totalItems: number - Total items in queue
 * - currentItemIndex: number - Current item position (1-based)
 */

import { useLocation, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { ItemEditor, type ItemEditorValues } from '@/components/ItemEditor';
import type { DetectedItem } from '@/types/api';

/**
 * State passed via router to ItemEditorPage
 */
interface ItemEditorState {
  detectedItem: DetectedItem | null;
  imageUrl: string;
  thumbnailUrl: string;
  imagePath: string;
  thumbnailPath: string;
  itemQueue: DetectedItem[];
  totalItems: number;
  currentItemIndex: number;
}

export function ItemEditorPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract state from router
  const state = location.state as ItemEditorState | null;

  // Track form values for save functionality (US-034)
  const [formValues, setFormValues] = useState<ItemEditorValues | null>(null);

  // Redirect if no state (direct navigation)
  useEffect(() => {
    if (!state || !state.imageUrl) {
      navigate('/add', { replace: true });
    }
  }, [state, navigate]);

  /**
   * Handle back navigation
   */
  const handleBack = useCallback(() => {
    // Navigate back to add page
    navigate('/add', { replace: true });
  }, [navigate]);

  /**
   * Handle form value changes
   */
  const handleFormChange = useCallback((values: ItemEditorValues) => {
    setFormValues(values);
  }, []);

  // Show loading/redirect state if no state
  if (!state || !state.imageUrl) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
          aria-label="Go back"
        >
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
        </button>
        <h1 className="text-lg font-semibold text-gray-900">
          {state.detectedItem ? 'Edit Item Details' : 'Add Item Details'}
        </h1>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* ItemEditor Component */}
      <div className="flex-1 overflow-hidden">
        <ItemEditor
          detectedItem={state.detectedItem}
          imageUrl={state.imageUrl}
          thumbnailUrl={state.thumbnailUrl}
          imagePath={state.imagePath}
          thumbnailPath={state.thumbnailPath}
          currentItemIndex={state.currentItemIndex}
          totalItems={state.totalItems}
          onFormChange={handleFormChange}
        />
      </div>

      {/* Save Button - Sticky at bottom */}
      {/* Full save implementation in US-034 */}
      <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200 bg-white safe-area-pb">
        <button
          type="button"
          className="w-full py-3.5 px-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          onClick={() => {
            // TODO: Implement save in US-034
            console.log('Save item:', formValues);
          }}
        >
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
              d="M5 13l4 4L19 7"
            />
          </svg>
          Save Item
        </button>
      </div>
    </div>
  );
}
