/**
 * Simple Toast notification component
 * This is a basic implementation that will be expanded in US-083
 * for a full toast notification system with context and hooks
 */

import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const typeStyles: Record<ToastType, string> = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  info: 'bg-blue-600',
  warning: 'bg-yellow-600',
};

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`fixed bottom-20 left-4 right-4 mx-auto max-w-md px-4 py-3 rounded-lg shadow-lg text-white text-center z-50 transition-opacity duration-300 ${
        typeStyles[type]
      } ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      {message}
    </div>
  );
}
