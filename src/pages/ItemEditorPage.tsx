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
import { useCallback, useEffect, useState, useRef } from 'react';
import { ItemEditor, type ItemEditorValues } from '@/components/ItemEditor';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Toast } from '@/components/Toast';
import type { DetectedItem } from '@/types/api';
import type { ItemAIMetadata } from '@/types';

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
  const { user } = useAuth();

  // Extract state from router
  const state = location.state as ItemEditorState | null;

  // Track form values for save functionality (using ref for stable reference in callbacks)
  const formValuesRef = useRef<ItemEditorValues | null>(null);

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedItemId, setSavedItemId] = useState<string | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Auto-dismiss timer ref for success overlay
  const autoDismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Redirect if no state (direct navigation)
  useEffect(() => {
    if (!state || !state.imageUrl) {
      navigate('/add', { replace: true });
    }
  }, [state, navigate]);

  // Cleanup auto-dismiss timer
  useEffect(() => {
    return () => {
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
      }
    };
  }, []);

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
    formValuesRef.current = values;
  }, []);

  /**
   * Handle save item to database
   */
  const handleSave = useCallback(async () => {
    const values = formValuesRef.current;
    if (!values || !user || !state) return;

    setIsSaving(true);

    try {
      // Build AI metadata if detected item exists
      const aiMetadata: ItemAIMetadata | null = state.detectedItem
        ? {
            detected_name: state.detectedItem.name || undefined,
            detected_category: state.detectedItem.category_suggestion || undefined,
            detected_tags: state.detectedItem.tags || undefined,
            detected_brand: state.detectedItem.brand || undefined,
            confidence_score: state.detectedItem.confidence_score || undefined,
            analysis_provider: 'openai',
            analysis_model: 'gpt-4o',
            analyzed_at: new Date().toISOString(),
          }
        : null;

      // Insert item into database
      const { data, error } = await supabase
        .from('items')
        .insert({
          user_id: user.id,
          photo_url: state.imageUrl,
          thumbnail_url: state.thumbnailUrl || null,
          name: values.name || null,
          description: values.description || null,
          category_id: values.categoryId || null,
          tags: values.tags,
          location_id: values.locationId || null,
          quantity: values.quantity,
          price: values.price,
          currency: values.currency,
          purchase_date: values.purchaseDate || null,
          expiration_date: values.expirationDate || null,
          brand: values.brand || null,
          model: values.model || null,
          notes: null, // Notes are in description for now
          is_favorite: false,
          keep_forever: false,
          ai_metadata: aiMetadata,
          last_viewed_at: null,
        })
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      // Store saved item ID
      setSavedItemId(data.id);

      // Show success overlay
      setShowSuccess(true);

      // Start auto-dismiss timer (5 seconds)
      autoDismissTimerRef.current = setTimeout(() => {
        navigate('/inventory', { replace: true });
      }, 5000);
    } catch (error) {
      console.error('Failed to save item:', error);
      setToast({ message: 'Failed to save item. Please try again.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  }, [user, state, navigate]);

  /**
   * Handle Add Another Item action
   */
  const handleAddAnother = useCallback(() => {
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
    }
    navigate('/add', { replace: true });
  }, [navigate]);

  /**
   * Handle View Item action
   */
  const handleViewItem = useCallback(() => {
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
    }
    if (savedItemId) {
      navigate(`/item/${savedItemId}`, { replace: true });
    }
  }, [navigate, savedItemId]);

  /**
   * Handle Go to Inventory action
   */
  const handleGoToInventory = useCallback(() => {
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
    }
    navigate('/inventory', { replace: true });
  }, [navigate]);

  // Show loading/redirect state if no state
  if (!state || !state.imageUrl) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
          <button
            onClick={handleBack}
            disabled={isSaving}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
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
        <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200 bg-white safe-area-pb">
          <button
            type="button"
            disabled={isSaving}
            className="w-full py-3.5 px-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSave}
          >
            {isSaving ? (
              <>
                {/* Loading spinner */}
                <svg
                  className="w-5 h-5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Saving...
              </>
            ) : (
              <>
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
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col items-center justify-center p-6">
          {/* Checkmark animation */}
          <div className="relative w-24 h-24 mb-6">
            <div className="absolute inset-0 rounded-full bg-green-100 animate-[pulse_2s_ease-in-out_infinite]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center animate-[scale-in_0.3s_ease-out]">
                <svg
                  className="w-10 h-10 text-white animate-[check-draw_0.3s_ease-out_0.2s_forwards]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ strokeDasharray: 32, strokeDashoffset: 32 }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Success message */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Item Saved!
          </h2>
          <p className="text-gray-500 text-center mb-8">
            Your item has been added to your inventory.
          </p>

          {/* Action buttons */}
          <div className="w-full max-w-sm space-y-3">
            <button
              onClick={handleAddAnother}
              className="w-full py-3.5 px-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Another Item
            </button>

            <button
              onClick={handleViewItem}
              className="w-full py-3.5 px-4 bg-white text-gray-700 font-medium rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
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
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              View Item
            </button>

            <button
              onClick={handleGoToInventory}
              className="w-full py-3.5 px-4 text-gray-500 font-medium hover:text-gray-700 transition-colors flex items-center justify-center gap-2"
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
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              Go to Inventory
            </button>
          </div>

          {/* Auto-dismiss timer */}
          <p className="mt-6 text-sm text-gray-400">
            Redirecting to inventory in 5 seconds...
          </p>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Custom animation styles */}
      <style>{`
        @keyframes scale-in {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes check-draw {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </>
  );
}
