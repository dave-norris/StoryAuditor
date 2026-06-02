/**
 * SignUpService - Backend service for user registration
 * Handles validation, password hashing, duplicate detection, and database operations
 */

import bcrypt from 'bcrypt';
import { query } from '@/lib/db';
import {
  SignUpRequest,
  SignUpResponse,
  User,
  ValidationResult
} from '@/lib/types/signup';

export class SignUpService {
  private readonly SALT_ROUNDS = 10;
  private readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private readonly NAME_REGEX = /^[a-zA-Z0-9\s\-']+$/;
  private readonly MIN_PASSWORD_LENGTH = 8;
  private readonly MAX_PASSWORD_LENGTH = 128;

  /**
   * Main signup method - orchestrates the entire registration flow
   * Requirements: 8.1, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4
   */
  async signup(request: SignUpRequest): Promise<SignUpResponse> {
    // 1. Sanitize inputs
    const email = request.email?.trim().toLowerCase() || '';
    const name = request.name?.trim() || '';
    const password = request.password || '';

    // 2. Validate email
    const emailValidation = this.validateEmail(email);
    if (!emailValidation.valid) {
      return {
        success: false,
        error: emailValidation.error,
        statusCode: 400
      };
    }

    // 3. Validate name
    const nameValidation = this.validateName(name);
    if (!nameValidation.valid) {
      return {
        success: false,
        error: nameValidation.error,
        statusCode: 400
      };
    }

    // 4. Validate password
    const passwordValidation = this.validatePassword(password);
    if (!passwordValidation.valid) {
      return {
        success: false,
        error: passwordValidation.error,
        statusCode: 400
      };
    }

    // 5. Check for duplicate user
    try {
      const isDuplicate = await this.checkDuplicateUser(email);
      if (isDuplicate) {
        return {
          success: false,
          error: 'An account with this email already exists',
          statusCode: 409
        };
      }
    } catch (error) {
      // Database error during duplicate check
      this.logDatabaseError('signup - duplicate check', error);
      return {
        success: false,
        error: 'An error occurred during registration. Please try again later.',
        statusCode: 500
      };
    }

    // 6. Hash password
    try {
      const passwordHash = await this.hashPassword(password);

      // 7. Create user in database
      const user = await this.createUser(email, name, passwordHash);

      return {
        success: true,
        email: user.email,
        statusCode: 201
      };
    } catch (error) {
      // Database error during user creation
      this.logDatabaseError('signup - user creation', error);
      return {
        success: false,
        error: 'An error occurred during registration. Please try again later.',
        statusCode: 500
      };
    }
  }

  /**
   * Validate email format
   */
  public validateEmail(email: string): ValidationResult {
    if (!email) {
      return { valid: false, error: 'Email is required' };
    }
    if (!this.EMAIL_REGEX.test(email)) {
      return { valid: false, error: 'Invalid email format' };
    }
    if (email.includes('\0') || /[\x00-\x1F]/.test(email)) {
      return { valid: false, error: 'Invalid email format' };
    }
    return { valid: true };
  }

  /**
   * Validate name format
   */
  public validateName(name: string): ValidationResult {
    if (!name || !name.trim()) {
      return { valid: false, error: 'Name is required' };
    }
    if (!this.NAME_REGEX.test(name)) {
      return { valid: false, error: 'Name contains invalid characters' };
    }
    if (name.includes('\0') || /[\x00-\x1F]/.test(name)) {
      return { valid: false, error: 'Name contains invalid characters' };
    }
    return { valid: true };
  }

  /**
   * Validate password strength
   */
  public validatePassword(password: string): ValidationResult {
    if (!password) {
      return { valid: false, error: 'Password is required' };
    }
    if (password.length < this.MIN_PASSWORD_LENGTH) {
      return { valid: false, error: 'Password must be at least 8 characters' };
    }
    if (password.length > this.MAX_PASSWORD_LENGTH) {
      return { valid: false, error: 'Password must not exceed 128 characters' };
    }
    if (password.includes('\0') || /[\x00-\x1F]/.test(password)) {
      return { valid: false, error: 'Password contains invalid characters' };
    }
    return { valid: true };
  }

  /**
   * Check if a user with the given email already exists (case-insensitive)
   * Uses parameterized query with LOWER() for case-insensitive comparison
   * Throws error if database operation fails
   * 
   * Requirements: 5.1, 5.2, 5.4, 12.1, 12.2
   */
  public async checkDuplicateUser(email: string): Promise<boolean> {
    try {
      const result = await query(
        'SELECT 1 FROM story_auditor.users WHERE LOWER(email) = LOWER($1)',
        [email]
      );
      return result.rowCount > 0;
    } catch (error) {
      this.logDatabaseError('checkDuplicateUser', error);
      throw error;
    }
  }

  /**
   * Hash a password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Create a new user in the database with parameterized query
   * Uses parameterized INSERT to prevent SQL injection
   * Throws error if database operation fails
   * 
   * Requirements: 7.1, 7.2, 12.1, 12.2
   */
  private async createUser(
    email: string,
    name: string,
    passwordHash: string
  ): Promise<User> {
    try {
      const result = await query(
        `INSERT INTO story_auditor.users (email, name, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, email, name, password_hash, created_at, updated_at`,
        [email, name, passwordHash]
      );
      
      if (result.rowCount === 0) {
        throw new Error('Failed to create user');
      }

      return result.rows[0];
    } catch (error) {
      this.logDatabaseError('createUser', error);
      throw error;
    }
  }

  /**
   * Log database errors with context (operation, timestamp, error details)
   * Requirement: 8.2
   */
  private logDatabaseError(operation: string, error: unknown): void {
    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    
    console.error(
      `[${timestamp}] Database error in ${operation}: ${errorMessage}`,
      errorStack ? `\nStack: ${errorStack}` : ''
    );
  }
}
