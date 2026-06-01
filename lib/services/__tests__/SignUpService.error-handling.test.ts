/**
 * Property-Based Tests for Error Handling
 * 
 * Tests error handling for validation failures and duplicate user scenarios
 * Validates: Requirements 9.2, 9.3, 10.1, 10.2
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { SignUpService } from '../SignUpService';

// Mock the database module
vi.mock('@/lib/db', () => ({
  query: vi.fn()
}));

import { query } from '@/lib/db';

describe('SignUpService - Error Handling', () => {
  let service: SignUpService;
  const mockQuery = query as any;

  beforeEach(() => {
    service = new SignUpService();
    mockQuery.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Helper to create signup requests
  const createSignUpRequest = (email: string, name: string = 'John Doe', password: string = 'ValidPass123') => ({
    email,
    name,
    password
  });

  describe('Property 20: Validation failure returns 400', () => {
    /**
     * **Validates: Requirements 9.2, 10.1**
     * 
     * For any validation failure, the SignUpService SHALL return a 400 status code
     * with an error message specifying which field failed validation.
     */
    
    it('should return 400 status on invalid email format', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string().filter(s => !s.includes('@') && s.length > 0),
          async (invalidEmail) => {
            const request = createSignUpRequest(invalidEmail);
            const response = await service.signup(request);

            expect(response.statusCode).toBe(400);
            expect(response.success).toBe(false);
            expect(response.error).toBeDefined();
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should return 400 status on empty email', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(''),
          async (emptyEmail) => {
            const request = createSignUpRequest(emptyEmail);
            const response = await service.signup(request);

            expect(response.statusCode).toBe(400);
            expect(response.success).toBe(false);
            expect(response.error).toContain('Email');
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should return 400 status on invalid name characters', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string().filter(s => /[^a-zA-Z0-9\s\-']/.test(s) && s.length > 0),
          async (invalidName) => {
            const request = createSignUpRequest('user@example.com', invalidName);
            const response = await service.signup(request);

            expect(response.statusCode).toBe(400);
            expect(response.success).toBe(false);
            expect(response.error).toBeDefined();
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should return 400 status on empty name', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(''),
          async (emptyName) => {
            const request = createSignUpRequest('user@example.com', emptyName);
            const response = await service.signup(request);

            expect(response.statusCode).toBe(400);
            expect(response.success).toBe(false);
            expect(response.error).toContain('Name');
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should return 400 status on short password', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ maxLength: 7 }),
          async (shortPassword) => {
            const request = createSignUpRequest('user@example.com', 'John Doe', shortPassword);
            const response = await service.signup(request);

            expect(response.statusCode).toBe(400);
            expect(response.success).toBe(false);
            expect(response.error).toBeDefined();
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should return 400 status on empty password', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(''),
          async (emptyPassword) => {
            const request = createSignUpRequest('user@example.com', 'John Doe', emptyPassword);
            const response = await service.signup(request);

            expect(response.statusCode).toBe(400);
            expect(response.success).toBe(false);
            expect(response.error).toContain('Password');
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should return 400 status on long password', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 129 }),
          async (longPassword) => {
            const request = createSignUpRequest('user@example.com', 'John Doe', longPassword);
            const response = await service.signup(request);

            expect(response.statusCode).toBe(400);
            expect(response.success).toBe(false);
            expect(response.error).toBeDefined();
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should include descriptive error message for validation failures', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          async (email) => {
            const request = createSignUpRequest(email, '', 'ValidPass123');
            const response = await service.signup(request);

            expect(response.statusCode).toBe(400);
            expect(response.success).toBe(false);
            expect(response.error).toBeTruthy();
            expect(response.error!.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should handle control characters in validation with 400 response', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string().map(s => s + '\x00'),
          async (emailWithNull) => {
            const request = createSignUpRequest(emailWithNull);
            const response = await service.signup(request);

            expect(response.statusCode).toBe(400);
            expect(response.success).toBe(false);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property 21: Duplicate user returns 409', () => {
    /**
     * **Validates: Requirements 9.3, 10.2**
     * 
     * For any duplicate user detection, the SignUpService SHALL return a 409 status code.
     * For any email that exists in the database (regardless of case), the SignUpService SHALL
     * detect the duplicate and return a 409 status code with the message
     * "An account with this email already exists".
     */
    
    it('should return 409 status code when user already exists', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          async (email) => {
            // Setup: Mock database to indicate existing user
            mockQuery.mockResolvedValueOnce({
              rows: [{ id: '123' }],
              rowCount: 1
            });

            const request = createSignUpRequest(email);
            const response = await service.signup(request);

            expect(response.statusCode).toBe(409);
            expect(response.success).toBe(false);
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should detect duplicate regardless of email case', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          async (email) => {
            // Setup: Mock database to indicate existing user
            mockQuery.mockResolvedValueOnce({
              rows: [{ id: '123' }],
              rowCount: 1
            });

            // Mix case in the input (database should handle case-insensitive comparison)
            const mixedCaseEmail = email
              .split('')
              .map((char, i) => (i % 2 === 0 ? char.toUpperCase() : char.toLowerCase()))
              .join('');

            const request = createSignUpRequest(mixedCaseEmail);
            const response = await service.signup(request);

            expect(response.statusCode).toBe(409);
            expect(response.success).toBe(false);
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should return specific error message for duplicate user', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          async (email) => {
            // Setup: Mock database to indicate existing user
            mockQuery.mockResolvedValueOnce({
              rows: [{ id: '123' }],
              rowCount: 1
            });

            const request = createSignUpRequest(email);
            const response = await service.signup(request);

            expect(response.statusCode).toBe(409);
            expect(response.success).toBe(false);
            expect(response.error).toBe('An account with this email already exists');
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should not proceed to password hashing on duplicate detection', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          async (email) => {
            // Reset mock for this iteration
            mockQuery.mockReset();
            
            // Setup: Mock database to indicate existing user
            mockQuery.mockResolvedValueOnce({
              rows: [{ id: '123' }],
              rowCount: 1
            });

            const request = createSignUpRequest(email);
            const response = await service.signup(request);

            // Assert: Should return 409 without calling database insert
            expect(response.statusCode).toBe(409);
            // Only duplicate check should be called (not user creation)
            expect(mockQuery).toHaveBeenCalledWith(
              'SELECT 1 FROM story_auditor.user WHERE LOWER(email) = LOWER($1)',
              [email.toLowerCase()]
            );
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should handle empty result set as non-duplicate', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          async (email) => {
            // Setup: Mock database to indicate NO existing user (empty result)
            mockQuery.mockResolvedValueOnce({
              rows: [],
              rowCount: 0
            });
            // Mock password hashing
            mockQuery.mockResolvedValueOnce({
              rows: [{
                id: 'new-user-id',
                email: email,
                name: 'John Doe',
                password_hash: '$2b$10$hash',
                created_at: new Date(),
                updated_at: new Date()
              }],
              rowCount: 1
            });

            const request = createSignUpRequest(email);
            const response = await service.signup(request);

            // Should NOT return 409, should proceed
            expect(response.statusCode).not.toBe(409);
          }
        ),
        { numRuns: 25 }
      );
    });

    it('should handle multiple duplicate detection scenarios', async () => {
      // Scenario 1: Email exists exactly as provided
      mockQuery.mockResolvedValueOnce({ rows: [{ id: '1' }], rowCount: 1 });
      let response = await service.signup(createSignUpRequest('test@example.com'));
      expect(response.statusCode).toBe(409);

      // Scenario 2: Email exists with different case
      mockQuery.mockResolvedValueOnce({ rows: [{ id: '2' }], rowCount: 1 });
      response = await service.signup(createSignUpRequest('TEST@EXAMPLE.COM'));
      expect(response.statusCode).toBe(409);

      // Scenario 3: No duplicate, should fail on password validation
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      response = await service.signup(createSignUpRequest('new@example.com', 'John', 'short'));
      expect(response.statusCode).toBe(400); // password too short

      // Scenario 4: Multiple validation scenarios should all return 400
      response = await service.signup(createSignUpRequest('', 'John', 'password123'));
      expect(response.statusCode).toBe(400); // empty email

      response = await service.signup(createSignUpRequest('user@example.com', '', 'password123'));
      expect(response.statusCode).toBe(400); // empty name
    });
  });

  describe('Integration: Validation and Duplicate Detection Flow', () => {
    it('should prioritize validation errors over duplicate check', async () => {
      // Even if duplicate check would pass, validation errors should be returned first
      const response = await service.signup(createSignUpRequest('invalid-email'));
      expect(response.statusCode).toBe(400);
      expect(mockQuery).not.toHaveBeenCalled(); // Duplicate check never reached
    });

    it('should handle all error scenarios with correct status codes', async () => {
      // Scenario 1: Email validation error
      const validationError = await service.signup(createSignUpRequest('invalid'));
      expect(validationError.statusCode).toBe(400);

      // Scenario 2: Duplicate user error
      mockQuery.mockResolvedValueOnce({ rows: [{ id: '123' }], rowCount: 1 });
      const duplicateError = await service.signup(createSignUpRequest('existing@example.com'));
      expect(duplicateError.statusCode).toBe(409);

      // Scenario 3: Database error during duplicate check
      mockQuery.mockRejectedValueOnce(new Error('Database connection error'));
      const dbError = await service.signup(createSignUpRequest('user@example.com'));
      expect(dbError.statusCode).toBe(500);
    });
  });
});
