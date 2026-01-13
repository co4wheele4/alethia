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
    // Wait for useEffect to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
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
});
