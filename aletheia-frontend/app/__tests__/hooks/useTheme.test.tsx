/**
 * Unit tests for useTheme hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
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

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('useTheme', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should initialize with system theme by default', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    expect(result.current.themeMode).toBe('system');
  });

  it('should load theme from localStorage', async () => {
    localStorageMock.setItem('aletheia_theme_preference', 'dark');
    
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    // Wait for initialization and requestAnimationFrame to complete
    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });
    
    expect(result.current.themeMode).toBe('dark');
  });

  it('should change theme mode', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    act(() => {
      result.current.setThemeMode('light');
    });
    
    expect(result.current.themeMode).toBe('light');
    expect(localStorageMock.getItem('aletheia_theme_preference')).toBe('light');
  });

  it('should toggle theme', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    // Start with system
    expect(result.current.themeMode).toBe('system');
    
    // Toggle to light
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.themeMode).toBe('light');
    
    // Toggle to dark
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.themeMode).toBe('dark');
    
    // Toggle back to system
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.themeMode).toBe('system');
  });

  it('should determine actual theme for light mode', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    // Wait for initialization
    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });
    
    act(() => {
      result.current.setThemeMode('light');
    });
    
    // Wait for requestAnimationFrame to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });
    
    expect(result.current.actualTheme).toBe('light');
  });

  it('should determine actual theme for dark mode', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    // Wait for initialization
    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });
    
    act(() => {
      result.current.setThemeMode('dark');
    });
    
    // Wait for requestAnimationFrame to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });
    
    expect(result.current.actualTheme).toBe('dark');
  });

  it('should handle system theme changes with dark mode', async () => {
    // Mock matchMedia to return a MediaQueryList with dark mode
    const mockMediaQueryList = {
      matches: true, // Dark mode (line 48: mediaQuery.matches ? 'dark' : 'light')
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
        // Store handler for later use
        if (event === 'change') {
          mockMediaQueryList._handler = handler;
        }
      }),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
      _handler: null as ((e: MediaQueryListEvent) => void) | null,
    };

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(() => mockMediaQueryList),
    });

    const { result } = renderHook(() => useTheme(), { wrapper });
    
    // Wait for initialization
    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });
    
    // Set to system mode - should use dark when matches is true (line 48)
    act(() => {
      result.current.setThemeMode('system');
    });

    // Wait for requestAnimationFrame to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    expect(result.current.actualTheme).toBe('dark');
  });

  it('should handle system theme changes with light mode', () => {
    // Mock matchMedia to return a MediaQueryList with light mode
    const mockMediaQueryList = {
      matches: false, // Light mode (line 48: mediaQuery.matches ? 'dark' : 'light')
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
        if (event === 'change') {
          mockMediaQueryList._handler = handler;
        }
      }),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
      _handler: null as ((e: MediaQueryListEvent) => void) | null,
    };

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(() => mockMediaQueryList),
    });

    const { result } = renderHook(() => useTheme(), { wrapper });
    
    // Set to system mode - should use light when matches is false (line 48)
    act(() => {
      result.current.setThemeMode('system');
    });

    // Trigger the handleChange callback with light mode (line 52)
    act(() => {
      if (mockMediaQueryList._handler) {
        const event = { matches: false } as MediaQueryListEvent;
        mockMediaQueryList._handler(event);
      }
    });

    expect(result.current.actualTheme).toBe('light');
  });

  it('should throw error when used outside ThemeProvider', () => {
    // Test the error branch (line 97-98)
    expect(() => {
      renderHook(() => useTheme());
    }).toThrow('useTheme must be used within a ThemeProvider');
  });
});
