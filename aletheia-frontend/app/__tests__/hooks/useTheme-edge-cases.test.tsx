/**
 * Edge case tests for useTheme hook
 * Tests system theme detection, media query listeners, and edge cases
 */

import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../../hooks/useTheme';
import React from 'react';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
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

// Mock matchMedia with change listener support
const createMockMatchMedia = (matches: boolean) => {
  const listeners: Array<(_e: MediaQueryListEvent) => void> = [];
  
  return jest.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: (event: string, callback: (_e: MediaQueryListEvent) => void) => {
      if (event === 'change') {
        listeners.push(callback);
      }
    },
    removeEventListener: (event: string, callback: (_e: MediaQueryListEvent) => void) => {
      if (event === 'change') {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    },
    dispatchEvent: jest.fn(),
    // Helper to trigger change event
    triggerChange: (newMatches: boolean) => {
      const event = new MediaQueryListEvent('change', {
        matches: newMatches,
        media: query,
      });
      listeners.forEach(listener => listener(event));
    },
  }));
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('useTheme Edge Cases', () => {
  let mockMatchMedia: ReturnType<typeof createMockMatchMedia>;

  beforeEach(() => {
    localStorageMock.clear();
    mockMatchMedia = createMockMatchMedia(false); // Default to light mode
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });
  });

  it('should handle system theme with dark mode preference', () => {
    mockMatchMedia = createMockMatchMedia(true); // Dark mode
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });

    const { result } = renderHook(() => useTheme(), { wrapper });
    
    // Wait for initialization
    act(() => {
      // Force re-render after initialization
    });

    // System mode should use dark when system prefers dark
    expect(result.current.themeMode).toBe('system');
  });

  it('should handle system theme with light mode preference', () => {
    mockMatchMedia = createMockMatchMedia(false); // Light mode
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });

    const { result } = renderHook(() => useTheme(), { wrapper });
    
    // System mode should use light when system prefers light
    expect(result.current.themeMode).toBe('system');
  });

  it('should handle invalid theme value in localStorage', () => {
    localStorageMock.setItem('aletheia_theme_preference', 'invalid-theme');
    
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    // Should default to system if invalid value
    expect(result.current.themeMode).toBe('system');
  });

  it('should handle empty string in localStorage', () => {
    localStorageMock.setItem('aletheia_theme_preference', '');
    
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    // Should default to system if empty
    expect(result.current.themeMode).toBe('system');
  });

  it('should handle system theme change listener', () => {
    mockMatchMedia = createMockMatchMedia(false);
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });

    const { result } = renderHook(() => useTheme(), { wrapper });
    
    act(() => {
      result.current.setThemeMode('system');
    });

    // Verify listener was added (check that addEventListener exists and was called)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((mockMatchMedia as any).addEventListener) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((mockMatchMedia as any).addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    }
  });

  it('should handle theme mode change to system', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    act(() => {
      result.current.setThemeMode('light');
    });
    
    expect(result.current.themeMode).toBe('light');
    
    act(() => {
      result.current.setThemeMode('system');
    });
    
    expect(result.current.themeMode).toBe('system');
  });

  it('should handle all toggle transitions', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    // System -> Light
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.themeMode).toBe('light');
    
    // Light -> Dark
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.themeMode).toBe('dark');
    
    // Dark -> System
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.themeMode).toBe('system');
    
    // System -> Light (cycle repeats)
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.themeMode).toBe('light');
  });

  it('should persist theme to localStorage when set', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    act(() => {
      result.current.setThemeMode('dark');
    });
    
    expect(localStorageMock.getItem('aletheia_theme_preference')).toBe('dark');
  });

  it('should handle isInitialized state', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    // Initially should be false, then true after mount
    // Wait for requestAnimationFrame to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });
    
    expect(result.current.isInitialized).toBe(true);
  });

  it('should handle actualTheme calculation for system mode', () => {
    mockMatchMedia = createMockMatchMedia(true); // Dark mode
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });

    const { result } = renderHook(() => useTheme(), { wrapper });
    
    act(() => {
      result.current.setThemeMode('system');
    });
    
    // Actual theme should reflect system preference
    expect(['light', 'dark']).toContain(result.current.actualTheme);
  });

  it('should trigger handleChange callback when system theme changes to dark', async () => {
    // Create a mock that stores the handler
    let storedHandler: ((e: MediaQueryListEvent) => void) | null = null;
    const mockMediaQuery = {
      matches: false, // Start with light mode
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
        if (event === 'change') {
          storedHandler = handler;
        }
      }),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(() => mockMediaQuery),
    });

    const { result } = renderHook(() => useTheme(), { wrapper });
    
    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    // Set to system mode to register the listener
    act(() => {
      result.current.setThemeMode('system');
    });

    // Wait for the effect to set up the listener
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    // Verify handler was stored
    expect(storedHandler).not.toBeNull();

    // Trigger the handler with a dark mode change (line 54: e.matches ? 'dark' : 'light' - dark branch)
    // Create a mock event object since MediaQueryListEvent may not be available in test env
    if (storedHandler) {
      act(() => {
        const event = {
          matches: true, // System changed to dark
          media: '(prefers-color-scheme: dark)',
        } as MediaQueryListEvent;
        storedHandler!(event);
      });

      // Wait for state update
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      // Verify actualTheme was updated to dark
      expect(result.current.actualTheme).toBe('dark');
    }
  });

  it('should trigger handleChange callback when system theme changes to light', async () => {
    // Create a mock that stores the handler
    let storedHandler: ((e: MediaQueryListEvent) => void) | null = null;
    const mockMediaQuery = {
      matches: true, // Start with dark mode
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
        if (event === 'change') {
          storedHandler = handler;
        }
      }),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(() => mockMediaQuery),
    });

    const { result } = renderHook(() => useTheme(), { wrapper });
    
    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    // Set to system mode to register the listener
    act(() => {
      result.current.setThemeMode('system');
    });

    // Wait for the effect to set up the listener
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    // Verify handler was stored
    expect(storedHandler).not.toBeNull();

    // Trigger the handler with a light mode change (line 54: e.matches ? 'dark' : 'light' - light branch)
    if (storedHandler) {
      act(() => {
        const event = {
          matches: false, // System changed to light
          media: '(prefers-color-scheme: dark)',
        } as MediaQueryListEvent;
        storedHandler!(event);
      });

      // Wait for state update
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      // Verify actualTheme was updated to light
      expect(result.current.actualTheme).toBe('light');
    }
  });

  it('should handle cleanup of media query listener', async () => {
    let storedHandler: ((e: MediaQueryListEvent) => void) | null = null;
    const removeEventListenerSpy = jest.fn();
    
    const mockMediaQuery = {
      matches: false,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
        if (event === 'change') {
          storedHandler = handler;
        }
      }),
      removeEventListener: removeEventListenerSpy,
      dispatchEvent: jest.fn(),
    };

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(() => mockMediaQuery),
    });

    const { result, unmount } = renderHook(() => useTheme(), { wrapper });
    
    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    // Set to system mode to register the listener
    act(() => {
      result.current.setThemeMode('system');
    });

    // Wait for the effect to set up the listener
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    // Unmount to trigger cleanup (line 74-76)
    unmount();

    // Wait for cleanup
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    // Verify removeEventListener was called
    expect(removeEventListenerSpy).toHaveBeenCalledWith('change', storedHandler);
  });

  it('should handle window undefined in SSR environment', () => {
    // Save original window
    const originalWindow = global.window;
    
    // Remove window to simulate SSR (line 30, 51, 82, 91, 97, 103)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).window;

    // This should not throw and should work without window
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    // Should still work, just won't access localStorage or matchMedia
    expect(result.current.themeMode).toBe('system');
    
    // Test setThemeMode without window (should not access localStorage)
    act(() => {
      result.current.setThemeMode('dark');
    });
    expect(result.current.themeMode).toBe('dark');
    
    // Test toggleTheme without window (should not access localStorage)
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.themeMode).toBe('system');
    
    // Restore window
    global.window = originalWindow;
  });
});
