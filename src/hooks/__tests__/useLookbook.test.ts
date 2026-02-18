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
  useLookbookSeasons,
  useLookbookImages,
  useCreateLookbookSeason,
  useUpdateLookbookSeason,
  useDeleteLookbookSeason,
  useCreateLookbookImage,
  useUpdateLookbookImage,
  useDeleteLookbookImage,
  type LookbookSeason,
  type LookbookImage,
} from '../useLookbook';

// Mock data factories
const createMockSeason = (overrides: Partial<LookbookSeason> = {}): LookbookSeason => ({
  id: 'season-1',
  season_name: 'Spring 2024',
  slug: 'spring-2024',
  short_description: 'Spring collection',
  cover_image_url: 'https://example.com/cover.jpg',
  title: 'Spring Collection',
  subtitle: 'New arrivals',
  description: 'Full description',
  display_order: 1,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
  ...overrides,
});

const createMockImage = (overrides: Partial<LookbookImage> = {}): LookbookImage => ({
  id: 'image-1',
  season_id: 'season-1',
  image_url: 'https://example.com/image.jpg',
  caption: 'Beautiful shot',
  alt_text: 'Model wearing spring outfit',
  display_order: 1,
  is_visible: true,
  photographer_credit: 'John Doe',
  created_at: '2024-01-01T00:00:00Z',
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

  // Chain methods return builder or result
  builder.select.mockReturnValue(builder);
  builder.insert.mockReturnValue(builder);
  builder.update.mockReturnValue(builder);
  builder.delete.mockReturnValue(builder);
  builder.order.mockReturnValue(Promise.resolve(result));
  builder.eq.mockReturnValue(builder);
  builder.single.mockReturnValue(Promise.resolve(result));

  return builder;
};

describe('useLookbook hooks', () => {
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
  // useLookbookSeasons
  // =====================================================
  describe('useLookbookSeasons', () => {
    it('should fetch seasons successfully', async () => {
      const mockSeasons = [createMockSeason(), createMockSeason({ id: 'season-2', season_name: 'Fall 2024' })];
      const builder = createMockQueryBuilder({ data: mockSeasons, error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useLookbookSeasons(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockSeasons);
      expect(mockSupabaseFrom).toHaveBeenCalledWith('lookbook_seasons');
      expect(builder.select).toHaveBeenCalledWith('*');
      expect(builder.order).toHaveBeenCalledWith('display_order', { ascending: true });
    });

    it('should handle fetch error', async () => {
      const error = new Error('Database connection failed');
      const builder = createMockQueryBuilder({ data: null, error });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useLookbookSeasons(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBe(error);
    });

    it('should return empty array when no seasons exist', async () => {
      const builder = createMockQueryBuilder({ data: [], error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useLookbookSeasons(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([]);
    });

    it('should have correct query key', async () => {
      const builder = createMockQueryBuilder({ data: [], error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper, queryClient } = createWrapper();
      renderHook(() => useLookbookSeasons(), { wrapper: Wrapper });

      await waitFor(() => {
        const queryState = queryClient.getQueryState(['lookbook-seasons']);
        expect(queryState).toBeDefined();
      });
    });
  });

  // =====================================================
  // useLookbookImages
  // =====================================================
  describe('useLookbookImages', () => {
    it('should fetch all images when no seasonId provided', async () => {
      const mockImages = [createMockImage(), createMockImage({ id: 'image-2' })];
      const builder = createMockQueryBuilder({ data: mockImages, error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useLookbookImages(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockImages);
      expect(mockSupabaseFrom).toHaveBeenCalledWith('lookbook_images');
      expect(builder.select).toHaveBeenCalledWith('*');
      expect(builder.order).toHaveBeenCalledWith('display_order', { ascending: true });
      // eq should NOT be called when no seasonId
      expect(builder.eq).not.toHaveBeenCalled();
    });

    it('should filter images by seasonId when provided', async () => {
      const seasonId = 'season-123';
      const mockImages = [createMockImage({ season_id: seasonId })];

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
      builder.order.mockReturnValue(builder);
      builder.eq.mockReturnValue(Promise.resolve({ data: mockImages, error: null }));

      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useLookbookImages(seasonId), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockImages);
      expect(builder.eq).toHaveBeenCalledWith('season_id', seasonId);
    });

    it('should handle fetch error', async () => {
      const error = new Error('Failed to fetch images');
      const builder = createMockQueryBuilder({ data: null, error });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useLookbookImages(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBe(error);
    });

    it('should have correct query key with seasonId', async () => {
      const seasonId = 'test-season';
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
      builder.order.mockReturnValue(builder);
      builder.eq.mockReturnValue(Promise.resolve({ data: [], error: null }));

      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper, queryClient } = createWrapper();
      renderHook(() => useLookbookImages(seasonId), { wrapper: Wrapper });

      await waitFor(() => {
        const queryState = queryClient.getQueryState(['lookbook-images', seasonId]);
        expect(queryState).toBeDefined();
      });
    });

    it('should have correct query key without seasonId', async () => {
      const builder = createMockQueryBuilder({ data: [], error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper, queryClient } = createWrapper();
      renderHook(() => useLookbookImages(undefined), { wrapper: Wrapper });

      await waitFor(() => {
        const queryState = queryClient.getQueryState(['lookbook-images', undefined]);
        expect(queryState).toBeDefined();
      });
    });
  });

  // =====================================================
  // useCreateLookbookSeason
  // =====================================================
  describe('useCreateLookbookSeason', () => {
    const newSeasonInput = {
      season_name: 'Winter 2024',
      slug: 'winter-2024',
      display_order: 3,
      is_active: true,
    };

    it('should create season successfully', async () => {
      const createdSeason = createMockSeason({ ...newSeasonInput, id: 'new-season-id' });
      const builder = createMockQueryBuilder({ data: createdSeason, error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateLookbookSeason(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync(newSeasonInput);
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('lookbook_seasons');
      expect(builder.insert).toHaveBeenCalledWith(newSeasonInput);
      expect(builder.select).toHaveBeenCalled();
      expect(builder.single).toHaveBeenCalled();

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['lookbook-seasons'] });
      expect(mockToastSuccess).toHaveBeenCalledWith('Сезон создан');
    });

    it('should handle creation error', async () => {
      const error = new Error('Duplicate slug');
      const builder = createMockQueryBuilder({ data: null, error });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useCreateLookbookSeason(), { wrapper: Wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync(newSeasonInput);
        } catch (e) {
          // Expected error
        }
      });

      expect(mockToastError).toHaveBeenCalledWith('Duplicate slug');
    });

    it('should show error toast with error message', async () => {
      const errorMessage = 'Validation failed: season_name is required';
      const error = new Error(errorMessage);
      const builder = createMockQueryBuilder({ data: null, error });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useCreateLookbookSeason(), { wrapper: Wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync(newSeasonInput);
        } catch (e) {
          // Expected
        }
      });

      expect(mockToastError).toHaveBeenCalledWith(errorMessage);
    });
  });

  // =====================================================
  // useUpdateLookbookSeason
  // =====================================================
  describe('useUpdateLookbookSeason', () => {
    const updateInput = {
      id: 'season-1',
      season_name: 'Updated Spring 2024',
      is_active: false,
    };

    it('should update season successfully', async () => {
      const updatedSeason = createMockSeason({ ...updateInput });
      const builder = createMockQueryBuilder({ data: updatedSeason, error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateLookbookSeason(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync(updateInput);
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('lookbook_seasons');
      expect(builder.update).toHaveBeenCalledWith({
        season_name: 'Updated Spring 2024',
        is_active: false,
      });
      expect(builder.eq).toHaveBeenCalledWith('id', 'season-1');
      expect(builder.select).toHaveBeenCalled();
      expect(builder.single).toHaveBeenCalled();

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['lookbook-seasons'] });
      expect(mockToastSuccess).toHaveBeenCalledWith('Сезон обновлен');
    });

    it('should handle update error', async () => {
      const error = new Error('Season not found');
      const builder = createMockQueryBuilder({ data: null, error });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useUpdateLookbookSeason(), { wrapper: Wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync(updateInput);
        } catch (e) {
          // Expected
        }
      });

      expect(mockToastError).toHaveBeenCalledWith('Season not found');
    });

    it('should only send non-id fields in update payload', async () => {
      const builder = createMockQueryBuilder({ data: createMockSeason(), error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useUpdateLookbookSeason(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync({ id: 'season-1', display_order: 5 });
      });

      // Verify id is not in the update payload
      expect(builder.update).toHaveBeenCalledWith({ display_order: 5 });
    });
  });

  // =====================================================
  // useDeleteLookbookSeason
  // =====================================================
  describe('useDeleteLookbookSeason', () => {
    it('should delete season successfully', async () => {
      const builder = createMockQueryBuilder({ data: null, error: null });
      // Override eq to return promise directly for delete
      builder.eq.mockReturnValue(Promise.resolve({ error: null }));
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteLookbookSeason(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync('season-to-delete');
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('lookbook_seasons');
      expect(builder.delete).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith('id', 'season-to-delete');

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['lookbook-seasons'] });
      expect(mockToastSuccess).toHaveBeenCalledWith('Сезон удален');
    });

    it('should handle delete error', async () => {
      const error = new Error('Cannot delete: has associated images');
      const builder = createMockQueryBuilder({ data: null, error: null });
      builder.eq.mockReturnValue(Promise.resolve({ error }));
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteLookbookSeason(), { wrapper: Wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync('season-1');
        } catch (e) {
          // Expected
        }
      });

      expect(mockToastError).toHaveBeenCalledWith('Cannot delete: has associated images');
    });
  });

  // =====================================================
  // useCreateLookbookImage
  // =====================================================
  describe('useCreateLookbookImage', () => {
    const newImageInput = {
      season_id: 'season-1',
      image_url: 'https://example.com/new-image.jpg',
      caption: 'New image caption',
      display_order: 1,
      is_visible: true,
    };

    it('should create image successfully', async () => {
      const createdImage = createMockImage({ ...newImageInput, id: 'new-image-id' });
      const builder = createMockQueryBuilder({ data: createdImage, error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateLookbookImage(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync(newImageInput);
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('lookbook_images');
      expect(builder.insert).toHaveBeenCalledWith(newImageInput);
      expect(builder.select).toHaveBeenCalled();
      expect(builder.single).toHaveBeenCalled();

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['lookbook-images'] });
      expect(mockToastSuccess).toHaveBeenCalledWith('Изображение добавлено');
    });

    it('should handle creation error', async () => {
      const error = new Error('Invalid season_id');
      const builder = createMockQueryBuilder({ data: null, error });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useCreateLookbookImage(), { wrapper: Wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync(newImageInput);
        } catch (e) {
          // Expected
        }
      });

      expect(mockToastError).toHaveBeenCalledWith('Invalid season_id');
    });

    it('should create image with minimal required fields', async () => {
      const minimalInput = {
        season_id: 'season-1',
        image_url: 'https://example.com/image.jpg',
        display_order: 1,
        is_visible: true,
      };
      const createdImage = createMockImage(minimalInput);
      const builder = createMockQueryBuilder({ data: createdImage, error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useCreateLookbookImage(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync(minimalInput);
      });

      expect(builder.insert).toHaveBeenCalledWith(minimalInput);
    });
  });

  // =====================================================
  // useUpdateLookbookImage
  // =====================================================
  describe('useUpdateLookbookImage', () => {
    const updateInput = {
      id: 'image-1',
      caption: 'Updated caption',
      is_visible: false,
    };

    it('should update image successfully', async () => {
      const updatedImage = createMockImage({ ...updateInput });
      const builder = createMockQueryBuilder({ data: updatedImage, error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateLookbookImage(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync(updateInput);
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('lookbook_images');
      expect(builder.update).toHaveBeenCalledWith({
        caption: 'Updated caption',
        is_visible: false,
      });
      expect(builder.eq).toHaveBeenCalledWith('id', 'image-1');
      expect(builder.select).toHaveBeenCalled();
      expect(builder.single).toHaveBeenCalled();

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['lookbook-images'] });
      expect(mockToastSuccess).toHaveBeenCalledWith('Изображение обновлено');
    });

    it('should handle update error', async () => {
      const error = new Error('Image not found');
      const builder = createMockQueryBuilder({ data: null, error });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useUpdateLookbookImage(), { wrapper: Wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync(updateInput);
        } catch (e) {
          // Expected
        }
      });

      expect(mockToastError).toHaveBeenCalledWith('Image not found');
    });

    it('should only send non-id fields in update payload', async () => {
      const builder = createMockQueryBuilder({ data: createMockImage(), error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useUpdateLookbookImage(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: 'image-1',
          alt_text: 'New alt text',
          photographer_credit: 'Jane Smith',
        });
      });

      expect(builder.update).toHaveBeenCalledWith({
        alt_text: 'New alt text',
        photographer_credit: 'Jane Smith',
      });
    });
  });

  // =====================================================
  // useDeleteLookbookImage
  // =====================================================
  describe('useDeleteLookbookImage', () => {
    it('should delete image successfully', async () => {
      const builder = createMockQueryBuilder({ data: null, error: null });
      builder.eq.mockReturnValue(Promise.resolve({ error: null }));
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteLookbookImage(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync('image-to-delete');
      });

      expect(mockSupabaseFrom).toHaveBeenCalledWith('lookbook_images');
      expect(builder.delete).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith('id', 'image-to-delete');

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['lookbook-images'] });
      expect(mockToastSuccess).toHaveBeenCalledWith('Изображение удалено');
    });

    it('should handle delete error', async () => {
      const error = new Error('Permission denied');
      const builder = createMockQueryBuilder({ data: null, error: null });
      builder.eq.mockReturnValue(Promise.resolve({ error }));
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteLookbookImage(), { wrapper: Wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync('image-1');
        } catch (e) {
          // Expected
        }
      });

      expect(mockToastError).toHaveBeenCalledWith('Permission denied');
    });
  });

  // =====================================================
  // Cross-hook integration scenarios
  // =====================================================
  describe('Cross-hook integration', () => {
    it('should invalidate correct query keys on season mutation', async () => {
      const builder = createMockQueryBuilder({ data: createMockSeason(), error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result: createResult } = renderHook(() => useCreateLookbookSeason(), { wrapper: Wrapper });
      const { result: updateResult } = renderHook(() => useUpdateLookbookSeason(), { wrapper: Wrapper });

      // Delete needs special mock
      const deleteBuilder = createMockQueryBuilder({ data: null, error: null });
      deleteBuilder.eq.mockReturnValue(Promise.resolve({ error: null }));

      await act(async () => {
        await createResult.current.mutateAsync({
          season_name: 'Test',
          slug: 'test',
          display_order: 1,
          is_active: true,
        });
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['lookbook-seasons'] });

      await act(async () => {
        await updateResult.current.mutateAsync({ id: 'season-1', season_name: 'Updated' });
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['lookbook-seasons'] });
    });

    it('should invalidate correct query keys on image mutation', async () => {
      const builder = createMockQueryBuilder({ data: createMockImage(), error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result: createResult } = renderHook(() => useCreateLookbookImage(), { wrapper: Wrapper });

      await act(async () => {
        await createResult.current.mutateAsync({
          season_id: 'season-1',
          image_url: 'https://example.com/img.jpg',
          display_order: 1,
          is_visible: true,
        });
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['lookbook-images'] });
    });
  });

  // =====================================================
  // Edge cases
  // =====================================================
  describe('Edge cases', () => {
    it('should handle null error from supabase', async () => {
      const builder = createMockQueryBuilder({ data: [], error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useLookbookSeasons(), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.error).toBeNull();
    });

    it('should handle empty string seasonId in useLookbookImages', async () => {
      // Empty string is falsy in JS, so the conditional branch (if seasonId) won't execute
      // This means eq() won't be called and order() returns the result directly
      const builder = createMockQueryBuilder({ data: [], error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useLookbookImages(''), { wrapper: Wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Empty string is falsy, so eq should NOT be called
      expect(builder.eq).not.toHaveBeenCalled();
    });

    it('should handle mutation return value', async () => {
      const createdSeason = createMockSeason({ id: 'returned-id' });
      const builder = createMockQueryBuilder({ data: createdSeason, error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useCreateLookbookSeason(), { wrapper: Wrapper });

      let returnedData: unknown;
      await act(async () => {
        returnedData = await result.current.mutateAsync({
          season_name: 'Test',
          slug: 'test',
          display_order: 1,
          is_active: true,
        });
      });

      expect(returnedData).toEqual(createdSeason);
    });

    it('should handle concurrent mutations', async () => {
      const builder = createMockQueryBuilder({ data: createMockSeason(), error: null });
      mockSupabaseFrom.mockReturnValue(builder);

      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useCreateLookbookSeason(), { wrapper: Wrapper });

      await act(async () => {
        await Promise.all([
          result.current.mutateAsync({
            season_name: 'Season 1',
            slug: 'season-1',
            display_order: 1,
            is_active: true,
          }),
          result.current.mutateAsync({
            season_name: 'Season 2',
            slug: 'season-2',
            display_order: 2,
            is_active: true,
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
    it('should export LookbookSeason interface correctly', () => {
      const season: LookbookSeason = createMockSeason();
      expect(season.id).toBeDefined();
      expect(season.season_name).toBeDefined();
      expect(season.slug).toBeDefined();
      expect(season.display_order).toBeDefined();
      expect(season.is_active).toBeDefined();
      expect(season.created_at).toBeDefined();
      expect(season.updated_at).toBeDefined();
    });

    it('should export LookbookImage interface correctly', () => {
      const image: LookbookImage = createMockImage();
      expect(image.id).toBeDefined();
      expect(image.season_id).toBeDefined();
      expect(image.image_url).toBeDefined();
      expect(image.display_order).toBeDefined();
      expect(image.is_visible).toBeDefined();
      expect(image.created_at).toBeDefined();
    });

    it('should have optional fields as optional in LookbookSeason', () => {
      const minimalSeason: LookbookSeason = {
        id: '1',
        season_name: 'Test',
        slug: 'test',
        display_order: 1,
        is_active: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };
      // Optional fields should be undefined
      expect(minimalSeason.short_description).toBeUndefined();
      expect(minimalSeason.cover_image_url).toBeUndefined();
      expect(minimalSeason.title).toBeUndefined();
      expect(minimalSeason.subtitle).toBeUndefined();
      expect(minimalSeason.description).toBeUndefined();
    });

    it('should have optional fields as optional in LookbookImage', () => {
      const minimalImage: LookbookImage = {
        id: '1',
        season_id: 's1',
        image_url: 'https://example.com/img.jpg',
        display_order: 1,
        is_visible: true,
        created_at: '2024-01-01',
      };
      // Optional fields should be undefined
      expect(minimalImage.caption).toBeUndefined();
      expect(minimalImage.alt_text).toBeUndefined();
      expect(minimalImage.photographer_credit).toBeUndefined();
    });
  });
});
