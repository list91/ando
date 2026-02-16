import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React, { ReactNode } from 'react';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock Supabase client
const mockAuthStateChangeCallback = vi.hoisted(() => ({
  current: null as ((event: string, session: any) => void) | null,
}));

const mockSupabase = vi.hoisted(() => ({
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn((callback) => {
      mockAuthStateChangeCallback.current = callback;
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      };
    }),
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    signInWithOtp: vi.fn(),
    verifyOtp: vi.fn(),
  },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

// Mock window.location
const mockLocation = {
  origin: 'http://localhost:3000',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Test wrapper
const createWrapper = () => {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>;
  };
};

// Sample user and session
const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  user_metadata: { full_name: 'Test User' },
  ...overrides,
});

const createMockSession = (user = createMockUser()) => ({
  user,
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
});

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthStateChangeCallback.current = null;
    // Default: no session
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useAuth hook validation', () => {
    it('should throw error when used outside AuthProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('initial state', () => {
    it('should initialize with loading true', () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      // Initially loading is true
      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
    });

    it('should set loading to false after getSession resolves', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should load existing session on mount', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.session).toEqual(mockSession);
      });
    });

    it('should handle getSession error gracefully', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: new Error('Session fetch failed'),
      });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.user).toBeNull();
      });
    });
  });

  describe('onAuthStateChange listener', () => {
    it('should subscribe to auth state changes on mount', () => {
      renderHook(() => useAuth(), { wrapper: createWrapper() });

      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled();
    });

    it('should update state when auth state changes (sign in)', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);

      // Simulate auth state change
      act(() => {
        if (mockAuthStateChangeCallback.current) {
          mockAuthStateChangeCallback.current('SIGNED_IN', mockSession);
        }
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
    });

    it('should update state when auth state changes (sign out)', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      // Simulate sign out
      act(() => {
        if (mockAuthStateChangeCallback.current) {
          mockAuthStateChangeCallback.current('SIGNED_OUT', null);
        }
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
    });

    it('should unsubscribe from auth state changes on unmount', () => {
      const mockUnsubscribe = vi.fn();
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: {
          subscription: {
            unsubscribe: mockUnsubscribe,
          },
        },
      });

      const { unmount } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('signUp', () => {
    it('should call supabase signUp with correct parameters', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signUp('test@example.com', 'password123', 'Test User');
      });

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: 'http://localhost:3000/',
          data: {
            full_name: 'Test User',
          },
        },
      });
    });

    it('should return error from signUp', async () => {
      const mockError = new Error('Email already exists');
      mockSupabase.auth.signUp.mockResolvedValue({ error: mockError });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response: { error: any };
      await act(async () => {
        response = await result.current.signUp('test@example.com', 'pass', 'User');
      });

      expect(response!.error).toEqual(mockError);
    });

    it('should return null error on successful signUp', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response: { error: any };
      await act(async () => {
        response = await result.current.signUp('new@example.com', 'pass123', 'New User');
      });

      expect(response!.error).toBeNull();
    });
  });

  describe('signIn', () => {
    it('should call supabase signInWithPassword with correct parameters', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should return error on invalid credentials', async () => {
      const mockError = { message: 'Invalid login credentials' };
      mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: mockError });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response: { error: any };
      await act(async () => {
        response = await result.current.signIn('wrong@example.com', 'wrongpass');
      });

      expect(response!.error).toEqual(mockError);
    });

    it('should return null error on successful signIn', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response: { error: any };
      await act(async () => {
        response = await result.current.signIn('test@example.com', 'correct');
      });

      expect(response!.error).toBeNull();
    });
  });

  describe('signOut', () => {
    it('should call supabase signOut', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it('should handle signOut errors gracefully', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: new Error('Network error'),
      });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should not throw
      await act(async () => {
        await result.current.signOut();
      });

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('signUpWithEmail (OTP)', () => {
    it('should call supabase signInWithOtp with correct parameters', async () => {
      mockSupabase.auth.signInWithOtp.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signUpWithEmail('test@example.com', 'Test User');
      });

      expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        options: {
          data: {
            full_name: 'Test User',
          },
          emailRedirectTo: 'http://localhost:3000/',
        },
      });
    });

    it('should return error from signInWithOtp', async () => {
      const mockError = new Error('Rate limit exceeded');
      mockSupabase.auth.signInWithOtp.mockResolvedValue({ error: mockError });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response: { error: any };
      await act(async () => {
        response = await result.current.signUpWithEmail('test@example.com', 'User');
      });

      expect(response!.error).toEqual(mockError);
    });

    it('should return null error on successful OTP send', async () => {
      mockSupabase.auth.signInWithOtp.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response: { error: any };
      await act(async () => {
        response = await result.current.signUpWithEmail('test@example.com', 'User');
      });

      expect(response!.error).toBeNull();
    });
  });

  describe('verifyEmailCode', () => {
    it('should call supabase verifyOtp with correct parameters', async () => {
      mockSupabase.auth.verifyOtp.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.verifyEmailCode('test@example.com', '123456');
      });

      expect(mockSupabase.auth.verifyOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        token: '123456',
        type: 'email',
      });
    });

    it('should return error on invalid OTP', async () => {
      const mockError = { message: 'Token has expired or is invalid' };
      mockSupabase.auth.verifyOtp.mockResolvedValue({ error: mockError });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response: { error: any };
      await act(async () => {
        response = await result.current.verifyEmailCode('test@example.com', 'wrong');
      });

      expect(response!.error).toEqual(mockError);
    });

    it('should return null error on successful verification', async () => {
      mockSupabase.auth.verifyOtp.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response: { error: any };
      await act(async () => {
        response = await result.current.verifyEmailCode('test@example.com', '123456');
      });

      expect(response!.error).toBeNull();
    });
  });

  describe('session management', () => {
    it('should handle session refresh via onAuthStateChange', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newUser = createMockUser({ id: 'refreshed-user' });
      const newSession = createMockSession(newUser);

      act(() => {
        if (mockAuthStateChangeCallback.current) {
          mockAuthStateChangeCallback.current('TOKEN_REFRESHED', newSession);
        }
      });

      expect(result.current.user?.id).toBe('refreshed-user');
      expect(result.current.session).toEqual(newSession);
    });

    it('should handle USER_UPDATED event', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const updatedUser = createMockUser({
        user_metadata: { full_name: 'Updated Name' },
      });
      const updatedSession = createMockSession(updatedUser);

      act(() => {
        if (mockAuthStateChangeCallback.current) {
          mockAuthStateChangeCallback.current('USER_UPDATED', updatedSession);
        }
      });

      expect(result.current.user?.user_metadata.full_name).toBe('Updated Name');
    });

    it('should handle null session in auth state change', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.user).toBeDefined();
      });

      act(() => {
        if (mockAuthStateChangeCallback.current) {
          mockAuthStateChangeCallback.current('SIGNED_OUT', null);
        }
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle empty email in signIn', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        error: { message: 'Email is required' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response: { error: any };
      await act(async () => {
        response = await result.current.signIn('', 'password');
      });

      expect(response!.error).toBeDefined();
    });

    it('should handle empty password in signIn', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        error: { message: 'Password is required' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response: { error: any };
      await act(async () => {
        response = await result.current.signIn('test@example.com', '');
      });

      expect(response!.error).toBeDefined();
    });

    it('should handle special characters in password', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signIn('test@example.com', 'P@$$w0rd!#$%');
      });

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'P@$$w0rd!#$%',
      });
    });

    it('should handle unicode in full name', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signUp('test@example.com', 'pass', 'Иван Петров');
      });

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            data: { full_name: 'Иван Петров' },
          }),
        })
      );
    });

    it('should handle concurrent auth operations', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Fire multiple sign-in attempts concurrently
      await act(async () => {
        await Promise.all([
          result.current.signIn('test1@example.com', 'pass1'),
          result.current.signIn('test2@example.com', 'pass2'),
        ]);
      });

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledTimes(2);
    });
  });

  describe('context provider', () => {
    it('should provide all required context values', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('session');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('signUp');
      expect(result.current).toHaveProperty('signIn');
      expect(result.current).toHaveProperty('signOut');
      expect(result.current).toHaveProperty('signUpWithEmail');
      expect(result.current).toHaveProperty('verifyEmailCode');

      expect(typeof result.current.signUp).toBe('function');
      expect(typeof result.current.signIn).toBe('function');
      expect(typeof result.current.signOut).toBe('function');
      expect(typeof result.current.signUpWithEmail).toBe('function');
      expect(typeof result.current.verifyEmailCode).toBe('function');
    });
  });
});
