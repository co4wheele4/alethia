/**
 * Tests for authentication utilities
 */

import { getAuthToken, setAuthToken, removeAuthToken, isAuthenticated } from '../utils/auth';
import { AUTH_TOKEN_KEY } from '../../../lib/constants';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('auth utilities', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('getAuthToken', () => {
    it('should return null when no token is stored', () => {
      expect(getAuthToken()).toBeNull();
    });

    it('should return token when stored', () => {
      const token = 'test-token-123';
      localStorageMock.setItem(AUTH_TOKEN_KEY, token);
      expect(getAuthToken()).toBe(token);
    });

    it('should return null on server side (window undefined)', () => {
      const originalWindow = global.window;
      // @ts-expect-error - intentionally setting to undefined
      delete global.window;
      expect(getAuthToken()).toBeNull();
      global.window = originalWindow;
    });
  });

  describe('setAuthToken', () => {
    it('should store token in localStorage', () => {
      const token = 'test-token-456';
      setAuthToken(token);
      expect(localStorageMock.getItem(AUTH_TOKEN_KEY)).toBe(token);
    });

    it('should not throw on server side (window undefined)', () => {
      const originalWindow = global.window;
      // @ts-expect-error - intentionally setting to undefined
      delete global.window;
      expect(() => setAuthToken('token')).not.toThrow();
      global.window = originalWindow;
    });
  });

  describe('removeAuthToken', () => {
    it('should remove token from localStorage', () => {
      localStorageMock.setItem(AUTH_TOKEN_KEY, 'test-token');
      removeAuthToken();
      expect(localStorageMock.getItem(AUTH_TOKEN_KEY)).toBeNull();
    });

    it('should not throw when no token exists', () => {
      expect(() => removeAuthToken()).not.toThrow();
    });

    it('should not throw on server side (window undefined)', () => {
      const originalWindow = global.window;
      // @ts-expect-error - intentionally setting to undefined
      delete global.window;
      expect(() => removeAuthToken()).not.toThrow();
      global.window = originalWindow;
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no token', () => {
      expect(isAuthenticated()).toBe(false);
    });

    it('should return true when token exists', () => {
      setAuthToken('test-token');
      expect(isAuthenticated()).toBe(true);
    });

    it('should return false after token removal', () => {
      setAuthToken('test-token');
      removeAuthToken();
      expect(isAuthenticated()).toBe(false);
    });
  });
});
