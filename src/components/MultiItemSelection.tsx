/**
 * Multi-Item Selection Component
 *
 * Displays when AI detects multiple items in a single photo.
 * Allows users to select which items to add to their inventory.
 *
 * Features:
 * - Original photo preview at top
 * - List of detected items with checkboxes
 * - Confidence badges (High/Medium/Low)
 * - Category suggestion display
 * - AI-suggested tags preview
 * - Select/deselect all functionality
 * - Add Selected Items button with count
 * - Queue navigation to Item Editor
 */

import { useState, useCallback } from 'react';
import type { DetectedItem } from '@/types/api';

/**
 * Props for the MultiItemSelection component
 */
export interface MultiItemSelectionProps {
  /** URL of the original uploaded image */
  imageUrl: string;
  /** URL of the thumbnail image */
  thumbnailUrl: string;
  /** Path to the image in storage (for cleanup/reference) */
  imagePath: string;
  /** Path to the thumbnail in storage */
  thumbnailPath: string;
  /** Array of items detected by AI analysis */
  detectedItems: DetectedItem[];
  /** Callback when user wants to go back */
  onBack: () => void;
  /** Callback when user proceeds with selected items */
  onProceed: (selectedItems: DetectedItem[], imageInfo: ImageInfo) => void;
}

/**
 * Image info passed to the proceed callback
 */
export interface ImageInfo {
  imageUrl: string;
  thumbnailUrl: string;
  imagePath: string;
  thumbnailPath: string;
}

/**
 * Get confidence badge color and text based on confidence score
 */
function getConfidenceBadge(confidence: number): { text: string; className: string } {
  if (confidence >= 0.8) {
    return { text: 'High', className: 'bg-green-100 text-green-700' };
  } else if (confidence >= 0.6) {
    return { text: 'Medium', className: 'bg-yellow-100 text-yellow-700' };
  } else {
    return { text: 'Low', className: 'bg-gray-100 text-gray-600' };
  }
}

export function MultiItemSelection({
  imageUrl,
  thumbnailUrl,
  imagePath,
  thumbnailPath,
  detectedItems,
  onBack,
  onProceed,
}: MultiItemSelectionProps) {
  // Track which items are selected (default: all selected)
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    () => new Set(detectedItems.map((_, index) => index))
  );

  /**
   * Toggle selection of a single item
   */
  const toggleSelection = useCallback((index: number) => {
    setSelectedIndices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  /**
   * Select or deselect all items
   */
  const toggleSelectAll = useCallback(() => {
    if (selectedIndices.size === detectedItems.length) {
      // All selected, deselect all
      setSelectedIndices(new Set());
    } else {
      // Not all selected, select all
      setSelectedIndices(new Set(detectedItems.map((_, index) => index)));
    }
  }, [selectedIndices.size, detectedItems]);

  /**
   * Handle proceed button click
   */
  const handleProceed = useCallback(() => {
    const selectedItems = detectedItems.filter((_, index) => selectedIndices.has(index));
    if (selectedItems.length > 0) {
      onProceed(selectedItems, {
        imageUrl,
        thumbnailUrl,
        imagePath,
        thumbnailPath,
      });
    }
  }, [selectedIndices, detectedItems, onProceed, imageUrl, thumbnailUrl, imagePath, thumbnailPath]);

  const selectedCount = selectedIndices.size;
  const allSelected = selectedCount === detectedItems.length;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <button
          onClick={onBack}
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
        <h2 className="text-lg font-semibold text-gray-900">Multiple Items Found</h2>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Original Photo Preview */}
      <div className="flex-shrink-0 p-4 bg-gray-100">
        <img
          src={imageUrl}
          alt="Captured items"
          className="w-full max-h-48 object-contain rounded-lg"
        />
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto">
        {/* Description and Select All */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
          <p className="text-sm text-gray-600">
            We found {detectedItems.length} items. Select which to add:
          </p>
          <button
            onClick={toggleSelectAll}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        {/* Items */}
        <div className="p-4 space-y-3">
          {detectedItems.map((item, index) => {
            const isSelected = selectedIndices.has(index);
            const confidenceBadge = getConfidenceBadge(item.confidence);

            return (
              <button
                key={index}
                onClick={() => toggleSelection(index)}
                className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {/* Checkbox */}
                <div
                  className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors mt-0.5 ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {isSelected && (
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>

                {/* Item Info */}
                <div className="flex-1 min-w-0">
                  {/* Item Name with AI sparkle */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 truncate">
                      {item.name}
                    </span>
                    {/* AI sparkle indicator */}
                    <svg
                      className="w-4 h-4 text-blue-500 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z" />
                    </svg>
                  </div>

                  {/* Badges Row */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {/* Category suggestion */}
                    {item.category_suggestion && (
                      <span className="inline-flex items-center text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                          />
                        </svg>
                        {item.category_suggestion}
                      </span>
                    )}

                    {/* Confidence badge */}
                    <span
                      className={`inline-flex items-center text-xs px-2 py-1 rounded-full ${confidenceBadge.className}`}
                    >
                      {confidenceBadge.text} confidence
                    </span>
                  </div>

                  {/* Tags preview (show first 3 tags) */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mt-2">
                      {item.tags.slice(0, 3).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="inline-block text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                      {item.tags.length > 3 && (
                        <span className="text-xs text-gray-400">
                          +{item.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Brand if available */}
                  {item.brand && (
                    <p className="text-xs text-gray-500 mt-1">
                      Brand: {item.brand}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200 bg-white safe-area-pb">
        <button
          onClick={handleProceed}
          disabled={selectedCount === 0}
          className={`w-full py-3.5 px-4 font-medium rounded-xl transition-colors flex items-center justify-center gap-2 ${
            selectedCount > 0
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {selectedCount > 0 ? (
            <>
              Add {selectedCount} {selectedCount === 1 ? 'Item' : 'Items'}
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
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </>
          ) : (
            'Select items to add'
          )}
        </button>

        {/* Helper text */}
        {selectedCount > 1 && (
          <p className="text-center text-xs text-gray-500 mt-2">
            You'll edit each item one by one
          </p>
        )}
      </div>
    </div>
  );
}
