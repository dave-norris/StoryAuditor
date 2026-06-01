/**
 * Health Check Service Tests
 * 
 * Tests for the HealthCheckService class, including successful health checks,
 * timeout handling, and error scenarios.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HealthCheckService } from '../../lib/db/health-check';
import { PrismaClient } from '@prisma/client';

describe('HealthCheckService', () => {
  let mockPrisma: any;
  let healthCheckService: HealthCheckService;

  beforeEach(() => {
    // Create a mock Prisma Client
    mockPrisma = {
      $queryRaw: vi.fn(),
      $disconnect: vi.fn(),
    };
  });

  describe('constructor', () => {
    it('should initialize with default timeout of 5000ms', () => {
      healthCheckService = new HealthCheckService(mockPrisma);
      expect(healthCheckService).toBeDefined();
    });

    it('should initialize with custom timeout', () => {
      healthCheckService = new HealthCheckService(mockPrisma, 3000);
      expect(healthCheckService).toBeDefined();
    });
  });

  describe('check()', () => {
    it('should return healthy status when query succeeds', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      healthCheckService = new HealthCheckService(mockPrisma, 5000);

      const result = await healthCheckService.check();

      expect(result.status).toBe('healthy');
      expect(result.message).toBe('Database connection is healthy');
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should return unhealthy status when query fails', async () => {
      mockPrisma.$queryRaw.mockRejectedValueOnce(new Error('Connection refused'));
      healthCheckService = new HealthCheckService(mockPrisma, 5000);

      const result = await healthCheckService.check();

      expect(result.status).toBe('unhealthy');
      expect(result.message).toContain('Connection failed');
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should return timeout status when query exceeds timeout', async () => {
      // Create a promise that never resolves
      mockPrisma.$queryRaw.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 10000))
      );
      healthCheckService = new HealthCheckService(mockPrisma, 100);

      const result = await healthCheckService.check();

      expect(result.status).toBe('timeout');
      expect(result.message).toContain('timeout');
      expect(result.responseTime).toBeLessThan(200); // Should be around 100ms
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should measure response time accurately', async () => {
      mockPrisma.$queryRaw.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve([]), 50))
      );
      healthCheckService = new HealthCheckService(mockPrisma, 5000);

      const result = await healthCheckService.check();

      expect(result.status).toBe('healthy');
      expect(result.responseTime).toBeGreaterThanOrEqual(40);
      expect(result.responseTime).toBeLessThan(200);
    });

    it('should handle database connection errors', async () => {
      mockPrisma.$queryRaw.mockRejectedValueOnce(
        new Error('ECONNREFUSED: Connection refused')
      );
      healthCheckService = new HealthCheckService(mockPrisma, 5000);

      const result = await healthCheckService.check();

      expect(result.status).toBe('unhealthy');
      expect(result.message).toContain('Connection failed');
    });

    it('should handle authentication errors', async () => {
      mockPrisma.$queryRaw.mockRejectedValueOnce(
        new Error('password authentication failed')
      );
      healthCheckService = new HealthCheckService(mockPrisma, 5000);

      const result = await healthCheckService.check();

      expect(result.status).toBe('unhealthy');
      expect(result.message).toContain('Connection failed');
    });

    it('should handle database not found errors', async () => {
      mockPrisma.$queryRaw.mockRejectedValueOnce(
        new Error('database "testdb" does not exist')
      );
      healthCheckService = new HealthCheckService(mockPrisma, 5000);

      const result = await healthCheckService.check();

      expect(result.status).toBe('unhealthy');
      expect(result.message).toContain('Connection failed');
    });
  });

  describe('timeout handling', () => {
    it('should timeout after specified duration', async () => {
      mockPrisma.$queryRaw.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 5000))
      );
      healthCheckService = new HealthCheckService(mockPrisma, 100);

      const startTime = Date.now();
      const result = await healthCheckService.check();
      const duration = Date.now() - startTime;

      expect(result.status).toBe('timeout');
      expect(duration).toBeLessThan(500); // Should timeout quickly, not wait 5 seconds
    });

    it('should prioritize timeout errors over other errors', async () => {
      // This test verifies that timeout errors take precedence
      mockPrisma.$queryRaw.mockImplementationOnce(
        () => new Promise((resolve, reject) => {
          setTimeout(() => reject(new Error('Some other error')), 5000);
        })
      );
      healthCheckService = new HealthCheckService(mockPrisma, 100);

      const result = await healthCheckService.check();

      expect(result.status).toBe('timeout');
      expect(result.message).toContain('timeout');
    });
  });

  describe('response time measurement', () => {
    it('should measure response time for successful queries', async () => {
      mockPrisma.$queryRaw.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve([]), 50))
      );
      healthCheckService = new HealthCheckService(mockPrisma, 5000);

      const result = await healthCheckService.check();

      expect(result.responseTime).toBeGreaterThanOrEqual(40);
      expect(result.responseTime).toBeLessThan(200);
    });

    it('should measure response time for failed queries', async () => {
      mockPrisma.$queryRaw.mockImplementationOnce(
        () => new Promise((resolve, reject) => {
          setTimeout(() => reject(new Error('Connection error')), 30);
        })
      );
      healthCheckService = new HealthCheckService(mockPrisma, 5000);

      const result = await healthCheckService.check();

      expect(result.responseTime).toBeGreaterThanOrEqual(20);
      expect(result.responseTime).toBeLessThan(200);
    });

    it('should measure response time for timeout scenarios', async () => {
      mockPrisma.$queryRaw.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 10000))
      );
      healthCheckService = new HealthCheckService(mockPrisma, 100);

      const result = await healthCheckService.check();

      expect(result.responseTime).toBeGreaterThanOrEqual(80);
      expect(result.responseTime).toBeLessThan(300);
    });
  });

  describe('timestamp handling', () => {
    it('should include timestamp in result', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);
      healthCheckService = new HealthCheckService(mockPrisma, 5000);

      const beforeCheck = new Date();
      const result = await healthCheckService.check();
      const afterCheck = new Date();

      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(beforeCheck.getTime());
      expect(result.timestamp.getTime()).toBeLessThanOrEqual(afterCheck.getTime());
    });
  });
});
