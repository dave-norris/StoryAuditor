/**
 * POST /api/auth/signup - User registration endpoint
 * 
 * Handles user sign-up requests with:
 * - Request body validation and structure checking
 * - JSON parsing error handling
 * - Appropriate HTTP status codes and error responses
 * 
 * Requirements: 1.4, 9.1, 9.2, 9.3, 10.1
 */

import { SignUpService } from '@/lib/services/SignUpService';
import { SignUpRequest } from '@/lib/types/signup';

/**
 * Validates that the request body has the required structure
 * Returns validation error or null if valid
 */
function validateRequestStructure(body: unknown): string | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Request body must be a JSON object';
  }

  const obj = body as Record<string, unknown>;

  // Check for required fields
  if (!('email' in obj)) {
    return 'Missing required field: email';
  }
  if (!('name' in obj)) {
    return 'Missing required field: name';
  }
  if (!('password' in obj)) {
    return 'Missing required field: password';
  }

  // Check field types
  if (typeof obj.email !== 'string') {
    return 'Field email must be a string';
  }
  if (typeof obj.name !== 'string') {
    return 'Field name must be a string';
  }
  if (typeof obj.password !== 'string') {
    return 'Field password must be a string';
  }

  return null;
}

/**
 * POST handler for user sign-up
 */
export async function POST(request: Request) {
  try {
    // Parse JSON request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      // JSON parsing error
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body',
          statusCode: 400
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate request body structure
    const structureError = validateRequestStructure(body);
    if (structureError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: structureError,
          statusCode: 400
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Type-safe request body
    const signUpRequest = body as SignUpRequest;

    // Call SignUpService
    const service = new SignUpService();
    const response = await service.signup(signUpRequest);

    // Return response with appropriate status code
    return new Response(JSON.stringify(response), {
      status: response.statusCode,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    // Unexpected error - return 500 with generic message
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Unexpected error in POST /api/auth/signup:', errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'An error occurred during registration. Please try again later.',
        statusCode: 500
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
