/**
 * Add Item Page - Photo capture, selection, and preview for adding items
 * Route: /add
 *
 * Features:
 * - Page title: "Add Item"
 * - Two action cards: Take Photo and Choose from Gallery
 * - Helper text explaining AI photo recognition
 * - Camera capture with capture="environment" for rear camera
 * - Gallery selection with image/* accept
 * - Camera permission denied handling with alert and fallback
 * - Full-screen photo preview with pinch-to-zoom
 * - Retake/Continue buttons in preview mode
 * - Toast notifications for errors
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Toast } from '@/components/Toast';
import { validateImage } from '@/lib/imageUtils';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

// View states for the Add Item flow
type ViewState = 'capture' | 'preview';

export function AddItemPage() {
  // References to hidden file inputs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // State
  const [toast, setToast] = useState<ToastState | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewState, setViewState] = useState<ViewState>('capture');

  // Pinch-to-zoom state
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isPinching, setIsPinching] = useState(false);
  const lastTouchDistanceRef = useRef<number | null>(null);
  const lastTouchCenterRef = useRef<{ x: number; y: number } | null>(null);

  // Track whether image was from camera (for "Retake" vs "Reselect" label)
  const [isFromCamera, setIsFromCamera] = useState(false);

  // Cleanup preview URL on unmount or when image changes
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  /**
   * Reset zoom state
   */
  const resetZoom = useCallback(() => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
  }, []);

  /**
   * Handle touch start for pinch-to-zoom
   */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      setIsPinching(true);
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      lastTouchDistanceRef.current = distance;
      lastTouchCenterRef.current = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };
    }
  }, []);

  /**
   * Handle touch move for pinch-to-zoom
   */
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && isPinching) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        const center = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
        };

        if (lastTouchDistanceRef.current && lastTouchCenterRef.current) {
          // Calculate scale change
          const scaleChange = distance / lastTouchDistanceRef.current;
          const newScale = Math.max(1, Math.min(5, scale * scaleChange));

          // Calculate pan change (only when zoomed in)
          if (newScale > 1) {
            const dx = center.x - lastTouchCenterRef.current.x;
            const dy = center.y - lastTouchCenterRef.current.y;
            setTranslateX((prev) => prev + dx);
            setTranslateY((prev) => prev + dy);
          }

          setScale(newScale);
        }

        lastTouchDistanceRef.current = distance;
        lastTouchCenterRef.current = center;
      }
    },
    [isPinching, scale]
  );

  /**
   * Handle touch end for pinch-to-zoom
   */
  const handleTouchEnd = useCallback(() => {
    setIsPinching(false);
    lastTouchDistanceRef.current = null;
    lastTouchCenterRef.current = null;

    // Reset position if scale returns to 1
    if (scale <= 1) {
      resetZoom();
    }
  }, [scale, resetZoom]);

  /**
   * Handle double-tap to reset zoom
   */
  const lastTapRef = useRef<number>(0);
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap detected
      if (scale > 1) {
        resetZoom();
      } else {
        setScale(2);
      }
    }
    lastTapRef.current = now;
  }, [scale, resetZoom]);

  /**
   * Handle file selection from camera or gallery
   */
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
    fromCamera: boolean
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      // Validate the selected image
      const validation = await validateImage(file);

      if (!validation.valid) {
        setToast({
          message: validation.error || 'Invalid image',
          type: 'error',
        });
        return;
      }

      // Revoke previous preview URL if exists
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setSelectedImage(file);
      setImagePreviewUrl(previewUrl);
      setIsFromCamera(fromCamera);
      resetZoom();

      // Navigate to preview state
      setViewState('preview');
    } catch (error) {
      console.error('Error processing image:', error);
      setToast({
        message: 'Failed to process image. Please try again.',
        type: 'error',
      });
    } finally {
      setIsProcessing(false);
      // Reset input value to allow selecting the same file again
      event.target.value = '';
    }
  };

  /**
   * Handle Take Photo button click
   */
  const handleTakePhoto = () => {
    // Check if device has camera support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setToast({
        message:
          'Camera not supported on this device. Try choosing from gallery instead.',
        type: 'warning',
      });
      return;
    }

    // Trigger camera input
    cameraInputRef.current?.click();
  };

  /**
   * Handle Choose from Gallery button click
   */
  const handleChooseFromGallery = () => {
    galleryInputRef.current?.click();
  };

  /**
   * Handle camera input error (permission denied, etc.)
   */
  const handleCameraError = () => {
    setToast({
      message:
        'Camera access denied. Please allow camera access or choose from gallery instead.',
      type: 'error',
    });
  };

  /**
   * Handle Retake/Reselect button click
   */
  const handleRetake = () => {
    // Clean up current preview
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setSelectedImage(null);
    setImagePreviewUrl(null);
    resetZoom();
    setViewState('capture');
  };

  /**
   * Handle Continue button click
   */
  const handleContinue = () => {
    if (!selectedImage) return;

    // TODO: US-027 will handle navigation to AI analysis
    // For now, just show a message
    setToast({
      message: 'AI analysis coming in next update!',
      type: 'info',
    });
  };

  // Render capture view
  const renderCaptureView = () => (
    <div className="min-h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 pt-6 pb-4 px-4">
        <h1 className="text-2xl font-bold text-gray-900">Add Item</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 pb-6">
        {/* Helper Text */}
        <div className="mb-6 text-center">
          <p className="text-gray-600">
            Take a photo of your item and AI will help identify it
          </p>
        </div>

        {/* Action Cards */}
        <div className="space-y-4">
          {/* Take Photo Card */}
          <button
            onClick={handleTakePhoto}
            disabled={isProcessing}
            className="w-full p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              {/* Camera Icon */}
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-7 h-7 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              {/* Text */}
              <div className="flex-1 text-left">
                <h3 className="text-lg font-semibold text-gray-900">
                  Take Photo
                </h3>
                <p className="text-sm text-gray-500">
                  Use your camera to capture an item
                </p>
              </div>
              {/* Chevron */}
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </button>

          {/* Choose from Gallery Card */}
          <button
            onClick={handleChooseFromGallery}
            disabled={isProcessing}
            className="w-full p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              {/* Gallery Icon */}
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-7 h-7 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              {/* Text */}
              <div className="flex-1 text-left">
                <h3 className="text-lg font-semibold text-gray-900">
                  Choose from Gallery
                </h3>
                <p className="text-sm text-gray-500">
                  Select an existing photo from your device
                </p>
              </div>
              {/* Chevron */}
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </button>
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="mt-6 flex items-center justify-center gap-2 text-gray-600">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
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
            <span>Processing image...</span>
          </div>
        )}

        {/* Tips Section */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">
            📸 Tips for best results
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Ensure good lighting</li>
            <li>• Keep the item centered in the frame</li>
            <li>• Avoid blurry or dark photos</li>
            <li>• Include labels or brand names when visible</li>
          </ul>
        </div>
      </div>
    </div>
  );

  // Render preview view
  const renderPreviewView = () => (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-black/80">
        <h2 className="text-lg font-semibold text-white">Preview Photo</h2>
        <button
          onClick={handleRetake}
          className="p-2 text-white/80 hover:text-white"
          aria-label="Close preview"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Image Preview with pinch-to-zoom */}
      <div
        ref={imageContainerRef}
        className="flex-1 overflow-hidden flex items-center justify-center touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleDoubleTap}
      >
        {imagePreviewUrl && (
          <img
            src={imagePreviewUrl}
            alt="Preview of selected item"
            className="max-w-full max-h-full object-contain select-none"
            style={{
              transform: `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`,
              transition: isPinching ? 'none' : 'transform 0.2s ease-out',
            }}
            draggable={false}
          />
        )}
      </div>

      {/* Zoom indicator */}
      {scale > 1 && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 rounded-full">
          <span className="text-sm text-white">{Math.round(scale * 100)}%</span>
        </div>
      )}

      {/* Helper text */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <p className="text-sm text-white/60">
          Pinch to zoom • Double-tap to reset
        </p>
      </div>

      {/* Bottom action buttons */}
      <div className="flex-shrink-0 px-4 py-4 bg-black/80 safe-area-pb">
        <div className="flex gap-3">
          {/* Retake/Reselect button */}
          <button
            onClick={handleRetake}
            className="flex-1 py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {isFromCamera ? 'Retake' : 'Reselect'}
          </button>

          {/* Continue button */}
          <button
            onClick={handleContinue}
            className="flex-1 py-3 px-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            Continue
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
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {viewState === 'capture' ? renderCaptureView() : renderPreviewView()}

      {/* Hidden File Inputs */}
      {/* Camera Input - uses capture="environment" for rear camera */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFileSelect(e, true)}
        onError={handleCameraError}
        className="hidden"
        aria-label="Take photo with camera"
      />

      {/* Gallery Input */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(e, false)}
        className="hidden"
        aria-label="Choose from gallery"
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
