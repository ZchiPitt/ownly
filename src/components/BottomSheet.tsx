/**
 * BottomSheet - Reusable bottom sheet modal component
 *
 * Slides up from bottom with backdrop overlay, tap-to-close, and scrollable content.
 * Pattern: Props-based component for direct use (no Context/Hook needed).
 *
 * Usage:
 * ```tsx
 * <BottomSheet
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Select Option"
 *   footer={<button>Apply</button>}
 * >
 *   <p>Content goes here</p>
 * </BottomSheet>
 * ```
 */

import { useEffect, useRef, useCallback } from 'react'
import type { ReactNode } from 'react'

export interface BottomSheetProps {
  /** Whether the bottom sheet is visible */
  isOpen: boolean
  /** Callback when closing */
  onClose: () => void
  /** Optional title shown in header */
  title?: string
  /** Content to render in the body */
  children?: ReactNode
  /** Optional footer content (e.g., action buttons) */
  footer?: ReactNode
  /** Optional max width (default: 'max-w-lg') */
  maxWidth?: string
  /** Show handle bar at top (default: true) */
  showHandleBar?: boolean
  /** Optional close button in header (default: true) */
  showCloseButton?: boolean
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-lg',
  showHandleBar = true,
  showCloseButton = true,
}: BottomSheetProps) {
  const backdropRef = useRef<HTMLDivElement>(null)

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current) {
        onClose()
      }
    },
    [onClose]
  )

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center animate-in fade-in duration-200"
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`w-full ${maxWidth} bg-white rounded-t-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        {showHandleBar && (
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>
        )}

        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
            {title ? (
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            ) : (
              <div />
            )}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
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
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-gray-100 p-4 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
