'use client';

import React, { useState, ChangeEvent, FormEvent } from 'react';

export interface SignUpFormProps {
  onSuccess?: (email: string) => void;
  onError?: (error: string) => void;
}

export interface SignUpFormState {
  email: string;
  name: string;
  password: string;
  isLoading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
}

/**
 * SignUpForm Component
 * 
 * A modular React component that collects user registration input.
 * Features:
 * - Controlled inputs for email, name, password
 * - Form state management with loading and error states
 * - Field-specific error message display
 * - API integration with /api/auth/signup endpoint
 * - Accessibility features (labels, ARIA attributes)
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 10.1, 10.2, 10.3, 13.1
 */
export const SignUpForm: React.FC<SignUpFormProps> = ({ onSuccess, onError }) => {
  const [state, setState] = useState<SignUpFormState>({
    email: '',
    name: '',
    password: '',
    isLoading: false,
    error: null,
    fieldErrors: {}
  });

  /**
   * Handle input field changes
   * Updates state with entered value
   * 
   * Validates: Requirement 1.3
   */
  const handleInputChange = (field: keyof Omit<SignUpFormState, 'isLoading' | 'error' | 'fieldErrors'>, value: string) => {
    setState(prev => ({
      ...prev,
      [field]: value,
      fieldErrors: {
        ...prev.fieldErrors,
        [field]: '' // Clear field error when user starts typing
      }
    }));
  };

  /**
   * Handle form submission
   * Collects form data and submits to API
   * Handles success and error responses
   * 
   * Validates: Requirements 1.4, 1.5, 9.1, 9.2, 9.3, 10.1, 10.2, 10.3
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Set loading state
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      fieldErrors: {}
    }));

    try {
      // Send POST request to /api/auth/signup
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: state.email,
          name: state.name,
          password: state.password
        })
      });

      const data = await response.json();

      if (response.ok && data.statusCode === 201) {
        // Success response (201 Created)
        setState(prev => ({
          ...prev,
          isLoading: false,
          email: '',
          name: '',
          password: '',
          error: null,
          fieldErrors: {}
        }));

        // Call success callback
        if (onSuccess) {
          onSuccess(data.email);
        }
      } else if (response.status === 409) {
        // Duplicate user (409 Conflict) - treat as email field error
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: null,
          fieldErrors: {
            email: data.error || 'An account with this email already exists'
          }
        }));

        if (onError) {
          onError(data.error || 'An account with this email already exists');
        }
      } else if (response.status === 400) {
        // Validation error (400 Bad Request)
        // Extract field-specific error if available
        const fieldError = data.field ? { [data.field]: data.error } : {};
        
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: data.field ? null : data.error,
          fieldErrors: data.field ? fieldError : {}
        }));

        if (onError) {
          onError(data.error);
        }
      } else {
        // Other error (500, etc.) - generic error
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: data.error || 'An error occurred during registration. Please try again later.',
          fieldErrors: {}
        }));

        if (onError) {
          onError(data.error || 'An error occurred during registration. Please try again later.');
        }
      }
    } catch (error) {
      // Network or parsing error
      const errorMessage = error instanceof Error ? error.message : 'An error occurred. Please try again.';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        fieldErrors: {}
      }));

      if (onError) {
        onError(errorMessage);
      }
    }
  };

  /**
   * Render field-specific error message
   * Returns the error message for a specific field, if any.
   * This error is displayed below the corresponding input field.
   * 
   * Requirements: 10.1 - Error messages specify which field failed
   *               10.2 - Error messages are displayed clearly
   *               10.3 - Non-field errors displayed separately from field errors
   * 
   * Validates: Requirements 10.1, 10.2, 10.3
   */
  const renderFieldError = (field: string): string | null => {
    return state.fieldErrors[field] || null;
  };

  return (
    <form onSubmit={handleSubmit} className="signup-form" noValidate>
      <h1 className="form-title">Create Account</h1>

      {/* Generic error message */}
      {state.error && !state.fieldErrors.email && !state.fieldErrors.name && !state.fieldErrors.password && (
        <div className="error-message" role="alert">
          {state.error}
        </div>
      )}

      {/* Email field */}
      <div className="form-group">
        <label htmlFor="email" className="form-label">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="form-input"
          value={state.email}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
          disabled={state.isLoading}
          required
          aria-required="true"
          aria-invalid={!!state.fieldErrors.email}
          aria-describedby={state.fieldErrors.email ? 'email-error' : undefined}
        />
        {state.fieldErrors.email && (
          <div id="email-error" className="field-error" role="alert">
            {state.fieldErrors.email}
          </div>
        )}
      </div>

      {/* Name field */}
      <div className="form-group">
        <label htmlFor="name" className="form-label">
          Name
        </label>
        <input
          id="name"
          type="text"
          className="form-input"
          value={state.name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
          disabled={state.isLoading}
          required
          aria-required="true"
          aria-invalid={!!state.fieldErrors.name}
          aria-describedby={state.fieldErrors.name ? 'name-error' : undefined}
        />
        {state.fieldErrors.name && (
          <div id="name-error" className="field-error" role="alert">
            {state.fieldErrors.name}
          </div>
        )}
      </div>

      {/* Password field */}
      <div className="form-group">
        <label htmlFor="password" className="form-label">
          Password
        </label>
        <input
          id="password"
          type="password"
          className="form-input"
          value={state.password}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('password', e.target.value)}
          disabled={state.isLoading}
          required
          aria-required="true"
          aria-invalid={!!state.fieldErrors.password}
          aria-describedby={state.fieldErrors.password ? 'password-error' : undefined}
        />
        {state.fieldErrors.password && (
          <div id="password-error" className="field-error" role="alert">
            {state.fieldErrors.password}
          </div>
        )}
      </div>

      {/* Submit button */}
      <button
        type="submit"
        className="submit-button"
        disabled={state.isLoading}
        aria-busy={state.isLoading}
      >
        {state.isLoading ? 'Signing up...' : 'Sign Up'}
      </button>

      {/* Loading indicator */}
      {state.isLoading && (
        <div className="loading-indicator" aria-live="polite" aria-busy="true">
          Creating your account...
        </div>
      )}
    </form>
  );
};
