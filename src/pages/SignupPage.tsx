/**
 * Signup Page - User registration form
 * Route: /signup
 *
 * Features:
 * - Email, password, confirm password inputs
 * - Real-time validation (email format, password min 8 chars, passwords match)
 * - Inline validation errors below each field
 * - Create Account button disabled until all validations pass
 * - Footer link to login page
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  email: string | null;
  password: string | null;
  confirmPassword: string | null;
}

interface FormTouched {
  email: boolean;
  password: boolean;
  confirmPassword: boolean;
}

export function SignupPage() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [touched, setTouched] = useState<FormTouched>({
    email: false,
    password: false,
    confirmPassword: false,
  });

  // Compute validation errors based on current form data
  const errors = useMemo<FormErrors>(() => {
    const newErrors: FormErrors = {
      email: null,
      password: null,
      confirmPassword: null,
    };

    // Email validation
    if (formData.email && !EMAIL_REGEX.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation (min 8 characters)
    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Confirm password validation
    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  }, [formData]);

  // Check if form is valid (all fields filled and no errors)
  const isFormValid = useMemo(() => {
    return (
      formData.email.length > 0 &&
      formData.password.length > 0 &&
      formData.confirmPassword.length > 0 &&
      !errors.email &&
      !errors.password &&
      !errors.confirmPassword
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched to show any validation errors
    setTouched({
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (!isFormValid) {
      return;
    }

    // TODO: US-017 will implement the actual submission logic
    console.log('Form submitted:', formData);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 pt-12 pb-6 px-6">
        <h1 className="text-3xl font-bold text-gray-900 text-center">
          Create Account
        </h1>
        <p className="mt-2 text-gray-600 text-center">
          Start organizing your belongings today
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
              className={`w-full px-4 py-3 rounded-lg border bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
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
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              value={formData.password}
              onChange={handleInputChange('password')}
              onBlur={handleBlur('password')}
              className={`w-full px-4 py-3 rounded-lg border bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                touched.password && errors.password
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
            />
            {touched.password && errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={handleInputChange('confirmPassword')}
              onBlur={handleBlur('confirmPassword')}
              className={`w-full px-4 py-3 rounded-lg border bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                touched.confirmPassword && errors.confirmPassword
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
            />
            {touched.confirmPassword && errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
              isFormValid
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            Create Account
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 py-8 px-6">
        <p className="text-center text-gray-600">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-blue-600 font-semibold hover:text-blue-700"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
