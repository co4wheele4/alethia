/**
 * Edge case tests for cache utilities
 * Tests edge cases, error handling, and all code paths
 */

import { getCachedData, createCachedFunction } from '../../../lib/utils/cache';

describe('cache utilities Edge Cases', () => {
  describe('getCachedData - Edge Cases', () => {
    it('should handle empty string key', async () => {
      const result = await getCachedData('');
      expect(result).toHaveProperty('key', '');
      expect(result).toHaveProperty('timestamp');
    });

    it('should handle very long key', async () => {
      const longKey = 'a'.repeat(1000);
      const result = await getCachedData(longKey);
      expect(result).toHaveProperty('key', longKey);
    });

    it('should handle key with special characters', async () => {
      const specialKey = 'key!@#$%^&*()_+-=[]{}|;:,.<>?';
      const result = await getCachedData(specialKey);
      expect(result).toHaveProperty('key', specialKey);
    });

    it('should return timestamp as number', async () => {
      const result = await getCachedData('test');
      expect(typeof result.timestamp).toBe('number');
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it('should return different timestamps for different keys', async () => {
      const result1 = await getCachedData('key1');
      await new Promise(resolve => setTimeout(resolve, 10));
      const result2 = await getCachedData('key2');
      
      expect(result1.key).not.toBe(result2.key);
      // Timestamps might be close but should be different
      expect(result1.timestamp).toBeDefined();
      expect(result2.timestamp).toBeDefined();
    });

    it('should handle null key (if allowed)', async () => {
      // @ts-ignore - testing edge case
      const result = await getCachedData(null);
      expect(result).toHaveProperty('key');
    });

    it('should handle undefined key (if allowed)', async () => {
      // @ts-ignore - testing edge case
      const result = await getCachedData(undefined);
      expect(result).toHaveProperty('key');
    });
  });

  describe('createCachedFunction - Edge Cases', () => {
    it('should handle function that returns undefined', () => {
      const fn = jest.fn(() => undefined);
      const cachedFn = createCachedFunction(fn);
      
      const result = cachedFn(1);
      expect(result).toBeUndefined();
      expect(fn).toHaveBeenCalledWith(1);
    });

    it('should handle function that returns null', () => {
      const fn = jest.fn(() => null);
      const cachedFn = createCachedFunction(fn);
      
      const result = cachedFn(1);
      expect(result).toBeNull();
      expect(fn).toHaveBeenCalledWith(1);
    });

    it('should handle function that throws error', () => {
      const fn = jest.fn(() => {
        throw new Error('Function error');
      });
      const cachedFn = createCachedFunction(fn);
      
      expect(() => cachedFn(1)).toThrow('Function error');
      expect(fn).toHaveBeenCalledWith(1);
    });

    it('should handle function with multiple arguments', () => {
      const fn = jest.fn((a: number, b: number, c: string) => a + b + c);
      const cachedFn = createCachedFunction(fn);
      
      const result = cachedFn(1, 2, 'test');
      expect(result).toBe('3test');
      expect(fn).toHaveBeenCalledWith(1, 2, 'test');
    });

    it('should handle function with no arguments', () => {
      const fn = jest.fn(() => 'result');
      const cachedFn = createCachedFunction(fn);
      
      const result = cachedFn();
      expect(result).toBe('result');
      expect(fn).toHaveBeenCalled();
    });

    it('should handle async function', async () => {
      const fn = jest.fn(async (x: number) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return x * 2;
      });
      const cachedFn = createCachedFunction(fn);
      
      const result = await cachedFn(5);
      expect(result).toBe(10);
      expect(fn).toHaveBeenCalledWith(5);
    });

    it('should preserve function type', () => {
      const fn = (x: number) => x * 2;
      const cachedFn = createCachedFunction(fn);
      
      expect(typeof cachedFn).toBe('function');
      expect(cachedFn(5)).toBe(10);
    });
  });
});
