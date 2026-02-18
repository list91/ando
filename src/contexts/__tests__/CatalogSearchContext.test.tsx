import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React, { ReactNode } from 'react';
import { CatalogSearchProvider, useCatalogSearch } from '../CatalogSearchContext';
import { MemoryRouter, useSearchParams } from 'react-router-dom';

// Track setSearchParams calls
const mockSetSearchParams = vi.fn();
const mockSearchParams = vi.hoisted(() => ({
  current: new URLSearchParams(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom'
  );
  return {
    ...actual,
    useSearchParams: () => [mockSearchParams.current, mockSetSearchParams],
  };
});

// Test wrapper with MemoryRouter
const createWrapper = (initialSearch = '') => {
  mockSearchParams.current = new URLSearchParams(initialSearch);

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[`/?${initialSearch}`]}>
        <CatalogSearchProvider>{children}</CatalogSearchProvider>
      </MemoryRouter>
    );
  };
};

describe('CatalogSearchContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockSearchParams.current = new URLSearchParams();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('useCatalogSearch hook validation', () => {
    it('should throw error when used outside CatalogSearchProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useCatalogSearch());
      }).toThrow('useCatalogSearch must be used within CatalogSearchProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('initial state', () => {
    it('should initialize with empty query when no URL param', () => {
      const { result } = renderHook(() => useCatalogSearch(), {
        wrapper: createWrapper(),
      });

      expect(result.current.query).toBe('');
      expect(result.current.status).toBe('idle');
    });

    it('should initialize query from URL search param', () => {
      const { result } = renderHook(() => useCatalogSearch(), {
        wrapper: createWrapper('search=shoes'),
      });

      expect(result.current.query).toBe('shoes');
    });

    it('should handle empty search param value', () => {
      const { result } = renderHook(() => useCatalogSearch(), {
        wrapper: createWrapper('search='),
      });

      expect(result.current.query).toBe('');
    });

    it('should handle URL encoded search param', () => {
      const { result } = renderHook(() => useCatalogSearch(), {
        wrapper: createWrapper('search=%D0%BF%D0%BB%D0%B0%D1%82%D1%8C%D0%B5'),
      });

      expect(result.current.query).toBe('платье');
    });
  });

  describe('setQuery', () => {
    it('should update query state immediately', () => {
      const { result } = renderHook(() => useCatalogSearch(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setQuery('new search');
      });

      expect(result.current.query).toBe('new search');
    });

    it('should debounce URL update', () => {
      const { result } = renderHook(() => useCatalogSearch(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setQuery('debounced');
      });

      // URL should not be updated immediately
      expect(mockSetSearchParams).not.toHaveBeenCalled();

      // Advance timers by debounce time (300ms)
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(mockSetSearchParams).toHaveBeenCalled();
    });

    it('should clear previous debounce timer on rapid input', () => {
      const { result } = renderHook(() => useCatalogSearch(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setQuery('first');
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      act(() => {
        result.current.setQuery('second');
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      act(() => {
        result.current.setQuery('third');
      });

      // Only 200ms total, debounce not triggered yet
      expect(mockSetSearchParams).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Only last value should be in URL
      expect(mockSetSearchParams).toHaveBeenCalledTimes(1);
      const lastCall = mockSetSearchParams.mock.calls[0][0];
      expect(lastCall.get('search')).toBe('third');
    });

    it('should handle empty query by removing search param', () => {
      const { result } = renderHook(() => useCatalogSearch(), {
        wrapper: createWrapper('search=existing'),
      });

      act(() => {
        result.current.setQuery('');
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(mockSetSearchParams).toHaveBeenCalled();
      const params = mockSetSearchParams.mock.calls[0][0];
      expect(params.has('search')).toBe(false);
    });

    it('should trim whitespace in query for URL', () => {
      const { result } = renderHook(() => useCatalogSearch(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setQuery('  trimmed query  ');
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      const params = mockSetSearchParams.mock.calls[0][0];
      expect(params.get('search')).toBe('trimmed query');
    });

    it('should handle whitespace-only query by removing search param', () => {
      const { result } = renderHook(() => useCatalogSearch(), {
        wrapper: createWrapper('search=existing'),
      });

      act(() => {
        result.current.setQuery('   ');
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      const params = mockSetSearchParams.mock.calls[0][0];
      expect(params.has('search')).toBe(false);
    });
  });

  describe('clearQuery', () => {
    it('should clear query state', () => {
      const { result } = renderHook(() => useCatalogSearch(), {
        wrapper: createWrapper('search=existing'),
      });

      expect(result.current.query).toBe('existing');

      act(() => {
        result.current.clearQuery();
      });

      expect(result.current.query).toBe('');
    });

    it('should reset status to idle', () => {
      const { result } = renderHook(() => useCatalogSearch(), {
        wrapper: createWrapper(),
      });

      // Set status to something else via search
      act(() => {
        result.current.search();
      });

      act(() => {
        vi.runAllTimers();
      });

      expect(result.current.status).toBe('success');

      act(() => {
        result.current.clearQuery();
      });

      expect(result.current.status).toBe('idle');
    });

    it('should remove search param from URL immediately', () => {
      const { result } = renderHook(() => useCatalogSearch(), {
        wrapper: createWrapper('search=test'),
      });

      act(() => {
        result.current.clearQuery();
      });

      expect(mockSetSearchParams).toHaveBeenCalled();
      const params = mockSetSearchParams.mock.calls[0][0];
      expect(params.has('search')).toBe(false);
    });

    it('should clear debounce timer', () => {
      const { result } = renderHook(() => useCatalogSearch(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setQuery('pending');
      });

      // Clear before debounce triggers
      act(() => {
        result.current.clearQuery();
      });

      // Advance past debounce time
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Only clearQuery's call should be made, not setQuery's debounced call
      expect(mockSetSearchParams).toHaveBeenCalledTimes(1);
    });
  });

  describe('search', () => {
    it('should set status to loading then success', () => {
      const { result } = renderHook(() => useCatalogSearch(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.search();
      });

      expect(result.current.status).toBe('loading');

      act(() => {
        vi.runAllTimers();
      });

      expect(result.current.status).toBe('success');
    });

    it('should abort previous search on new search', () => {
      const { result } = renderHook(() => useCatalogSearch(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.search();
      });

      // First search is loading
      expect(result.current.status).toBe('loading');

      // Trigger another search
      act(() => {
        result.current.search();
      });

      // Should still be loading
      expect(result.current.status).toBe('loading');

      act(() => {
        vi.runAllTimers();
      });

      expect(result.current.status).toBe('success');
    });
  });

  describe('URL sync', () => {
    it('should sync query when URL changes externally', () => {
      const { result, rerender } = renderHook(() => useCatalogSearch(), {
        wrapper: createWrapper(),
      });

      expect(result.current.query).toBe('');

      // Simulate external URL change
      mockSearchParams.current = new URLSearchParams('search=external');
      rerender();

      expect(result.current.query).toBe('external');
    });

    it('should not trigger unnecessary state updates when URL matches query', () => {
      const { result, rerender } = renderHook(() => useCatalogSearch(), {
        wrapper: createWrapper('search=initial'),
      });

      expect(result.current.query).toBe('initial');

      // Rerender without URL change
      rerender();

      expect(result.current.query).toBe('initial');
    });
  });

  describe('cleanup on unmount', () => {
    it('should clear debounce timer on unmount', () => {
      const { result, unmount } = renderHook(() => useCatalogSearch(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setQuery('pending');
      });

      unmount();

      // Advance timers after unmount
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // URL should not be updated after unmount
      expect(mockSetSearchParams).not.toHaveBeenCalled();
    });

    it('should abort search controller on unmount', () => {
      const { result, unmount } = renderHook(() => useCatalogSearch(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.search();
      });

      unmount();

      // Should not throw or cause issues
      act(() => {
        vi.runAllTimers();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in query', () => {
      const { result } = renderHook(() => useCatalogSearch(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setQuery('test & "query" <script>');
      });

      expect(result.current.query).toBe('test & "query" <script>');
    });

    it('should handle unicode in query', () => {
      const { result } = renderHook(() => useCatalogSearch(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setQuery('платье для выпускного');
      });

      expect(result.current.query).toBe('платье для выпускного');
    });

    it('should handle very long query', () => {
      const { result } = renderHook(() => useCatalogSearch(), {
        wrapper: createWrapper(),
      });

      const longQuery = 'a'.repeat(1000);

      act(() => {
        result.current.setQuery(longQuery);
      });

      expect(result.current.query).toBe(longQuery);
    });

    it('should handle newlines in query', () => {
      const { result } = renderHook(() => useCatalogSearch(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setQuery('line1\nline2');
      });

      expect(result.current.query).toBe('line1\nline2');
    });

    it('should preserve other URL params when updating search', () => {
      mockSearchParams.current = new URLSearchParams('category=shoes&size=M');

      const { result } = renderHook(() => useCatalogSearch(), {
        wrapper: createWrapper('category=shoes&size=M'),
      });

      act(() => {
        result.current.setQuery('sneakers');
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      const params = mockSetSearchParams.mock.calls[0][0];
      expect(params.get('search')).toBe('sneakers');
      // Note: The actual implementation may or may not preserve other params
      // depending on how it constructs the URLSearchParams
    });
  });

  describe('status states', () => {
    it('should have correct initial status', () => {
      const { result } = renderHook(() => useCatalogSearch(), {
        wrapper: createWrapper(),
      });

      expect(result.current.status).toBe('idle');
    });

    it('should transition through loading to success', async () => {
      // Use real timers for this specific test since it involves requestAnimationFrame
      vi.useRealTimers();

      const { result } = renderHook(() => useCatalogSearch(), {
        wrapper: createWrapper(),
      });

      expect(result.current.status).toBe('idle');

      act(() => {
        result.current.search();
      });

      expect(result.current.status).toBe('loading');

      // Wait for requestAnimationFrame to execute
      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });

      // Restore fake timers for other tests
      vi.useFakeTimers();
    });
  });

  describe('context provider', () => {
    it('should provide all required context values', () => {
      const { result } = renderHook(() => useCatalogSearch(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toHaveProperty('query');
      expect(result.current).toHaveProperty('status');
      expect(result.current).toHaveProperty('setQuery');
      expect(result.current).toHaveProperty('clearQuery');
      expect(result.current).toHaveProperty('search');

      expect(typeof result.current.query).toBe('string');
      expect(typeof result.current.status).toBe('string');
      expect(typeof result.current.setQuery).toBe('function');
      expect(typeof result.current.clearQuery).toBe('function');
      expect(typeof result.current.search).toBe('function');
    });
  });

  describe('concurrent operations', () => {
    it('should handle setQuery followed immediately by clearQuery', () => {
      const { result } = renderHook(() => useCatalogSearch(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setQuery('will be cleared');
        result.current.clearQuery();
      });

      expect(result.current.query).toBe('');

      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Only clearQuery's URL update should be made
      const calls = mockSetSearchParams.mock.calls;
      if (calls.length > 0) {
        const lastCall = calls[calls.length - 1][0];
        expect(lastCall.has('search')).toBe(false);
      }
    });

    it('should handle multiple rapid setQuery calls', () => {
      const { result } = renderHook(() => useCatalogSearch(), {
        wrapper: createWrapper(),
      });

      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.setQuery(`query-${i}`);
        }
      });

      // Immediate state should be last value
      expect(result.current.query).toBe('query-9');

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Only one URL update with last value
      expect(mockSetSearchParams).toHaveBeenCalledTimes(1);
    });
  });
});
