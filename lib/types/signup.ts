/**
 * TypeScript interfaces for the user sign-up feature
 * Defines request/response types and data models
 */

/**
 * Request payload for user sign-up
 */
export interface SignUpRequest {
  email: string;
  name: string;
  password: string;
}

/**
 * Response payload for user sign-up
 */
export interface SignUpResponse {
  success: boolean;
  email?: string;
  error?: string;
  field?: string;
  statusCode: number;
}

/**
 * User record from the database
 */
export interface User {
  id: number;
  clerk_id: string | null;
  email: string;
  name: string;
  password_hash: string;
  is_active: boolean;
  created_dt: string;
  updated_dt: string;
}

/**
 * Result of a validation operation
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}
