/**
 * Item Editor Component
 *
 * Form for editing item details before saving to inventory.
 * Used for both new items (from AI detection or manual add) and editing existing items.
 *
 * Features:
 * - Photo thumbnail at top (tappable for full view)
 * - Name input with max 200 chars
 * - Quantity stepper (1-999)
 * - Description textarea with max 1000 chars
 * - AI sparkle indicator for AI pre-filled fields
 * - Sparkle disappears when user modifies field
 */

import { useState, useCallback, useMemo } from 'react';
import type { DetectedItem } from '@/types/api';

/**
 * Props for the ItemEditor component
 */
export interface ItemEditorProps {
  /** AI-detected item data (null for manual add) */
  detectedItem: DetectedItem | null;
  /** URL of the item photo */
  imageUrl: string;
  /** URL of the thumbnail image */
  thumbnailUrl: string;
  /** Path to the image in storage */
  imagePath: string;
  /** Path to the thumbnail in storage */
  thumbnailPath: string;
  /** Current item index (1-based) for multi-item queue */
  currentItemIndex: number;
  /** Total items in queue */
  totalItems: number;
  /** Callback when user wants to view full image */
  onViewFullImage?: () => void;
  /** Callback to get current form values (for parent to access) */
  onFormChange?: (values: ItemEditorValues) => void;
}

/**
 * Form values from the ItemEditor
 */
export interface ItemEditorValues {
  name: string;
  description: string;
  quantity: number;
  // These will be added in future stories:
  // categoryId: string | null;
  // locationId: string | null;
  // tags: string[];
  // price: number | null;
  // currency: string;
  // purchaseDate: string | null;
  // expirationDate: string | null;
  // brand: string | null;
  // model: string | null;
}

/**
 * Track which fields were AI-filled (sparkle indicator shown)
 */
interface AIFilledFields {
  name: boolean;
  description: boolean;
}

/**
 * AI Sparkle icon component
 */
function SparkleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-label="AI-suggested"
    >
      <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z" />
    </svg>
  );
}

/**
 * Quantity stepper component
 */
function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 999,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  const handleDecrement = useCallback(() => {
    if (value > min) {
      onChange(value - 1);
    }
  }, [value, min, onChange]);

  const handleIncrement = useCallback(() => {
    if (value < max) {
      onChange(value + 1);
    }
  }, [value, max, onChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue)) {
      onChange(Math.max(min, Math.min(max, newValue)));
    }
  }, [min, max, onChange]);

  return (
    <div className="flex items-center gap-3">
      {/* Decrement button */}
      <button
        type="button"
        onClick={handleDecrement}
        disabled={value <= min}
        className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors ${
          value <= min
            ? 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100'
        }`}
        aria-label="Decrease quantity"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>

      {/* Quantity input */}
      <input
        type="number"
        value={value}
        onChange={handleInputChange}
        min={min}
        max={max}
        className="w-16 h-10 text-center text-lg font-medium border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        aria-label="Quantity"
      />

      {/* Increment button */}
      <button
        type="button"
        onClick={handleIncrement}
        disabled={value >= max}
        className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors ${
          value >= max
            ? 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100'
        }`}
        aria-label="Increase quantity"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}

export function ItemEditor({
  detectedItem,
  imageUrl,
  thumbnailUrl,
  currentItemIndex,
  totalItems,
  onViewFullImage,
  onFormChange,
}: ItemEditorProps) {
  // Initialize form state from detected item or defaults
  const [name, setName] = useState(detectedItem?.name || '');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Track which fields are still AI-filled (sparkle shown until user modifies)
  const [aiFilledFields, setAIFilledFields] = useState<AIFilledFields>(() => ({
    name: !!detectedItem?.name,
    description: false, // AI doesn't provide description
  }));

  // Track if full image viewer is open
  const [isViewingFullImage, setIsViewingFullImage] = useState(false);

  /**
   * Handle name change - clear AI indicator when user modifies
   */
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.slice(0, 200);
    setName(newValue);
    // Clear AI indicator when user types
    if (aiFilledFields.name) {
      setAIFilledFields(prev => ({ ...prev, name: false }));
    }
  }, [aiFilledFields.name]);

  /**
   * Handle description change
   */
  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value.slice(0, 1000);
    setDescription(newValue);
    // Clear AI indicator if it was set (for future use)
    if (aiFilledFields.description) {
      setAIFilledFields(prev => ({ ...prev, description: false }));
    }
  }, [aiFilledFields.description]);

  /**
   * Handle quantity change
   */
  const handleQuantityChange = useCallback((newValue: number) => {
    setQuantity(newValue);
  }, []);

  /**
   * Handle thumbnail click - open full image viewer
   */
  const handleThumbnailClick = useCallback(() => {
    if (onViewFullImage) {
      onViewFullImage();
    } else {
      setIsViewingFullImage(true);
    }
  }, [onViewFullImage]);

  /**
   * Close full image viewer
   */
  const closeFullImageViewer = useCallback(() => {
    setIsViewingFullImage(false);
  }, []);

  /**
   * Current form values for parent access
   */
  const formValues: ItemEditorValues = useMemo(() => ({
    name,
    description,
    quantity,
  }), [name, description, quantity]);

  // Notify parent of form changes
  useMemo(() => {
    onFormChange?.(formValues);
  }, [formValues, onFormChange]);

  return (
    <>
      <div className="flex flex-col min-h-full bg-gray-50">
        {/* Progress indicator for multi-item queue */}
        {totalItems > 1 && (
          <div className="flex-shrink-0 px-4 py-2 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-700">
                Adding item {currentItemIndex} of {totalItems}
              </span>
              <div className="flex gap-1">
                {Array.from({ length: totalItems }, (_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i < currentItemIndex ? 'bg-blue-600' : 'bg-blue-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto pb-24">
          {/* Photo Thumbnail */}
          <div className="p-4">
            <button
              type="button"
              onClick={handleThumbnailClick}
              className="relative w-full aspect-video bg-gray-200 rounded-xl overflow-hidden group"
              aria-label="View full image"
            >
              <img
                src={thumbnailUrl || imageUrl}
                alt={name || 'Item photo'}
                className="w-full h-full object-cover"
              />
              {/* Overlay with expand icon */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
              {/* Tap hint on mobile */}
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 rounded-md">
                <span className="text-xs text-white">Tap to view</span>
              </div>
            </button>
          </div>

          {/* Form Fields */}
          <div className="px-4 space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="item-name" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                Item Name
                {aiFilledFields.name && (
                  <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    <SparkleIcon className="w-3 h-3" />
                    AI
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  id="item-name"
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  placeholder="e.g., Blue Coffee Mug"
                  maxLength={200}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                    aiFilledFields.name
                      ? 'border-blue-300 bg-blue-50/50'
                      : 'border-gray-300 bg-white'
                  }`}
                />
                {/* Character count */}
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  {name.length}/200
                </span>
              </div>
            </div>

            {/* Quantity Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <QuantityStepper
                value={quantity}
                onChange={handleQuantityChange}
                min={1}
                max={999}
              />
            </div>

            {/* Description Field */}
            <div>
              <label htmlFor="item-description" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                Description
                {aiFilledFields.description && (
                  <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    <SparkleIcon className="w-3 h-3" />
                    AI
                  </span>
                )}
              </label>
              <div className="relative">
                <textarea
                  id="item-description"
                  value={description}
                  onChange={handleDescriptionChange}
                  placeholder="Add notes about this item..."
                  maxLength={1000}
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-colors ${
                    aiFilledFields.description
                      ? 'border-blue-300 bg-blue-50/50'
                      : 'border-gray-300 bg-white'
                  }`}
                />
                {/* Character count */}
                <span className="absolute right-3 bottom-3 text-xs text-gray-400">
                  {description.length}/1000
                </span>
              </div>
            </div>

            {/* Placeholder sections for future fields (US-030 to US-033) */}
            {/* Category - US-030 */}
            {/* Location - US-031 */}
            {/* Tags - US-032 */}
            {/* Additional fields (price, dates, brand, model) - US-033 */}
          </div>
        </div>
      </div>

      {/* Full Image Viewer Modal */}
      {isViewingFullImage && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={closeFullImageViewer}
        >
          {/* Close button */}
          <button
            onClick={closeFullImageViewer}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white z-10"
            aria-label="Close"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Full image */}
          <img
            src={imageUrl}
            alt={name || 'Item photo'}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Hint text */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <span className="text-sm text-white/60">Tap anywhere to close</span>
          </div>
        </div>
      )}
    </>
  );
}

