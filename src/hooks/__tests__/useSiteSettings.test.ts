import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Use vi.hoisted to create mocks that will be available in vi.mock factories
const { mockToast, chainableMock, mockGetUser, setMockResponse } = vi.hoisted(() => {
  const mockToast = Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  });

  const chainableMock = {
    _data: null as any,
    _error: null as any,
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    single: vi.fn(),
    then: vi.fn(),
  };

  // Setup chainable methods
  chainableMock.select.mockReturnValue(chainableMock);
  chainableMock.insert.mockReturnValue(chainableMock);
  chainableMock.update.mockReturnValue(chainableMock);
  chainableMock.delete.mockReturnValue(chainableMock);
  chainableMock.eq.mockReturnValue(chainableMock);
  chainableMock.order.mockReturnValue(chainableMock);
  chainableMock.single.mockImplementation(async () => ({
    data: chainableMock._data,
    error: chainableMock._error,
  }));
  chainableMock.then.mockImplementation((resolve: any) =>
    Promise.resolve({ data: chainableMock._data, error: chainableMock._error }).then(resolve)
  );

  const mockGetUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null });

  const setMockResponse = (data: any, error: any = null) => {
    chainableMock._data = data;
    chainableMock._error = error;
  };

  return { mockToast, chainableMock, mockGetUser, setMockResponse };
});

vi.mock('sonner', () => ({
  toast: mockToast,
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => chainableMock),
    auth: {
      getUser: mockGetUser,
    },
  },
}));

// Import supabase to get the mocked version
import { supabase } from '@/integrations/supabase/client';

// Now import the hooks (after mocks are set up)
import {
  useSiteSettings,
  useSiteSetting,
  useCreateSiteSetting,
  useUpdateSiteSetting,
  useDeleteSiteSetting,
  type SiteSetting,
} from '../useSiteSettings';

// Test query client factory
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

// Track invalidateQueries calls
const mockInvalidateQueries = vi.fn();

// Create wrapper with query client
const createWrapper = (queryClient?: QueryClient) => {
  const client = queryClient || createTestQueryClient();
  vi.spyOn(client, 'invalidateQueries').mockImplementation(mockInvalidateQueries);
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  };
};

// Test fixtures
const mockSiteSettings: SiteSetting[] = [
  {
    id: 'setting-1',
    key: 'site_name',
    value: 'Test Site',
    description: 'The site name',
    category: 'general',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'setting-2',
    key: 'theme_color',
    value: '#ff0000',
    description: 'Primary theme color',
    category: 'appearance',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
  {
    id: 'setting-3',
    key: 'logo_url',
    value: 'https://example.com/logo.png',
    category: 'appearance',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
  },
];

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
};

describe('useSiteSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToast.mockClear();
    mockInvalidateQueries.mockClear();
    chainableMock._data = null;
    chainableMock._error = null;

    // Reset chainable mock implementations
    chainableMock.select.mockReturnValue(chainableMock);
    chainableMock.insert.mockReturnValue(chainableMock);
    chainableMock.update.mockReturnValue(chainableMock);
    chainableMock.delete.mockReturnValue(chainableMock);
    chainableMock.eq.mockReturnValue(chainableMock);
    chainableMock.order.mockReturnValue(chainableMock);
    chainableMock.single.mockImplementation(async () => ({
      data: chainableMock._data,
      error: chainableMock._error,
    }));
    chainableMock.then.mockImplementation((resolve: any) =>
      Promise.resolve({ data: chainableMock._data, error: chainableMock._error }).then(resolve)
    );
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('useSiteSettings hook', () => {
    it('should fetch all site settings when no category provided', async () => {
      setMockResponse(mockSiteSettings);

      const { result } = renderHook(() => useSiteSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockSiteSettings);
      expect(supabase.from).toHaveBeenCalledWith('site_settings');
      expect(chainableMock.select).toHaveBeenCalledWith('*');
      expect(chainableMock.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should filter settings by category when provided', async () => {
      const appearanceSettings = mockSiteSettings.filter((s) => s.category === 'appearance');
      setMockResponse(appearanceSettings);

      const { result } = renderHook(() => useSiteSettings('appearance'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(appearanceSettings);
      expect(chainableMock.eq).toHaveBeenCalledWith('category', 'appearance');
    });

    it('should handle empty results', async () => {
      setMockResponse([]);

      const { result } = renderHook(() => useSiteSettings('nonexistent'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('should handle fetch error', async () => {
      const error = new Error('Database connection failed');
      setMockResponse(null, error);

      const { result } = renderHook(() => useSiteSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });

    it('should use correct query key with category', async () => {
      setMockResponse([]);

      const queryClient = createTestQueryClient();
      renderHook(() => useSiteSettings('general'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        const queryState = queryClient.getQueryState(['site-settings', 'general']);
        expect(queryState).toBeDefined();
      });
    });

    it('should use correct query key without category', async () => {
      setMockResponse([]);

      const queryClient = createTestQueryClient();
      renderHook(() => useSiteSettings(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        const queryState = queryClient.getQueryState(['site-settings', undefined]);
        expect(queryState).toBeDefined();
      });
    });
  });

  describe('useSiteSetting hook', () => {
    it('should fetch single setting by key', async () => {
      const singleSetting = mockSiteSettings[0];
      setMockResponse(singleSetting);

      const { result } = renderHook(() => useSiteSetting('site_name'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(singleSetting);
      expect(supabase.from).toHaveBeenCalledWith('site_settings');
      expect(chainableMock.eq).toHaveBeenCalledWith('key', 'site_name');
      expect(chainableMock.single).toHaveBeenCalled();
    });

    it('should be disabled when key is empty', async () => {
      const { result } = renderHook(() => useSiteSetting(''), {
        wrapper: createWrapper(),
      });

      // Query should not be fetching due to enabled: !!key
      expect(result.current.isFetching).toBe(false);
      expect(result.current.data).toBeUndefined();
    });

    it('should handle not found error', async () => {
      const error = { message: 'Row not found', code: 'PGRST116' };
      setMockResponse(null, error);

      const { result } = renderHook(() => useSiteSetting('nonexistent_key'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it('should use correct query key', async () => {
      setMockResponse(mockSiteSettings[0]);

      const queryClient = createTestQueryClient();
      renderHook(() => useSiteSetting('site_name'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        const queryState = queryClient.getQueryState(['site-setting', 'site_name']);
        expect(queryState).toBeDefined();
      });
    });
  });

  describe('useCreateSiteSetting hook', () => {
    const newSettingInput = {
      key: 'new_setting',
      value: 'new_value',
      category: 'general',
      description: 'A new setting',
    };

    const createdSetting: SiteSetting = {
      ...newSettingInput,
      id: 'new-setting-id',
      created_at: '2024-01-10T00:00:00Z',
      updated_at: '2024-01-10T00:00:00Z',
    };

    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it('should create setting successfully', async () => {
      setMockResponse(createdSetting);

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useCreateSiteSetting(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync(newSettingInput);
      });

      expect(supabase.from).toHaveBeenCalledWith('site_settings');
      expect(chainableMock.insert).toHaveBeenCalledWith({
        ...newSettingInput,
        updated_by: mockUser.id,
      });
      expect(chainableMock.select).toHaveBeenCalled();
      expect(chainableMock.single).toHaveBeenCalled();
    });

    it('should show success toast on create', async () => {
      setMockResponse(createdSetting);

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useCreateSiteSetting(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync(newSettingInput);
      });

      expect(mockToast.success).toHaveBeenCalledWith('Настройка создана');
    });

    it('should invalidate queries on success', async () => {
      setMockResponse(createdSetting);

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useCreateSiteSetting(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync(newSettingInput);
      });

      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['site-settings'] });
    });

    it('should show error toast on failure', async () => {
      const error = new Error('Duplicate key violation');
      setMockResponse(null, error);

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useCreateSiteSetting(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(newSettingInput);
        } catch {
          // Expected error
        }
      });

      expect(mockToast.error).toHaveBeenCalledWith('Duplicate key violation');
    });

    it('should handle user not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });
      setMockResponse(createdSetting);

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useCreateSiteSetting(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync(newSettingInput);
      });

      // Should still call insert but with undefined updated_by
      expect(chainableMock.insert).toHaveBeenCalledWith({
        ...newSettingInput,
        updated_by: undefined,
      });
    });
  });

  describe('useUpdateSiteSetting hook', () => {
    const updateInput = {
      id: 'setting-1',
      value: 'Updated Value',
      description: 'Updated description',
    };

    const updatedSetting: SiteSetting = {
      ...mockSiteSettings[0],
      value: 'Updated Value',
      description: 'Updated description',
      updated_at: '2024-01-15T00:00:00Z',
    };

    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it('should update setting successfully', async () => {
      setMockResponse(updatedSetting);

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useUpdateSiteSetting(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync(updateInput);
      });

      expect(supabase.from).toHaveBeenCalledWith('site_settings');
      expect(chainableMock.update).toHaveBeenCalledWith({
        value: 'Updated Value',
        description: 'Updated description',
        updated_by: mockUser.id,
      });
      expect(chainableMock.eq).toHaveBeenCalledWith('id', 'setting-1');
    });

    it('should show success toast on update', async () => {
      setMockResponse(updatedSetting);

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useUpdateSiteSetting(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync(updateInput);
      });

      expect(mockToast.success).toHaveBeenCalledWith('Настройка обновлена');
    });

    it('should invalidate queries on success', async () => {
      setMockResponse(updatedSetting);

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useUpdateSiteSetting(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync(updateInput);
      });

      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['site-settings'] });
    });

    it('should show error toast on failure', async () => {
      const error = new Error('Setting not found');
      setMockResponse(null, error);

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useUpdateSiteSetting(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(updateInput);
        } catch {
          // Expected error
        }
      });

      expect(mockToast.error).toHaveBeenCalledWith('Setting not found');
    });

    it('should handle partial update (only value)', async () => {
      setMockResponse(updatedSetting);

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useUpdateSiteSetting(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ id: 'setting-1', value: 'Only value changed' });
      });

      expect(chainableMock.update).toHaveBeenCalledWith({
        value: 'Only value changed',
        updated_by: mockUser.id,
      });
    });
  });

  describe('useDeleteSiteSetting hook', () => {
    it('should delete setting successfully', async () => {
      setMockResponse(null);

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useDeleteSiteSetting(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync('setting-1');
      });

      expect(supabase.from).toHaveBeenCalledWith('site_settings');
      expect(chainableMock.delete).toHaveBeenCalled();
      expect(chainableMock.eq).toHaveBeenCalledWith('id', 'setting-1');
    });

    it('should show success toast on delete', async () => {
      setMockResponse(null);

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useDeleteSiteSetting(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync('setting-1');
      });

      expect(mockToast.success).toHaveBeenCalledWith('Настройка удалена');
    });

    it('should invalidate queries on success', async () => {
      setMockResponse(null);

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useDeleteSiteSetting(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync('setting-1');
      });

      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['site-settings'] });
    });

    it('should show error toast on failure', async () => {
      const error = new Error('Cannot delete: setting in use');
      setMockResponse(null, error);

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useDeleteSiteSetting(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync('setting-1');
        } catch {
          // Expected error
        }
      });

      expect(mockToast.error).toHaveBeenCalledWith('Cannot delete: setting in use');
    });

    it('should handle non-existent setting deletion', async () => {
      const error = new Error('Setting not found');
      setMockResponse(null, error);

      const queryClient = createTestQueryClient();
      const { result } = renderHook(() => useDeleteSiteSetting(), {
        wrapper: createWrapper(queryClient),
      });

      let thrownError: Error | null = null;
      await act(async () => {
        try {
          await result.current.mutateAsync('non-existent-id');
        } catch (e) {
          thrownError = e as Error;
        }
      });

      expect(thrownError).toBeTruthy();
      expect(thrownError?.message).toBe('Setting not found');
    });
  });

  describe('Integration scenarios', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it('should handle create-then-fetch flow', async () => {
      const newSetting: SiteSetting = {
        id: 'new-id',
        key: 'new_key',
        value: 'new_value',
        category: 'general',
        created_at: '2024-01-10T00:00:00Z',
        updated_at: '2024-01-10T00:00:00Z',
      };

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);

      // First: create the setting
      setMockResponse(newSetting);
      const { result: createResult } = renderHook(() => useCreateSiteSetting(), { wrapper });

      await act(async () => {
        await createResult.current.mutateAsync({
          key: 'new_key',
          value: 'new_value',
          category: 'general',
        });
      });

      // Verify invalidation was called
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['site-settings'] });
    });

    it('should handle update-then-refetch flow', async () => {
      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);

      // First: setup initial data
      setMockResponse(mockSiteSettings);
      const { result: listResult } = renderHook(() => useSiteSettings(), { wrapper });

      await waitFor(() => {
        expect(listResult.current.isSuccess).toBe(true);
      });

      // Then: update a setting
      setMockResponse({ ...mockSiteSettings[0], value: 'updated' });
      const { result: updateResult } = renderHook(() => useUpdateSiteSetting(), { wrapper });

      await act(async () => {
        await updateResult.current.mutateAsync({ id: 'setting-1', value: 'updated' });
      });

      // Verify invalidation was called
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['site-settings'] });
    });

    it('should handle delete-then-refetch flow', async () => {
      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);

      // First: setup initial data
      setMockResponse(mockSiteSettings);
      const { result: listResult } = renderHook(() => useSiteSettings(), { wrapper });

      await waitFor(() => {
        expect(listResult.current.isSuccess).toBe(true);
      });

      // Then: delete a setting
      setMockResponse(null);
      const { result: deleteResult } = renderHook(() => useDeleteSiteSetting(), { wrapper });

      await act(async () => {
        await deleteResult.current.mutateAsync('setting-1');
      });

      // Verify invalidation was called
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['site-settings'] });
    });
  });

  describe('Edge cases', () => {
    it('should handle setting with null description', async () => {
      const settingWithNullDesc: SiteSetting = {
        ...mockSiteSettings[0],
        description: undefined,
      };
      setMockResponse(settingWithNullDesc);

      const { result } = renderHook(() => useSiteSetting('site_name'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.description).toBeUndefined();
    });

    it('should handle setting with complex value (object)', async () => {
      const complexSetting: SiteSetting = {
        ...mockSiteSettings[0],
        value: { nested: { data: [1, 2, 3] }, enabled: true },
      };
      setMockResponse(complexSetting);

      const { result } = renderHook(() => useSiteSetting('site_name'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.value).toEqual({ nested: { data: [1, 2, 3] }, enabled: true });
    });

    it('should handle setting with array value', async () => {
      const arraySetting: SiteSetting = {
        ...mockSiteSettings[0],
        value: ['item1', 'item2', 'item3'],
      };
      setMockResponse(arraySetting);

      const { result } = renderHook(() => useSiteSetting('site_name'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.value).toEqual(['item1', 'item2', 'item3']);
    });

    it('should handle network timeout gracefully', async () => {
      const timeoutError = new Error('Request timeout');
      setMockResponse(null, timeoutError);

      const { result } = renderHook(() => useSiteSettings(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Request timeout');
    });
  });
});
