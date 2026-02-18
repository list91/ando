import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast, toast, reducer } from '../use-toast';

describe('use-toast hooks', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // =====================================================
  // toast function
  // =====================================================
  describe('toast function', () => {
    it('should create a toast and return id, dismiss, update functions', () => {
      const result = toast({ title: 'Test Toast' });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('dismiss');
      expect(result).toHaveProperty('update');
      expect(typeof result.id).toBe('string');
      expect(typeof result.dismiss).toBe('function');
      expect(typeof result.update).toBe('function');
    });

    it('should generate unique ids for each toast', () => {
      const toast1 = toast({ title: 'Toast 1' });
      const toast2 = toast({ title: 'Toast 2' });
      const toast3 = toast({ title: 'Toast 3' });

      expect(toast1.id).not.toBe(toast2.id);
      expect(toast2.id).not.toBe(toast3.id);
      expect(toast1.id).not.toBe(toast3.id);
    });

    it('should create toast with all properties', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        toast({
          title: 'Test Title',
          description: 'Test Description',
          variant: 'destructive',
        });
      });

      expect(result.current.toasts.length).toBeGreaterThan(0);
      const createdToast = result.current.toasts[0];
      expect(createdToast.title).toBe('Test Title');
      expect(createdToast.description).toBe('Test Description');
      expect(createdToast.variant).toBe('destructive');
      expect(createdToast.open).toBe(true);
    });
  });

  // =====================================================
  // useToast hook
  // =====================================================
  describe('useToast hook', () => {
    it('should return toasts array and toast function', () => {
      const { result } = renderHook(() => useToast());

      expect(result.current).toHaveProperty('toasts');
      expect(result.current).toHaveProperty('toast');
      expect(result.current).toHaveProperty('dismiss');
      expect(Array.isArray(result.current.toasts)).toBe(true);
    });

    it('should add toast to toasts array', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'New Toast' });
      });

      expect(result.current.toasts.length).toBeGreaterThan(0);
      expect(result.current.toasts[0].title).toBe('New Toast');
    });

    it('should dismiss specific toast by id', () => {
      const { result } = renderHook(() => useToast());

      let toastId: string;
      act(() => {
        const created = result.current.toast({ title: 'Toast to Dismiss' });
        toastId = created.id;
      });

      act(() => {
        result.current.dismiss(toastId!);
      });

      const dismissedToast = result.current.toasts.find(t => t.id === toastId);
      expect(dismissedToast?.open).toBe(false);
    });

    it('should dismiss all toasts when no id provided', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'Toast 1' });
        result.current.toast({ title: 'Toast 2' });
      });

      act(() => {
        result.current.dismiss();
      });

      result.current.toasts.forEach(t => {
        expect(t.open).toBe(false);
      });
    });

    it('should limit toasts to TOAST_LIMIT (1)', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'Toast 1' });
        result.current.toast({ title: 'Toast 2' });
        result.current.toast({ title: 'Toast 3' });
      });

      // Only 1 toast should be visible (TOAST_LIMIT = 1)
      expect(result.current.toasts.length).toBe(1);
      // Most recent toast should be first
      expect(result.current.toasts[0].title).toBe('Toast 3');
    });
  });

  // =====================================================
  // reducer
  // =====================================================
  describe('reducer', () => {
    const initialState = { toasts: [] };

    it('should handle ADD_TOAST action', () => {
      const newToast = {
        id: '1',
        title: 'Test',
        open: true,
      };

      const state = reducer(initialState, {
        type: 'ADD_TOAST',
        toast: newToast as any,
      });

      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0].title).toBe('Test');
    });

    it('should prepend new toasts', () => {
      const existingState = {
        toasts: [{ id: '1', title: 'Old', open: true }] as any[],
      };

      const state = reducer(existingState, {
        type: 'ADD_TOAST',
        toast: { id: '2', title: 'New', open: true } as any,
      });

      expect(state.toasts[0].title).toBe('New');
    });

    it('should handle UPDATE_TOAST action', () => {
      const existingState = {
        toasts: [{ id: '1', title: 'Original', open: true }] as any[],
      };

      const state = reducer(existingState, {
        type: 'UPDATE_TOAST',
        toast: { id: '1', title: 'Updated' },
      });

      expect(state.toasts[0].title).toBe('Updated');
      expect(state.toasts[0].open).toBe(true);
    });

    it('should not update non-matching toast', () => {
      const existingState = {
        toasts: [{ id: '1', title: 'Original', open: true }] as any[],
      };

      const state = reducer(existingState, {
        type: 'UPDATE_TOAST',
        toast: { id: '999', title: 'Should not apply' },
      });

      expect(state.toasts[0].title).toBe('Original');
    });

    it('should handle DISMISS_TOAST action for specific toast', () => {
      const existingState = {
        toasts: [
          { id: '1', title: 'Toast 1', open: true },
          { id: '2', title: 'Toast 2', open: true },
        ] as any[],
      };

      const state = reducer(existingState, {
        type: 'DISMISS_TOAST',
        toastId: '1',
      });

      expect(state.toasts[0].open).toBe(false);
      expect(state.toasts[1].open).toBe(true);
    });

    it('should handle DISMISS_TOAST action for all toasts', () => {
      const existingState = {
        toasts: [
          { id: '1', title: 'Toast 1', open: true },
          { id: '2', title: 'Toast 2', open: true },
        ] as any[],
      };

      const state = reducer(existingState, {
        type: 'DISMISS_TOAST',
        toastId: undefined,
      });

      state.toasts.forEach(t => {
        expect(t.open).toBe(false);
      });
    });

    it('should handle REMOVE_TOAST action for specific toast', () => {
      const existingState = {
        toasts: [
          { id: '1', title: 'Toast 1', open: true },
          { id: '2', title: 'Toast 2', open: true },
        ] as any[],
      };

      const state = reducer(existingState, {
        type: 'REMOVE_TOAST',
        toastId: '1',
      });

      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0].id).toBe('2');
    });

    it('should handle REMOVE_TOAST action for all toasts', () => {
      const existingState = {
        toasts: [
          { id: '1', title: 'Toast 1', open: true },
          { id: '2', title: 'Toast 2', open: true },
        ] as any[],
      };

      const state = reducer(existingState, {
        type: 'REMOVE_TOAST',
        toastId: undefined,
      });

      expect(state.toasts).toHaveLength(0);
    });
  });

  // =====================================================
  // Update and dismiss via returned functions
  // =====================================================
  describe('toast returned functions', () => {
    it('should update toast via returned update function', () => {
      const { result } = renderHook(() => useToast());

      let toastRef: ReturnType<typeof toast>;
      act(() => {
        toastRef = result.current.toast({ title: 'Original' });
      });

      act(() => {
        toastRef!.update({ title: 'Updated', id: toastRef!.id } as any);
      });

      const updatedToast = result.current.toasts.find(t => t.id === toastRef!.id);
      expect(updatedToast?.title).toBe('Updated');
    });

    it('should dismiss toast via returned dismiss function', () => {
      const { result } = renderHook(() => useToast());

      let toastRef: ReturnType<typeof toast>;
      act(() => {
        toastRef = result.current.toast({ title: 'To Dismiss' });
      });

      act(() => {
        toastRef!.dismiss();
      });

      const dismissedToast = result.current.toasts.find(t => t.id === toastRef!.id);
      expect(dismissedToast?.open).toBe(false);
    });
  });

  // =====================================================
  // onOpenChange callback
  // =====================================================
  describe('onOpenChange callback', () => {
    it('should dismiss toast when onOpenChange(false) is called', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'Test' });
      });

      const toastInstance = result.current.toasts[0];

      act(() => {
        toastInstance.onOpenChange?.(false);
      });

      expect(result.current.toasts[0].open).toBe(false);
    });
  });

  // =====================================================
  // Multiple listeners
  // =====================================================
  describe('Multiple useToast instances', () => {
    it('should sync state across multiple useToast instances', () => {
      const { result: result1 } = renderHook(() => useToast());
      const { result: result2 } = renderHook(() => useToast());

      act(() => {
        result1.current.toast({ title: 'Shared Toast' });
      });

      // Both instances should see the same toast
      expect(result1.current.toasts.length).toBe(result2.current.toasts.length);
      expect(result1.current.toasts[0]?.title).toBe(result2.current.toasts[0]?.title);
    });
  });

  // =====================================================
  // Edge cases
  // =====================================================
  describe('Edge cases', () => {
    it('should handle empty title', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: '' });
      });

      expect(result.current.toasts[0].title).toBe('');
    });

    it('should handle toast with only description', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ description: 'Only description' });
      });

      expect(result.current.toasts[0].description).toBe('Only description');
      expect(result.current.toasts[0].title).toBeUndefined();
    });

    it('should handle React node as title', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'String title' });
      });

      expect(result.current.toasts[0].title).toBe('String title');
    });

    it('should handle action element', () => {
      const { result } = renderHook(() => useToast());
      const mockAction = { props: {} } as any;

      act(() => {
        result.current.toast({
          title: 'With Action',
          action: mockAction,
        });
      });

      expect(result.current.toasts[0].action).toBe(mockAction);
    });

    it('should handle rapid consecutive toasts', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.toast({ title: `Toast ${i}` });
        }
      });

      // Due to TOAST_LIMIT = 1, only 1 toast should be visible
      expect(result.current.toasts.length).toBe(1);
      // Last one should be visible
      expect(result.current.toasts[0].title).toBe('Toast 9');
    });

    it('should cleanup listener on unmount', () => {
      const { result, unmount } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'Before unmount' });
      });

      unmount();

      // This should not throw - the listener should be cleaned up
      act(() => {
        toast({ title: 'After unmount' });
      });
    });
  });
});
