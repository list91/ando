import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock modules before imports
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  useInfoPages,
  useInfoPage,
  useCreateInfoPage,
  useUpdateInfoPage,
  useDeleteInfoPage,
  type InfoPage,
} from '../useInfoPages';

// Mock data factory
const createMockPage = (overrides: Partial<InfoPage> = {}): InfoPage => ({
  id: 'page-1',
  page_key: 'delivery',
  title: 'Доставка',
  content: 'Информация о доставке',
  image_url: 'https://example.com/delivery.jpg',
  display_order: 1,
  is_visible: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
  ...overrides,
});

// Test wrapper factory
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  return { Wrapper, queryClient };
};

// Supabase mock builder
type MockQueryBuilder = {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
};

const createMockQueryBuilder = (result: { data?: unknown; error?: Error | null }): MockQueryBuilder => {
  const builder: MockQueryBuilder = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    order: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
  };

  builder.select.mockReturnValue(builder);
  builder.insert.mockReturnValue(builder);
  builder.update.mockReturnValue(builder);
  builder.delete.mockReturnValue(builder);
  builder.order.mockReturnValue(Promise.resolve(result));
  builder.eq.mockReturnValue(builder);
  builder.single.mockReturnValue(Promise.resolve(result));

  return builder;
};

describe('useInfoPages hooks', () => {
  const mockSupabaseFrom = supabase.from as ReturnType<typeof vi.fn>;
  const mockToastSuccess = toast.success as ReturnType<typeof vi.fn>;
  const mockToastError = toast.error as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // =====================================================
  // useInfoPages
  // =====================================================
  describe('useInfoPages', () => {
    it('should fetch all pages successfully', async () => {
      const mockPages = [
        createMockPage(),
        createMockPage({ id: 'page-2', page_key: 'returns', title: 'Возвраты', display_order: 2 }),
      ];
      const builder = createMockQueryBuilder({ data: mockPages, error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useInfoPages(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockPages);
      expect(mockSupabaseFrom).toHaveBeenCalledWith('info_pages');
      expect(builder.select).toHaveBeenCalledWith('*');
      expect(builder.order).toHaveBeenCalledWith('display_order', { ascending: true });
    });

    it('should handle fetch error', async () => {
      const error = new Error('Database connection failed');
      const builder = createMockQueryBuilder({ data: null, error });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useInfoPages(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBe(error);
    });

    it('should return empty array when no pages exist', async () => {
      const builder = createMockQueryBuilder({ data: [], error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useInfoPages(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([]);
    });

    it('should have correct query key', async () => {
      const builder = createMockQueryBuilder({ data: [], error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper, queryClient } = createWrapper();
      renderHook(() => useInfoPages(), { wrapper: Wrapper });

      await waitFor(() => {
        const queryState = queryClient.getQueryState(['info-pages']);
        expect(queryState).toBeDefined();
      });
    });
  });

  // =====================================================
  // useInfoPage
  // =====================================================
  describe('useInfoPage', () => {
    it('should fetch single page by key', async () => {
      const mockPage = createMockPage({ page_key: 'delivery' });

      const builder: MockQueryBuilder = {
        select: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        order: vi.fn(),
        eq: vi.fn(),
        single: vi.fn(),
      };

      builder.select.mockReturnValue(builder);
      builder.eq.mockReturnValue(builder);
      builder.single.mockReturnValue(Promise.resolve({ data: mockPage, error: null }));

      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useInfoPage('delivery'), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockPage);
      expect(mockSupabaseFrom).toHaveBeenCalledWith('info_pages');
      expect(builder.select).toHaveBeenCalledWith('*');
      expect(builder.eq).toHaveBeenCalledWith('page_key', 'delivery');
      expect(builder.single).toHaveBeenCalled();
    });

    it('should handle fetch error for single page', async () => {
      const error = new Error('Page not found');

      const builder: MockQueryBuilder = {
        select: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        order: vi.fn(),
        eq: vi.fn(),
        single: vi.fn(),
      };

      builder.select.mockReturnValue(builder);
      builder.eq.mockReturnValue(builder);
      builder.single.mockReturnValue(Promise.resolve({ data: null, error }));

      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useInfoPage('nonexistent'), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBe(error);
    });

    it('should not fetch when pageKey is empty', async () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useInfoPage(''), { wrapper: Wrapper });

      // Query should not be enabled
      expect(result.current.fetchStatus).toBe('idle');
      expect(mockSupabaseFrom).not.toHaveBeenCalled();
    });

    it('should have correct query key with pageKey', async () => {
      const builder: MockQueryBuilder = {
        select: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        order: vi.fn(),
        eq: vi.fn(),
        single: vi.fn(),
      };

      builder.select.mockReturnValue(builder);
      builder.eq.mockReturnValue(builder);
      builder.single.mockReturnValue(Promise.resolve({ data: createMockPage(), error: null }));

      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper, queryClient } = createWrapper();
      renderHook(() => useInfoPage('delivery'), { wrapper: Wrapper });

      await waitFor(() => {
        const queryState = queryClient.getQueryState(['info-page', 'delivery']);
        expect(queryState).toBeDefined();
      });
    });
  });

  // =====================================================
  // useCreateInfoPage
  // =====================================================
  describe('useCreateInfoPage', () => {
    const newPageInput = {
      page_key: 'payment',
      title: 'Оплата',
      content: 'Информация об оплате',
      display_order: 3,
      is_visible: true,
    };

    it('should create page successfully', async () => {
      const createdPage = createMockPage({ ...newPageInput, id: 'new-page-id' });
      const builder = createMockQueryBuilder({ data: createdPage, error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateInfoPage(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync(newPageInput);
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('info_pages');
      expect(builder.insert).toHaveBeenCalledWith(newPageInput);
      expect(builder.select).toHaveBeenCalled();
      expect(builder.single).toHaveBeenCalled();

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['info-pages'] });
      expect(mockToastSuccess).toHaveBeenCalledWith('Страница создана');
    });

    it('should handle creation error', async () => {
      const error = new Error('Duplicate page_key');
      const builder = createMockQueryBuilder({ data: null, error });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useCreateInfoPage(), { wrapper: Wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync(newPageInput);
        } catch (e) {
          // Expected
        }
      });

      expect(mockToastError).toHaveBeenCalledWith('Duplicate page_key');
    });

    it('should create page with optional image_url', async () => {
      const inputWithImage = {
        ...newPageInput,
        image_url: 'https://example.com/payment.jpg',
      };
      const createdPage = createMockPage(inputWithImage);
      const builder = createMockQueryBuilder({ data: createdPage, error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useCreateInfoPage(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync(inputWithImage);
      });

      expect(builder.insert).toHaveBeenCalledWith(inputWithImage);
    });
  });

  // =====================================================
  // useUpdateInfoPage
  // =====================================================
  describe('useUpdateInfoPage', () => {
    const updateInput = {
      id: 'page-1',
      title: 'Updated Title',
      content: 'Updated content',
    };

    it('should update page successfully', async () => {
      const updatedPage = createMockPage({ ...updateInput });
      const builder = createMockQueryBuilder({ data: updatedPage, error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateInfoPage(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync(updateInput);
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('info_pages');
      expect(builder.update).toHaveBeenCalledWith({
        title: 'Updated Title',
        content: 'Updated content',
      });
      expect(builder.eq).toHaveBeenCalledWith('id', 'page-1');
      expect(builder.select).toHaveBeenCalled();
      expect(builder.single).toHaveBeenCalled();

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['info-pages'] });
      expect(mockToastSuccess).toHaveBeenCalledWith('Страница обновлена');
    });

    it('should handle update error', async () => {
      const error = new Error('Page not found');
      const builder = createMockQueryBuilder({ data: null, error });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useUpdateInfoPage(), { wrapper: Wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync(updateInput);
        } catch (e) {
          // Expected
        }
      });

      expect(mockToastError).toHaveBeenCalledWith('Page not found');
    });

    it('should only send non-id fields in update payload', async () => {
      const builder = createMockQueryBuilder({ data: createMockPage(), error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useUpdateInfoPage(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync({ id: 'page-1', display_order: 5 });
      });

      expect(builder.update).toHaveBeenCalledWith({ display_order: 5 });
    });

    it('should update visibility', async () => {
      const builder = createMockQueryBuilder({ data: createMockPage({ is_visible: false }), error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useUpdateInfoPage(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync({ id: 'page-1', is_visible: false });
      });

      expect(builder.update).toHaveBeenCalledWith({ is_visible: false });
    });
  });

  // =====================================================
  // useDeleteInfoPage
  // =====================================================
  describe('useDeleteInfoPage', () => {
    it('should delete page successfully', async () => {
      const builder = createMockQueryBuilder({ data: null, error: null });
      builder.eq.mockReturnValue(Promise.resolve({ error: null }));
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteInfoPage(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync('page-to-delete');
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('info_pages');
      expect(builder.delete).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith('id', 'page-to-delete');

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['info-pages'] });
      expect(mockToastSuccess).toHaveBeenCalledWith('Страница удалена');
    });

    it('should handle delete error', async () => {
      const error = new Error('Cannot delete page');
      const builder = createMockQueryBuilder({ data: null, error: null });
      builder.eq.mockReturnValue(Promise.resolve({ error }));
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteInfoPage(), { wrapper: Wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync('page-1');
        } catch (e) {
          // Expected
        }
      });

      expect(mockToastError).toHaveBeenCalledWith('Cannot delete page');
    });
  });

  // =====================================================
  // Cross-hook integration
  // =====================================================
  describe('Cross-hook integration', () => {
    it('should invalidate correct query keys on page mutation', async () => {
      const builder = createMockQueryBuilder({ data: createMockPage(), error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result: createResult } = renderHook(() => useCreateInfoPage(), { wrapper: Wrapper });
      const { result: updateResult } = renderHook(() => useUpdateInfoPage(), { wrapper: Wrapper });

      await act(async () => {
        await createResult.current.mutateAsync({
          page_key: 'test',
          title: 'Test',
          content: 'Test content',
          display_order: 1,
          is_visible: true,
        });
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['info-pages'] });

      await act(async () => {
        await updateResult.current.mutateAsync({ id: 'page-1', title: 'Updated' });
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['info-pages'] });
    });
  });

  // =====================================================
  // Edge cases
  // =====================================================
  describe('Edge cases', () => {
    it('should handle null image_url', async () => {
      const pageWithNullImage = createMockPage({ image_url: null });
      const builder = createMockQueryBuilder({ data: [pageWithNullImage], error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useInfoPages(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0].image_url).toBeNull();
    });

    it('should return mutation data', async () => {
      const createdPage = createMockPage({ id: 'returned-id' });
      const builder = createMockQueryBuilder({ data: createdPage, error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useCreateInfoPage(), { wrapper: Wrapper });

      let returnedData: unknown;
      await act(async () => {
        returnedData = await result.current.mutateAsync({
          page_key: 'test',
          title: 'Test',
          content: 'Test content',
          display_order: 1,
          is_visible: true,
        });
      });

      expect(returnedData).toEqual(createdPage);
    });

    it('should handle concurrent mutations', async () => {
      const builder = createMockQueryBuilder({ data: createMockPage(), error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useCreateInfoPage(), { wrapper: Wrapper });

      await act(async () => {
        await Promise.all([
          result.current.mutateAsync({
            page_key: 'page-1',
            title: 'Page 1',
            content: 'Content 1',
            display_order: 1,
            is_visible: true,
          }),
          result.current.mutateAsync({
            page_key: 'page-2',
            title: 'Page 2',
            content: 'Content 2',
            display_order: 2,
            is_visible: true,
          }),
        ]);
      });

      expect(builder.insert).toHaveBeenCalledTimes(2);
    });
  });

  // =====================================================
  // Type exports verification
  // =====================================================
  describe('Type exports', () => {
    it('should export InfoPage interface correctly', () => {
      const page: InfoPage = createMockPage();
      expect(page.id).toBeDefined();
      expect(page.page_key).toBeDefined();
      expect(page.title).toBeDefined();
      expect(page.content).toBeDefined();
      expect(page.display_order).toBeDefined();
      expect(page.is_visible).toBeDefined();
      expect(page.created_at).toBeDefined();
      expect(page.updated_at).toBeDefined();
    });

    it('should have optional image_url as optional', () => {
      const minimalPage: InfoPage = {
        id: '1',
        page_key: 'test',
        title: 'Test',
        content: 'Content',
        display_order: 1,
        is_visible: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      expect(minimalPage.image_url).toBeUndefined();
    });
  });
});
