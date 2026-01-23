/**
 * SortBottomSheet - Bottom sheet modal for selecting sort options
 * Displays all available sort options with checkmark for current selection
 */

import { useEffect, useRef } from 'react';
import type { InventorySortOption } from '@/hooks/useInventoryItems';
import { SORT_OPTIONS } from '@/hooks/useInventoryItems';

interface SortBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentSort: InventorySortOption;
  onSortChange: (sort: InventorySortOption) => void;
}

export function SortBottomSheet({
  isOpen,
  onClose,
  currentSort,
  onSortChange,
}: SortBottomSheetProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) {
      onClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSortSelect = (sort: InventorySortOption) => {
    onSortChange(sort);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center animate-in fade-in duration-200"
    >
      <div className="w-full max-w-lg bg-white rounded-t-2xl animate-in slide-in-from-bottom duration-300">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Sort by</h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Sort options */}
        <div className="py-2 pb-safe max-h-96 overflow-y-auto">
          {SORT_OPTIONS.map((option) => {
            const isSelected = option.key === currentSort;
            return (
              <button
                key={option.key}
                onClick={() => handleSortSelect(option.key)}
                className={`w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors ${
                  isSelected
                    ? 'bg-blue-50 text-blue-600'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className={`text-base ${isSelected ? 'font-medium' : ''}`}>
                  {option.label}
                </span>
                {isSelected && (
                  <svg
                    className="w-5 h-5 text-blue-600"
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
                )}
              </button>
            );
          })}
        </div>

        {/* Safe area padding for iPhone */}
        <div className="h-6" />
      </div>
    </div>
  );
}
