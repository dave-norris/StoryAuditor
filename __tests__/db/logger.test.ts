/**
 * Database Logger Tests
 * 
 * Tests for the DatabaseLogger class, including logging functionality,
 * sensitive data sanitization, and log history management.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DatabaseLogger, LogLevel } from '../../lib/db/logger';

describe('DatabaseLogger', () => {
  beforeEach(() => {
    // Clear log history before each test
    DatabaseLogger.clearHistory();
    // Set default log level
    DatabaseLogger.setMinLogLevel('debug');
    // Mock console methods
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('debug()', () => {
    it('should log debug messages', () => {
      DatabaseLogger.debug('TestComponent', 'test_operation', 'Debug message');

      const history = DatabaseLogger.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].level).toBe('debug');
      expect(history[0].message).toBe('Debug message');
      expect(history[0].component).toBe('TestComponent');
      expect(history[0].operation).toBe('test_operation');
    });

    it('should include context in debug logs', () => {
      DatabaseLogger.debug('TestComponent', 'test_operation', 'Debug message', {
        key: 'value',
        number: 42,
      });

      const history = DatabaseLogger.getHistory();
      expect(history[0].context).toEqual({ key: 'value', number: 42 });
    });
  });

  describe('info()', () => {
    it('should log info messages', () => {
      DatabaseLogger.info('TestComponent', 'test_operation', 'Info message');

      const history = DatabaseLogger.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].level).toBe('info');
      expect(history[0].message).toBe('Info message');
    });
  });

  describe('warn()', () => {
    it('should log warning messages', () => {
      DatabaseLogger.warn('TestComponent', 'test_operation', 'Warning message');

      const history = DatabaseLogger.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].level).toBe('warn');
      expect(history[0].message).toBe('Warning message');
    });

    it('should log warning messages with error', () => {
      const error = new Error('Test error');
      DatabaseLogger.warn('TestComponent', 'test_operation', 'Warning message', error);

      const history = DatabaseLogger.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].level).toBe('warn');
      expect(history[0].error).toBeDefined();
      expect(history[0].error?.message).toBe('Test error');
    });

    it('should log warning messages with context', () => {
      DatabaseLogger.warn('TestComponent', 'test_operation', 'Warning message', {
        key: 'value',
      });

      const history = DatabaseLogger.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].context).toEqual({ key: 'value' });
    });
  });

  describe('error()', () => {
    it('should log error messages', () => {
      DatabaseLogger.error('TestComponent', 'test_operation', 'Error message');

      const history = DatabaseLogger.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].level).toBe('error');
      expect(history[0].message).toBe('Error message');
    });

    it('should log error messages with error object', () => {
      const error = new Error('Test error');
      DatabaseLogger.error('TestComponent', 'test_operation', 'Error message', error);

      const history = DatabaseLogger.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].error).toBeDefined();
      expect(history[0].error?.message).toBe('Test error');
      expect(history[0].error?.type).toBe('Error');
    });
  });

  describe('critical()', () => {
    it('should log critical messages', () => {
      DatabaseLogger.critical('TestComponent', 'test_operation', 'Critical message');

      const history = DatabaseLogger.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].level).toBe('critical');
      expect(history[0].message).toBe('Critical message');
    });
  });

  describe('sensitive data sanitization', () => {
    it('should sanitize passwords in connection strings', () => {
      const message = 'Connection failed: postgresql://user:password123@localhost:5432/db';
      DatabaseLogger.info('TestComponent', 'test_operation', message);

      const history = DatabaseLogger.getHistory();
      expect(history[0].message).toContain('***');
      expect(history[0].message).not.toContain('password123');
    });

    it('should sanitize passwords in context', () => {
      DatabaseLogger.info('TestComponent', 'test_operation', 'Test message', {
        url: 'postgresql://user:password123@localhost:5432/db',
      });

      const history = DatabaseLogger.getHistory();
      expect(history[0].context?.url).toContain('***');
      expect(history[0].context?.url).not.toContain('password123');
    });

    it('should sanitize API keys in messages', () => {
      const message = 'API key: sk_live_abc123def456';
      DatabaseLogger.info('TestComponent', 'test_operation', message);

      const history = DatabaseLogger.getHistory();
      expect(history[0].message).toContain('***');
      expect(history[0].message).not.toContain('abc123def456');
    });

    it('should sanitize tokens in messages', () => {
      const message = 'Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      DatabaseLogger.info('TestComponent', 'test_operation', message);

      const history = DatabaseLogger.getHistory();
      expect(history[0].message).toContain('***');
    });
  });

  describe('log history management', () => {
    it('should store log entries in history', () => {
      DatabaseLogger.info('Component1', 'op1', 'Message 1');
      DatabaseLogger.info('Component2', 'op2', 'Message 2');
      DatabaseLogger.info('Component3', 'op3', 'Message 3');

      const history = DatabaseLogger.getHistory();
      expect(history).toHaveLength(3);
    });

    it('should clear log history', () => {
      DatabaseLogger.info('Component1', 'op1', 'Message 1');
      expect(DatabaseLogger.getHistory()).toHaveLength(1);

      DatabaseLogger.clearHistory();
      expect(DatabaseLogger.getHistory()).toHaveLength(0);
    });

    it('should limit history size', () => {
      // Log more than the max history size
      for (let i = 0; i < 1100; i++) {
        DatabaseLogger.info('Component', 'operation', `Message ${i}`);
      }

      const history = DatabaseLogger.getHistory();
      expect(history.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('log filtering', () => {
    beforeEach(() => {
      DatabaseLogger.debug('Component1', 'op1', 'Debug message');
      DatabaseLogger.info('Component1', 'op2', 'Info message');
      DatabaseLogger.warn('Component2', 'op1', 'Warning message');
      DatabaseLogger.error('Component2', 'op3', 'Error message');
      DatabaseLogger.critical('Component3', 'op1', 'Critical message');
    });

    it('should filter logs by level', () => {
      const errors = DatabaseLogger.getByLevel('error');
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Error message');
    });

    it('should filter logs by component', () => {
      const component1Logs = DatabaseLogger.getByComponent('Component1');
      expect(component1Logs).toHaveLength(2);
      expect(component1Logs[0].component).toBe('Component1');
      expect(component1Logs[1].component).toBe('Component1');
    });

    it('should filter logs by operation', () => {
      const op1Logs = DatabaseLogger.getByOperation('op1');
      expect(op1Logs).toHaveLength(3);
      expect(op1Logs.every(log => log.operation === 'op1')).toBe(true);
    });
  });

  describe('log level filtering', () => {
    it('should output only messages at or above minimum level', () => {
      DatabaseLogger.setMinLogLevel('warn');
      DatabaseLogger.debug('Component', 'op', 'Debug message');
      DatabaseLogger.info('Component', 'op', 'Info message');
      DatabaseLogger.warn('Component', 'op', 'Warning message');

      // All messages are stored in history
      const history = DatabaseLogger.getHistory();
      expect(history).toHaveLength(3);

      // But only warn and above are output to console
      expect(console.warn).toHaveBeenCalled();
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
    });

    it('should output all messages at or above minimum level', () => {
      DatabaseLogger.setMinLogLevel('info');
      DatabaseLogger.debug('Component', 'op', 'Debug message');
      DatabaseLogger.info('Component', 'op', 'Info message');
      DatabaseLogger.warn('Component', 'op', 'Warning message');
      DatabaseLogger.error('Component', 'op', 'Error message');

      // All messages are stored in history
      const history = DatabaseLogger.getHistory();
      expect(history).toHaveLength(4);

      // But only info and above are output to console
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('timestamp handling', () => {
    it('should include timestamp in log entries', () => {
      const beforeLog = new Date();
      DatabaseLogger.info('Component', 'operation', 'Message');
      const afterLog = new Date();

      const history = DatabaseLogger.getHistory();
      expect(history[0].timestamp).toBeInstanceOf(Date);
      expect(history[0].timestamp.getTime()).toBeGreaterThanOrEqual(beforeLog.getTime());
      expect(history[0].timestamp.getTime()).toBeLessThanOrEqual(afterLog.getTime());
    });
  });

  describe('error object handling', () => {
    it('should capture error type and message', () => {
      const error = new TypeError('Invalid type');
      DatabaseLogger.error('Component', 'operation', 'Error occurred', error);

      const history = DatabaseLogger.getHistory();
      expect(history[0].error?.type).toBe('TypeError');
      expect(history[0].error?.message).toBe('Invalid type');
    });

    it('should capture error stack trace', () => {
      const error = new Error('Test error');
      DatabaseLogger.error('Component', 'operation', 'Error occurred', error);

      const history = DatabaseLogger.getHistory();
      expect(history[0].error?.stack).toBeDefined();
      expect(history[0].error?.stack).toContain('Error: Test error');
    });
  });
});
