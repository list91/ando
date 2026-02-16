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
  useAboutPage,
  useUpdateAboutSection,
  type AboutPageSection,
} from '../useAboutPage';

// Mock data factory
const createMockSection = (overrides: Partial<AboutPageSection> = {}): AboutPageSection => ({
  id: 'section-1',
  section_key: 'hero',
  title: 'О нас',
  content: 'Описание компании',
  image_url: 'https://example.com/image.jpg',
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
  update: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
};

const createMockQueryBuilder = (result: { data?: unknown; error?: Error | null }): MockQueryBuilder => {
  const builder: MockQueryBuilder = {
    select: vi.fn(),
    update: vi.fn(),
    order: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
  };

  builder.select.mockReturnValue(builder);
  builder.update.mockReturnValue(builder);
  builder.order.mockReturnValue(Promise.resolve(result));
  builder.eq.mockReturnValue(builder);
  builder.single.mockReturnValue(Promise.resolve(result));

  return builder;
};

describe('useAboutPage hooks', () => {
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
  // useAboutPage
  // =====================================================
  describe('useAboutPage', () => {
    it('should fetch visible sections successfully', async () => {
      const mockSections = [
        createMockSection(),
        createMockSection({ id: 'section-2', section_key: 'mission', display_order: 2 }),
      ];

      const builder: MockQueryBuilder = {
        select: vi.fn(),
        update: vi.fn(),
        order: vi.fn(),
        eq: vi.fn(),
        single: vi.fn(),
      };

      builder.select.mockReturnValue(builder);
      builder.eq.mockReturnValue(builder);
      builder.order.mockReturnValue(Promise.resolve({ data: mockSections, error: null }));

      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useAboutPage(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockSections);
      expect(mockSupabaseFrom).toHaveBeenCalledWith('about_page');
      expect(builder.select).toHaveBeenCalledWith('*');
      expect(builder.eq).toHaveBeenCalledWith('is_visible', true);
      expect(builder.order).toHaveBeenCalledWith('display_order');
    });

    it('should handle fetch error', async () => {
      const error = new Error('Database connection failed');

      const builder: MockQueryBuilder = {
        select: vi.fn(),
        update: vi.fn(),
        order: vi.fn(),
        eq: vi.fn(),
        single: vi.fn(),
      };

      builder.select.mockReturnValue(builder);
      builder.eq.mockReturnValue(builder);
      builder.order.mockReturnValue(Promise.resolve({ data: null, error }));

      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useAboutPage(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBe(error);
    });

    it('should return empty array when no sections exist', async () => {
      const builder: MockQueryBuilder = {
        select: vi.fn(),
        update: vi.fn(),
        order: vi.fn(),
        eq: vi.fn(),
        single: vi.fn(),
      };

      builder.select.mockReturnValue(builder);
      builder.eq.mockReturnValue(builder);
      builder.order.mockReturnValue(Promise.resolve({ data: [], error: null }));

      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useAboutPage(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([]);
    });

    it('should have correct query key', async () => {
      const builder: MockQueryBuilder = {
        select: vi.fn(),
        update: vi.fn(),
        order: vi.fn(),
        eq: vi.fn(),
        single: vi.fn(),
      };

      builder.select.mockReturnValue(builder);
      builder.eq.mockReturnValue(builder);
      builder.order.mockReturnValue(Promise.resolve({ data: [], error: null }));

      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper, queryClient } = createWrapper();
      renderHook(() => useAboutPage(), { wrapper: Wrapper });

      await waitFor(() => {
        const queryState = queryClient.getQueryState(['about-page']);
        expect(queryState).toBeDefined();
      });
    });

    it('should only fetch visible sections', async () => {
      const builder: MockQueryBuilder = {
        select: vi.fn(),
        update: vi.fn(),
        order: vi.fn(),
        eq: vi.fn(),
        single: vi.fn(),
      };

      builder.select.mockReturnValue(builder);
      builder.eq.mockReturnValue(builder);
      builder.order.mockReturnValue(Promise.resolve({ data: [], error: null }));

      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      renderHook(() => useAboutPage(), { wrapper: Wrapper });

      await waitFor(() => {
        expect(builder.eq).toHaveBeenCalledWith('is_visible', true);
      });
    });
  });

  // =====================================================
  // useUpdateAboutSection
  // =====================================================
  describe('useUpdateAboutSection', () => {
    const updateInput = {
      id: 'section-1',
      updates: {
        title: 'Updated Title',
        content: 'Updated content',
      },
    };

    it('should update section successfully', async () => {
      const updatedSection = createMockSection({
        title: updateInput.updates.title,
        content: updateInput.updates.content,
      });
      const builder = createMockQueryBuilder({ data: updatedSection, error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateAboutSection(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync(updateInput);
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('about_page');
      expect(builder.update).toHaveBeenCalledWith(updateInput.updates);
      expect(builder.eq).toHaveBeenCalledWith('id', updateInput.id);
      expect(builder.select).toHaveBeenCalled();
      expect(builder.single).toHaveBeenCalled();

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['about-page'] });
      expect(mockToastSuccess).toHaveBeenCalledWith('Изменения сохранены');
    });

    it('should handle update error', async () => {
      const error = new Error('Section not found');
      const builder = createMockQueryBuilder({ data: null, error });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useUpdateAboutSection(), { wrapper: Wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync(updateInput);
        } catch (e) {
          // Expected
        }
      });

      expect(mockToastError).toHaveBeenCalledWith('Ошибка при сохранении');
    });

    it('should log error to console on failure', async () => {
      const error = new Error('Database error');
      const builder = createMockQueryBuilder({ data: null, error });
      mockSupabaseFrom.mockReturnValue(builder);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useUpdateAboutSection(), { wrapper: Wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync(updateInput);
        } catch (e) {
          // Expected
        }
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error updating about section:', error);
      consoleSpy.mockRestore();
    });

    it('should update single field', async () => {
      const builder = createMockQueryBuilder({ data: createMockSection(), error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useUpdateAboutSection(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: 'section-1',
          updates: { title: 'New Title' },
        });
      });

      expect(builder.update).toHaveBeenCalledWith({ title: 'New Title' });
    });

    it('should update visibility', async () => {
      const builder = createMockQueryBuilder({ data: createMockSection({ is_visible: false }), error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useUpdateAboutSection(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: 'section-1',
          updates: { is_visible: false },
        });
      });

      expect(builder.update).toHaveBeenCalledWith({ is_visible: false });
    });

    it('should update image_url', async () => {
      const newImageUrl = 'https://example.com/new-image.jpg';
      const builder = createMockQueryBuilder({ data: createMockSection({ image_url: newImageUrl }), error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useUpdateAboutSection(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: 'section-1',
          updates: { image_url: newImageUrl },
        });
      });

      expect(builder.update).toHaveBeenCalledWith({ image_url: newImageUrl });
    });

    it('should return updated data from mutation', async () => {
      const updatedSection = createMockSection({ title: 'Returned Title' });
      const builder = createMockQueryBuilder({ data: updatedSection, error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useUpdateAboutSection(), { wrapper: Wrapper });

      let returnedData: unknown;
      await act(async () => {
        returnedData = await result.current.mutateAsync({
          id: 'section-1',
          updates: { title: 'Returned Title' },
        });
      });

      expect(returnedData).toEqual(updatedSection);
    });
  });

  // =====================================================
  // Edge cases
  // =====================================================
  describe('Edge cases', () => {
    it('should handle null content fields', async () => {
      const sectionWithNulls = createMockSection({
        title: null,
        content: null,
        image_url: null,
      });

      const builder: MockQueryBuilder = {
        select: vi.fn(),
        update: vi.fn(),
        order: vi.fn(),
        eq: vi.fn(),
        single: vi.fn(),
      };

      builder.select.mockReturnValue(builder);
      builder.eq.mockReturnValue(builder);
      builder.order.mockReturnValue(Promise.resolve({ data: [sectionWithNulls], error: null }));

      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useAboutPage(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0].title).toBeNull();
      expect(result.current.data?.[0].content).toBeNull();
      expect(result.current.data?.[0].image_url).toBeNull();
    });

    it('should handle concurrent update mutations', async () => {
      const builder = createMockQueryBuilder({ data: createMockSection(), error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useUpdateAboutSection(), { wrapper: Wrapper });

      await act(async () => {
        await Promise.all([
          result.current.mutateAsync({
            id: 'section-1',
            updates: { title: 'Title 1' },
          }),
          result.current.mutateAsync({
            id: 'section-2',
            updates: { title: 'Title 2' },
          }),
        ]);
      });

      expect(builder.update).toHaveBeenCalledTimes(2);
    });
  });

  // =====================================================
  // Type exports verification
  // =====================================================
  describe('Type exports', () => {
    it('should export AboutPageSection interface correctly', () => {
      const section: AboutPageSection = createMockSection();
      expect(section.id).toBeDefined();
      expect(section.section_key).toBeDefined();
      expect(section.display_order).toBeDefined();
      expect(section.is_visible).toBeDefined();
      expect(section.created_at).toBeDefined();
      expect(section.updated_at).toBeDefined();
    });

    it('should have nullable fields as nullable', () => {
      const minimalSection: AboutPageSection = {
        id: '1',
        section_key: 'test',
        title: null,
        content: null,
        image_url: null,
        display_order: 1,
        is_visible: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      expect(minimalSection.title).toBeNull();
      expect(minimalSection.content).toBeNull();
      expect(minimalSection.image_url).toBeNull();
    });
  });
});
