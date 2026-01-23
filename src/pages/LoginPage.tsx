/**
 * Login Page - User login form
 * Route: /login
 *
 * Features:
 * - Email and password inputs
 * - Log in button with loading state during submission
 * - Forgot password? link to /reset-password
 * - Footer link to signup page
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

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
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });

  const [touched, setTouched] = useState<FormTouched>({
    email: false,
    password: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

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

    // Login submission will be implemented in US-019
    // For now, just simulate a delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
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
              className={`w-full px-4 py-3 rounded-lg border bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed ${
                touched.email && errors.email
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
                className="text-sm text-blue-600 hover:text-blue-700"
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
              className={`w-full px-4 py-3 rounded-lg border bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed ${
                touched.password && errors.password
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
            />
            {touched.password && errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors flex items-center justify-center ${
              isFormValid && !isSubmitting
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
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
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 py-8 px-6">
        <p className="text-center text-gray-600">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="text-blue-600 font-semibold hover:text-blue-700"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
