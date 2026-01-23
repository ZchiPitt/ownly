/**
 * Add Item Page - Photo capture and selection for adding items
 * Route: /add
 *
 * Features:
 * - Page title: "Add Item"
 * - Two action cards: Take Photo and Choose from Gallery
 * - Helper text explaining AI photo recognition
 * - Camera capture with capture="environment" for rear camera
 * - Gallery selection with image/* accept
 * - Camera permission denied handling with alert and fallback
 * - Toast notifications for errors
 */

import { useState, useRef } from 'react';
import { Toast } from '@/components/Toast';
import { validateImage } from '@/lib/imageUtils';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export function AddItemPage() {
  // References to hidden file inputs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // State
  const [toast, setToast] = useState<ToastState | null>(null);
  const [, setSelectedImage] = useState<File | null>(null);
  const [, setImagePreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Handle file selection from camera or gallery
   */
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setSelectedImage(file);
      setImagePreviewUrl(previewUrl);

      // TODO: US-025 will handle navigation to preview step
      // For now, just store the image and show success
      setToast({
        message: 'Photo selected! Preview coming in next update.',
        type: 'success',
      });

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
        message: 'Camera not supported on this device. Try choosing from gallery instead.',
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
      message: 'Camera access denied. Please allow camera access or choose from gallery instead.',
      type: 'error',
    });
  };

  return (
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

      {/* Hidden File Inputs */}
      {/* Camera Input - uses capture="environment" for rear camera */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        onError={handleCameraError}
        className="hidden"
        aria-label="Take photo with camera"
      />

      {/* Gallery Input */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
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
    </div>
  );
}
