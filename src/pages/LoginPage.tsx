/**
 * Login Page - User login form
 * Route: /login
 *
 * Features:
 * - Email and password inputs
 * - Log in button with loading state during submission
 * - Forgot password? link to /reset-password
 * - Footer link to signup page
 * - Redirect to dashboard on successful login (or redirect param if present)
 * - Redirect authenticated users to dashboard
 */

import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Toast } from '@/components/Toast';

// Types for location state from password reset
interface LocationState {
  passwordResetSuccess?: boolean;
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email: string | null;
  password: string | null;
}

interface FormTouched {
  email: boolean;
  password: boolean;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { signIn, signInWithGoogle, user, loading: authLoading } = useAuth();

  // Check for password reset success from location state
  const locationState = location.state as LocationState | null;

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });

  const [touched, setTouched] = useState<FormTouched>({
    email: false,
    password: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Initialize toast state based on location state (password reset success)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'info' | 'success' } | null>(
    () => locationState?.passwordResetSuccess
      ? { message: 'Password reset successfully', type: 'success' }
      : null
  );

  // Clear location state after showing toast to prevent re-showing on navigation
  useEffect(() => {
    if (locationState?.passwordResetSuccess) {
      // Clear the state to prevent showing the toast again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [locationState]);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      const redirectTo = searchParams.get('redirect');
      navigate(redirectTo ? decodeURIComponent(redirectTo) : '/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate, searchParams]);

  // Compute validation errors based on current form data
  const errors = useMemo<FormErrors>(() => {
    const newErrors: FormErrors = {
      email: null,
      password: null,
    };

    // Email validation
    if (formData.email && !EMAIL_REGEX.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation (must not be empty)
    if (formData.password && formData.password.length === 0) {
      newErrors.password = 'Password is required';
    }

    return newErrors;
  }, [formData]);

  // Check if form is valid (all fields filled and no errors)
  const isFormValid = useMemo(() => {
    return (
      formData.email.length > 0 &&
      formData.password.length > 0 &&
      !errors.email &&
      !errors.password
    );
  }, [formData, errors]);

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleBlur = (field: keyof FormTouched) => () => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched to show any validation errors
    setTouched({
      email: true,
      password: true,
    });

    if (!isFormValid || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setLoginError(null);
    setToast(null);

    try {
      const { error } = await signIn(formData.email, formData.password);

      if (error) {
        // Check for invalid credentials error
        if (
          error.message.toLowerCase().includes('invalid login credentials') ||
          error.message.toLowerCase().includes('invalid email or password')
        ) {
          setLoginError('Invalid email or password');
        } else if (
          error.message.toLowerCase().includes('email not confirmed') ||
          error.message.toLowerCase().includes('email_not_confirmed')
        ) {
          setLoginError('Please verify your email address before logging in');
        } else {
          // Other errors - show as toast
          setToast({ message: error.message, type: 'error' });
        }
        setIsSubmitting(false);
        return;
      }

      // Success: redirect to dashboard or redirect param
      // The useEffect will handle the redirect when user state updates
    } catch {
      // Network or unexpected error
      setToast({ message: 'Network connection failed', type: 'error' });
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setLoginError(null);
    setToast(null);

    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setToast({ message: error.message, type: 'error' });
        setIsGoogleLoading(false);
      }
      // If successful, user will be redirected to Google OAuth
    } catch {
      setToast({ message: 'Failed to connect to Google', type: 'error' });
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 pt-12 pb-6 px-6">
        <h1 className="text-3xl font-bold text-gray-900 text-center">
          Welcome Back
        </h1>
        <p className="mt-2 text-gray-600 text-center">
          Log in to manage your inventory
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 px-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleInputChange('email')}
              onBlur={handleBlur('email')}
              disabled={isSubmitting}
              className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed ${touched.email && errors.email
                  ? 'border-red-500'
                  : 'border-gray-300'
                }`}
            />
            {touched.email && errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <Link
                to="/reset-password"
                className="text-sm text-teal-600 hover:text-teal-700"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange('password')}
              onBlur={handleBlur('password')}
              disabled={isSubmitting}
              className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed ${touched.password && errors.password
                  ? 'border-red-500'
                  : 'border-gray-300'
                }`}
            />
            {touched.password && errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Login Error Message */}
          {loginError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{loginError}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting || isGoogleLoading}
            className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-colors flex items-center justify-center ${isFormValid && !isSubmitting && !isGoogleLoading
                ? 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800'
                : 'bg-gray-300 cursor-not-allowed'
              }`}
          >
            {isSubmitting ? (
              <>
                {/* Loading Spinner */}
                <svg
                  className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
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
                Logging in...
              </>
            ) : (
              'Log in'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-sm text-gray-500">or continue with</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting || isGoogleLoading}
          className="w-full py-3 px-4 rounded-xl font-semibold border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGoogleLoading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-gray-500"
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
              Connecting...
            </>
          ) : (
            <>
              {/* Google Icon */}
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </>
          )}
        </button>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 py-8 px-6">
        <p className="text-center text-gray-600">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="text-teal-600 font-semibold hover:text-teal-700"
          >
            Sign up
          </Link>
        </p>
      </div>

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
