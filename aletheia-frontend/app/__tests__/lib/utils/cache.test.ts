/**
 * Tests for cache utilities
 */

import { getCachedData, createCachedFunction } from '../../../lib/utils/cache';

describe('cache utilities', () => {
  describe('getCachedData', () => {
    it('should return data with key and timestamp', async () => {
      const result = await getCachedData('test-key');
      expect(result).toHaveProperty('key', 'test-key');
      expect(result).toHaveProperty('timestamp');
      expect(typeof result.timestamp).toBe('number');
    });

    it('should return different timestamps for different calls', async () => {
      const result1 = await getCachedData('key1');
      await new Promise(resolve => setTimeout(resolve, 10));
      const result2 = await getCachedData('key2');
      expect(result1.timestamp).not.toBe(result2.timestamp);
    });
  });

  describe('createCachedFunction', () => {
    it('should create a cached function', () => {
      const fn = jest.fn((x: number) => x * 2);
      const cachedFn = createCachedFunction(fn);
      expect(typeof cachedFn).toBe('function');
    });

    it('should return a function that can be called', () => {
      const fn = jest.fn((x: number) => x * 2);
      const cachedFn = createCachedFunction(fn);
      
      const result = cachedFn(5);
      
      expect(result).toBe(10);
      expect(fn).toHaveBeenCalledWith(5);
    });
  });
});
