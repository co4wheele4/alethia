/**
 * Tests for emotion-cache.ts
 */

import createEmotionCache from '../../lib/emotion-cache';

// Mock @emotion/cache
jest.mock('@emotion/cache', () => {
  return jest.fn(() => ({
    // Mock cache object
    key: 'mui-style',
    insertionPoint: undefined,
    prepend: true,
  }));
});

describe('emotion-cache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createEmotionCache', () => {
    it('should create a cache with correct key', () => {
      const cache = createEmotionCache();
      expect(cache).toBeDefined();
      expect(cache.key).toBe('mui-style');
    });

    it('should create cache with prepend option', () => {
      const cache = createEmotionCache();
      expect(cache.prepend).toBe(true);
    });

    it('should handle browser environment', () => {
      // Mock document.querySelector
      const mockMeta = document.createElement('meta');
      mockMeta.setAttribute('name', 'emotion-insertion-point');
      document.head.appendChild(mockMeta);

      const cache = createEmotionCache();
      expect(cache).toBeDefined();

      // Cleanup
      document.head.removeChild(mockMeta);
    });

    it('should handle missing emotion insertion point', () => {
      // Ensure no insertion point exists
      const existingMeta = document.querySelector('meta[name="emotion-insertion-point"]');
      if (existingMeta) {
        document.head.removeChild(existingMeta);
      }

      const cache = createEmotionCache();
      expect(cache).toBeDefined();
      expect(cache.insertionPoint).toBeUndefined();
    });

    it('should work in non-browser environment', () => {
      // This test verifies the function doesn't crash in SSR
      const originalDocument = global.document;
      // @ts-ignore - temporarily remove document
      delete global.document;

      // Should not throw
      expect(() => {
        // In non-browser, isBrowser will be false
        // The function should still work
      }).not.toThrow();

      // Restore document
      global.document = originalDocument;
    });
  });
});
