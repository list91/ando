import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Use vi.hoisted to ensure mockToast is available during vi.mock hoisting
const mockToast = vi.hoisted(() => Object.assign(vi.fn(), {
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: mockToast,
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from '@/integrations/supabase/client';
import {
  useHeroSlides,
  useCreateHeroSlide,
  useUpdateHeroSlide,
  useDeleteHeroSlide,
  type HeroSlide,
} from '../useHeroSlides';

// Mock data factory
const createMockSlide = (overrides: Partial<HeroSlide> = {}): HeroSlide => ({
  id: 'slide-1',
  title: 'Welcome',
  subtitle: 'Discover our collection',
  image_url: 'https://example.com/hero.jpg',
  image_url_tablet: 'https://example.com/hero-tablet.jpg',
  image_url_mobile: 'https://example.com/hero-mobile.jpg',
  display_order: 1,
  is_active: true,
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

describe('useHeroSlides hooks', () => {
  const mockSupabaseFrom = supabase.from as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // =====================================================
  // useHeroSlides
  // =====================================================
  describe('useHeroSlides', () => {
    it('should fetch slides successfully', async () => {
      const mockSlides = [
        createMockSlide(),
        createMockSlide({ id: 'slide-2', title: 'Summer Collection', display_order: 2 }),
      ];
      const builder = createMockQueryBuilder({ data: mockSlides, error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useHeroSlides(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockSlides);
      expect(mockSupabaseFrom).toHaveBeenCalledWith('hero_slides');
      expect(builder.select).toHaveBeenCalledWith('*');
      expect(builder.order).toHaveBeenCalledWith('display_order', { ascending: true });
    });

    it('should handle fetch error', async () => {
      const error = new Error('Database connection failed');
      const builder = createMockQueryBuilder({ data: null, error });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useHeroSlides(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBe(error);
    });

    it('should return empty array when no slides exist', async () => {
      const builder = createMockQueryBuilder({ data: [], error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useHeroSlides(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([]);
    });

    it('should have correct query key', async () => {
      const builder = createMockQueryBuilder({ data: [], error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper, queryClient } = createWrapper();
      renderHook(() => useHeroSlides(), { wrapper: Wrapper });

      await waitFor(() => {
        const queryState = queryClient.getQueryState(['hero-slides']);
        expect(queryState).toBeDefined();
      });
    });
  });

  // =====================================================
  // useCreateHeroSlide
  // =====================================================
  describe('useCreateHeroSlide', () => {
    const newSlideInput = {
      title: 'New Slide',
      subtitle: 'New subtitle',
      image_url: 'https://example.com/new.jpg',
      image_url_tablet: null,
      image_url_mobile: null,
      display_order: 3,
      is_active: true,
    };

    it('should create slide successfully', async () => {
      const createdSlide = createMockSlide({ ...newSlideInput, id: 'new-slide-id' });
      const builder = createMockQueryBuilder({ data: createdSlide, error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateHeroSlide(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync(newSlideInput);
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('hero_slides');
      expect(builder.insert).toHaveBeenCalledWith(newSlideInput);
      expect(builder.select).toHaveBeenCalled();
      expect(builder.single).toHaveBeenCalled();

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['hero-slides'] });
      expect(mockToast.success).toHaveBeenCalledWith('Слайд создан');
    });

    it('should handle creation error', async () => {
      const error = new Error('Insert failed');
      const builder = createMockQueryBuilder({ data: null, error });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useCreateHeroSlide(), { wrapper: Wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync(newSlideInput);
        } catch (e) {
          // Expected
        }
      });

      expect(mockToast.error).toHaveBeenCalledWith('Insert failed');
    });

    it('should create slide with minimal required fields', async () => {
      const minimalInput = {
        title: 'Minimal Slide',
        subtitle: null,
        image_url: 'https://example.com/min.jpg',
        image_url_tablet: null,
        image_url_mobile: null,
        display_order: 1,
        is_active: true,
      };
      const createdSlide = createMockSlide(minimalInput);
      const builder = createMockQueryBuilder({ data: createdSlide, error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useCreateHeroSlide(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync(minimalInput);
      });

      expect(builder.insert).toHaveBeenCalledWith(minimalInput);
    });
  });

  // =====================================================
  // useUpdateHeroSlide
  // =====================================================
  describe('useUpdateHeroSlide', () => {
    const updateInput = {
      id: 'slide-1',
      title: 'Updated Title',
      is_active: false,
    };

    it('should update slide successfully', async () => {
      const updatedSlide = createMockSlide({ ...updateInput });
      const builder = createMockQueryBuilder({ data: updatedSlide, error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateHeroSlide(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync(updateInput);
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('hero_slides');
      expect(builder.update).toHaveBeenCalledWith({
        title: 'Updated Title',
        is_active: false,
      });
      expect(builder.eq).toHaveBeenCalledWith('id', 'slide-1');
      expect(builder.select).toHaveBeenCalled();
      expect(builder.single).toHaveBeenCalled();

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['hero-slides'] });
      expect(mockToast.success).toHaveBeenCalledWith('Слайд обновлен');
    });

    it('should handle update error', async () => {
      const error = new Error('Slide not found');
      const builder = createMockQueryBuilder({ data: null, error });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useUpdateHeroSlide(), { wrapper: Wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync(updateInput);
        } catch (e) {
          // Expected
        }
      });

      expect(mockToast.error).toHaveBeenCalledWith('Slide not found');
    });

    it('should only send non-id fields in update payload', async () => {
      const builder = createMockQueryBuilder({ data: createMockSlide(), error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useUpdateHeroSlide(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync({ id: 'slide-1', display_order: 5 });
      });

      expect(builder.update).toHaveBeenCalledWith({ display_order: 5 });
    });

    it('should update responsive images', async () => {
      const builder = createMockQueryBuilder({ data: createMockSlide(), error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useUpdateHeroSlide(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: 'slide-1',
          image_url_tablet: 'https://example.com/tablet.jpg',
          image_url_mobile: 'https://example.com/mobile.jpg',
        });
      });

      expect(builder.update).toHaveBeenCalledWith({
        image_url_tablet: 'https://example.com/tablet.jpg',
        image_url_mobile: 'https://example.com/mobile.jpg',
      });
    });
  });

  // =====================================================
  // useDeleteHeroSlide
  // =====================================================
  describe('useDeleteHeroSlide', () => {
    it('should delete slide successfully', async () => {
      const builder = createMockQueryBuilder({ data: null, error: null });
      builder.eq.mockReturnValue(Promise.resolve({ error: null }));
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteHeroSlide(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync('slide-to-delete');
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('hero_slides');
      expect(builder.delete).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith('id', 'slide-to-delete');

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['hero-slides'] });
      expect(mockToast.success).toHaveBeenCalledWith('Слайд удален');
    });

    it('should handle delete error', async () => {
      const error = new Error('Cannot delete slide');
      const builder = createMockQueryBuilder({ data: null, error: null });
      builder.eq.mockReturnValue(Promise.resolve({ error }));
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteHeroSlide(), { wrapper: Wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync('slide-1');
        } catch (e) {
          // Expected
        }
      });

      expect(mockToast.error).toHaveBeenCalledWith('Cannot delete slide');
    });
  });

  // =====================================================
  // Cross-hook integration
  // =====================================================
  describe('Cross-hook integration', () => {
    it('should invalidate correct query keys on slide mutation', async () => {
      const builder = createMockQueryBuilder({ data: createMockSlide(), error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result: createResult } = renderHook(() => useCreateHeroSlide(), { wrapper: Wrapper });

      await act(async () => {
        await createResult.current.mutateAsync({
          title: 'Test',
          subtitle: null,
          image_url: 'https://example.com/test.jpg',
          image_url_tablet: null,
          image_url_mobile: null,
          display_order: 1,
          is_active: true,
        });
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['hero-slides'] });
    });
  });

  // =====================================================
  // Edge cases
  // =====================================================
  describe('Edge cases', () => {
    it('should handle null subtitle', async () => {
      const slideWithNullSubtitle = createMockSlide({ subtitle: null });
      const builder = createMockQueryBuilder({ data: [slideWithNullSubtitle], error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useHeroSlides(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0].subtitle).toBeNull();
    });

    it('should handle null responsive images', async () => {
      const slideWithoutResponsive = createMockSlide({
        image_url_tablet: null,
        image_url_mobile: null,
      });
      const builder = createMockQueryBuilder({ data: [slideWithoutResponsive], error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useHeroSlides(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0].image_url_tablet).toBeNull();
      expect(result.current.data?.[0].image_url_mobile).toBeNull();
    });

    it('should return mutation data', async () => {
      const createdSlide = createMockSlide({ id: 'returned-id' });
      const builder = createMockQueryBuilder({ data: createdSlide, error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useCreateHeroSlide(), { wrapper: Wrapper });

      let returnedData: unknown;
      await act(async () => {
        returnedData = await result.current.mutateAsync({
          title: 'Test',
          subtitle: null,
          image_url: 'https://example.com/test.jpg',
          image_url_tablet: null,
          image_url_mobile: null,
          display_order: 1,
          is_active: true,
        });
      });

      expect(returnedData).toEqual(createdSlide);
    });
  });

  // =====================================================
  // Type exports verification
  // =====================================================
  describe('Type exports', () => {
    it('should export HeroSlide interface correctly', () => {
      const slide: HeroSlide = createMockSlide();
      expect(slide.id).toBeDefined();
      expect(slide.title).toBeDefined();
      expect(slide.image_url).toBeDefined();
      expect(slide.display_order).toBeDefined();
      expect(slide.is_active).toBeDefined();
      expect(slide.created_at).toBeDefined();
      expect(slide.updated_at).toBeDefined();
    });

    it('should have nullable fields as nullable', () => {
      const minimalSlide: HeroSlide = {
        id: '1',
        title: 'Test',
        subtitle: null,
        image_url: 'https://example.com/img.jpg',
        image_url_tablet: null,
        image_url_mobile: null,
        display_order: 1,
        is_active: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      expect(minimalSlide.subtitle).toBeNull();
      expect(minimalSlide.image_url_tablet).toBeNull();
      expect(minimalSlide.image_url_mobile).toBeNull();
    });
  });
});
