/**
 * Shopping Page - Smart Shopping Assistant
 * Route: /shopping
 *
 * Features:
 * - Initial state with shopping bag icon and helper text
 * - Take Photo and Choose from Gallery buttons
 * - Recent shopping queries section (last 3)
 * - Chat interface after photo capture (US-074)
 * - AI-powered analysis of items for shopping advice
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Toast } from '@/components/Toast';
import { validateImage, compressImage } from '@/lib/imageUtils';

// Storage key for recent shopping queries
const RECENT_QUERIES_KEY = 'clekee_shopping_queries';
const MAX_RECENT_QUERIES = 3;

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

// Recent shopping query saved to localStorage
interface RecentQuery {
  id: string;
  thumbnailUrl: string;
  itemName: string;
  timestamp: number;
}

// Chat message types
type MessageType = 'text' | 'image' | 'analysis';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  type: MessageType;
  content: string; // For text messages
  imageUrl?: string; // For image messages
  timestamp: number;
}

// View states for the page
type ViewState = 'initial' | 'chat';

/**
 * Load recent shopping queries from localStorage
 */
function loadRecentQueries(): RecentQuery[] {
  try {
    const stored = localStorage.getItem(RECENT_QUERIES_KEY);
    if (!stored) return [];
    const queries = JSON.parse(stored) as RecentQuery[];
    // Filter out old queries (older than 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return queries.filter((q) => q.timestamp > thirtyDaysAgo).slice(0, MAX_RECENT_QUERIES);
  } catch {
    return [];
  }
}

/**
 * Get relative time string from timestamp
 */
function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return diffMins === 1 ? '1 minute ago' : `${diffMins} minutes ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}

/**
 * Format timestamp for message groups
 */
function formatMessageTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (isToday) {
    return time;
  }

  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return `${dateStr}, ${time}`;
}

/**
 * Generate a unique ID for messages
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if two timestamps are within the same time group (5 minutes)
 */
function isSameTimeGroup(t1: number, t2: number): boolean {
  return Math.abs(t1 - t2) < 5 * 60 * 1000;
}

export function ShoppingPage() {
  // References
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const chatCameraInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // State
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentQueries, setRecentQueries] = useState<RecentQuery[]>([]);
  const [viewState, setViewState] = useState<ViewState>('initial');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Load recent queries on mount
  useEffect(() => {
    setRecentQueries(loadRecentQueries());
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  /**
   * Add a message to the chat
   */
  const addMessage = useCallback((
    role: 'user' | 'assistant',
    type: MessageType,
    content: string,
    imageUrl?: string
  ) => {
    const newMessage: ChatMessage = {
      id: generateId(),
      role,
      type,
      content,
      imageUrl,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  }, []);

  /**
   * Simulate AI response (placeholder for US-075/US-076)
   */
  const simulateAIResponse = useCallback(async () => {
    setIsTyping(true);

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    addMessage(
      'assistant',
      'text',
      "I'm analyzing your photo... (AI analysis will be implemented in the next update)"
    );

    setIsTyping(false);
  }, [addMessage]);

  /**
   * Handle file selection from camera or gallery (initial state)
   */
  const handleFileSelect = useCallback(async (
    event: React.ChangeEvent<HTMLInputElement>
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

      // Compress the image for display
      const compressedBlob = await compressImage(file);
      const imageUrl = URL.createObjectURL(compressedBlob);

      // Transition to chat view
      setViewState('chat');

      // Add user's image as first message
      addMessage('user', 'image', 'Photo uploaded', imageUrl);

      // Simulate AI response
      await simulateAIResponse();

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
  }, [addMessage, simulateAIResponse]);

  /**
   * Handle adding a new photo in chat mode
   */
  const handleChatPhotoSelect = useCallback(async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

      // Compress the image for display
      const compressedBlob = await compressImage(file);
      const imageUrl = URL.createObjectURL(compressedBlob);

      // Add user's image message
      addMessage('user', 'image', 'Photo uploaded', imageUrl);

      // Simulate AI response
      await simulateAIResponse();

    } catch (error) {
      console.error('Error processing image:', error);
      setToast({
        message: 'Failed to process image. Please try again.',
        type: 'error',
      });
    } finally {
      // Reset input value
      event.target.value = '';
    }
  }, [addMessage, simulateAIResponse]);

  /**
   * Handle Take Photo button click
   */
  const handleTakePhoto = useCallback(() => {
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
  }, []);

  /**
   * Handle Choose from Gallery button click
   */
  const handleChooseFromGallery = useCallback(() => {
    galleryInputRef.current?.click();
  }, []);

  /**
   * Handle camera button in chat mode
   */
  const handleChatCameraClick = useCallback(() => {
    chatCameraInputRef.current?.click();
  }, []);

  /**
   * Handle sending a text message
   */
  const handleSendMessage = useCallback(async () => {
    const text = inputValue.trim();
    if (!text) return;

    // Add user message
    addMessage('user', 'text', text);
    setInputValue('');

    // Simulate AI response
    await simulateAIResponse();
  }, [inputValue, addMessage, simulateAIResponse]);

  /**
   * Handle Enter key press in input
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  /**
   * Handle recent query click
   */
  const handleRecentQueryClick = useCallback((query: RecentQuery) => {
    // Transition to chat view with the saved query
    setViewState('chat');

    // Add the saved image as first message
    addMessage('user', 'image', query.itemName, query.thumbnailUrl);

    // Simulate AI response
    simulateAIResponse();
  }, [addMessage, simulateAIResponse]);

  /**
   * Handle New Chat button
   */
  const handleNewChat = useCallback(() => {
    setViewState('initial');
    setMessages([]);
    setInputValue('');
    setIsTyping(false);
  }, []);

  /**
   * Render a single chat message
   */
  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.role === 'user';
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showTimestamp = !prevMessage ||
      prevMessage.role !== message.role ||
      !isSameTimeGroup(prevMessage.timestamp, message.timestamp);

    return (
      <div key={message.id}>
        {/* Timestamp */}
        {showTimestamp && (
          <div className="text-center my-3">
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
              {formatMessageTime(message.timestamp)}
            </span>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`flex mb-2 ${isUser ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-2xl ${
              isUser
                ? 'bg-blue-500 text-white rounded-br-md'
                : 'bg-gray-200 text-gray-900 rounded-bl-md'
            } ${message.type === 'image' ? 'p-1' : 'px-4 py-3'}`}
          >
            {message.type === 'image' && message.imageUrl ? (
              <img
                src={message.imageUrl}
                alt="User photo"
                className="max-w-full rounded-xl max-h-64 object-contain"
              />
            ) : (
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render Chat Interface
  if (viewState === 'chat') {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        {/* Chat Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleNewChat}
              className="p-1 -ml-1 text-gray-500 hover:text-gray-700"
              aria-label="Back to initial state"
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
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Shopping Assistant
              </h1>
              <p className="text-xs text-gray-500">
                {isTyping ? 'Analyzing...' : 'Online'}
              </p>
            </div>
          </div>
          <button
            onClick={handleNewChat}
            className="text-sm text-blue-600 font-medium hover:text-blue-700"
          >
            New Chat
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.map((msg, index) => renderMessage(msg, index))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start mb-2">
              <div className="bg-gray-200 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar - Sticky at bottom */}
        <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-3 pb-safe">
          <div className="flex items-center gap-2">
            {/* Camera Button */}
            <button
              onClick={handleChatCameraClick}
              className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Add photo"
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
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a follow-up..."
                className="w-full px-4 py-2 bg-gray-100 rounded-full border border-transparent focus:border-blue-300 focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            {/* Send Button */}
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className={`flex-shrink-0 p-2 rounded-full transition-colors ${
                inputValue.trim()
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-100 text-gray-400'
              }`}
              aria-label="Send message"
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
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Hidden File Input for Chat Camera */}
        <input
          ref={chatCameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleChatPhotoSelect}
          className="hidden"
          aria-label="Take photo for chat"
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

  // Render Initial State
  return (
    <div className="min-h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 pt-6 pb-4 px-4">
        <h1 className="text-2xl font-bold text-gray-900">Shop</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 pb-6">
        {/* Initial State - Icon and Helper Text */}
        <div className="flex flex-col items-center text-center mb-8 pt-4">
          {/* Shopping Bag Icon */}
          <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <svg
              className="w-12 h-12 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>

          {/* Heading */}
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Smart Shopping Assistant
          </h2>

          {/* Subtext */}
          <p className="text-gray-500 max-w-xs">
            Take a photo of something you're thinking of buying and I'll check if you already have it
          </p>
        </div>

        {/* Action Cards */}
        <div className="space-y-4 mb-8">
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
                  Snap a photo of the item you're considering
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
          <div className="flex items-center justify-center gap-2 text-gray-600 mb-6">
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

        {/* Recent Queries Section */}
        {recentQueries.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">Recent</h3>
            </div>

            <div className="space-y-2">
              {recentQueries.map((query) => (
                <button
                  key={query.id}
                  onClick={() => handleRecentQueryClick(query)}
                  className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow active:scale-[0.98]"
                >
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                    {query.thumbnailUrl ? (
                      <img
                        src={query.thumbnailUrl}
                        alt={query.itemName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
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
                            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {query.itemName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getRelativeTime(query.timestamp)}
                    </p>
                  </div>

                  {/* Chevron */}
                  <svg
                    className="w-5 h-5 text-gray-400 flex-shrink-0"
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
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Empty state for recent queries - only show when no queries */}
        {recentQueries.length === 0 && (
          <div className="p-4 bg-gray-100 rounded-lg text-center">
            <p className="text-sm text-gray-500">
              Your recent shopping queries will appear here
            </p>
          </div>
        )}

        {/* Tips Section */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">
            How it works
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>1. Take a photo of something you want to buy</li>
            <li>2. AI will search your inventory for similar items</li>
            <li>3. Get smart advice on whether to make the purchase</li>
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
