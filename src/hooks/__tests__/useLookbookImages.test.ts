import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { createWrapper, createTestQueryClient } from '@/__mocks__/react-query';

// Use vi.hoisted to create mocks that are available before module imports
const { mockSupabaseClient, mockToast, setMockResponse, getChainable, resetChainable } = vi.hoisted(() => {
  const responseStore = {
    data: null as any,
    error: null as any,
  };

  const createChainableMock = () => {
    const mock: any = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(async () => ({
        data: responseStore.data,
        error: responseStore.error,
      })),
      then: vi.fn().mockImplementation((resolve) =>
        Promise.resolve({ data: responseStore.data, error: responseStore.error }).then(resolve)
      ),
    };
    return mock;
  };

  const chainableMock = createChainableMock();

  const mockSupabaseClient = {
    from: vi.fn().mockReturnValue(chainableMock),
  };

  const mockToast = Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  });

  const setMockResponse = (data: any, error: any = null) => {
    responseStore.data = data;
    responseStore.error = error;
  };

  const getChainable = () => chainableMock;

  const resetChainable = () => {
    responseStore.data = null;
    responseStore.error = null;
    mockSupabaseClient.from.mockClear();
    Object.keys(chainableMock).forEach((key) => {
      if (typeof chainableMock[key]?.mockClear === 'function') {
        chainableMock[key].mockClear();
      }
    });
  };

  return { mockSupabaseClient, mockToast, setMockResponse, getChainable, resetChainable };
});

// Mock supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: mockToast,
}));

// Import after mocks are set up
import {
  useLookbookImages,
  useCreateLookbookImage,
  useUpdateLookbookImage,
  useDeleteLookbookImage,
  type LookbookImage,
} from '../useLookbookImages';

// Mock test data
const mockImages: LookbookImage[] = [
  {
    id: 'img-1',
    season_id: 'season-1',
    image_url: 'https://example.com/img1.jpg',
    caption: 'Beautiful spring dress',
    alt_text: 'Model wearing spring dress',
    display_order: 1,
    is_visible: true,
    photographer_credit: 'John Doe',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'img-2',
    season_id: 'season-1',
    image_url: 'https://example.com/img2.jpg',
    caption: 'Summer outfit',
    alt_text: 'Model in summer outfit',
    display_order: 2,
    is_visible: true,
    created_at: '2024-01-02T00:00:00Z',
  },
  {
    id: 'img-3',
    season_id: 'season-2',
    image_url: 'https://example.com/img3.jpg',
    display_order: 1,
    is_visible: false,
    created_at: '2024-01-03T00:00:00Z',
  },
];

describe('useLookbookImages', () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    vi.clearAllMocks();
    resetChainable();
    queryClient = createTestQueryClient();
    wrapper = createWrapper(queryClient);
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useLookbookImages hook', () => {
    it('should fetch all images without seasonId filter', async () => {
      setMockResponse(mockImages);

      const { result } = renderHook(() => useLookbookImages(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockImages);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('lookbook_images');
      const chainable = getChainable();
      expect(chainable.select).toHaveBeenCalledWith('*');
      expect(chainable.order).toHaveBeenCalledWith('display_order', { ascending: true });
    });

    it('should filter images by seasonId', async () => {
      const season1Images = mockImages.filter((img) => img.season_id === 'season-1');
      setMockResponse(season1Images);

      const { result } = renderHook(() => useLookbookImages('season-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(season1Images);
      const chainable = getChainable();
      expect(chainable.eq).toHaveBeenCalledWith('season_id', 'season-1');
    });

    it('should not apply eq filter when seasonId is undefined', async () => {
      setMockResponse(mockImages);

      const { result } = renderHook(() => useLookbookImages(undefined), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const chainable = getChainable();
      expect(chainable.eq).not.toHaveBeenCalled();
    });

    it('should handle empty results', async () => {
      setMockResponse([]);

      const { result } = renderHook(() => useLookbookImages('non-existent-season'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('should handle fetch error', async () => {
      const error = new Error('Database error');
      setMockResponse(null, error);

      const { result } = renderHook(() => useLookbookImages(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });

    it('should use correct query key with seasonId', async () => {
      setMockResponse(mockImages);

      renderHook(() => useLookbookImages('season-1'), { wrapper });

      await waitFor(() => {
        const queryState = queryClient.getQueryState(['lookbook-images', 'season-1']);
        expect(queryState).toBeDefined();
      });
    });

    it('should use correct query key without seasonId', async () => {
      setMockResponse(mockImages);

      renderHook(() => useLookbookImages(), { wrapper });

      await waitFor(() => {
        const queryState = queryClient.getQueryState(['lookbook-images', undefined]);
        expect(queryState).toBeDefined();
      });
    });

    it('should handle loading state', () => {
      setMockResponse(mockImages);

      const { result } = renderHook(() => useLookbookImages(), { wrapper });

      expect(result.current.isLoading).toBe(true);
    });

    it('should refetch when seasonId changes', async () => {
      const season1Images = mockImages.filter((img) => img.season_id === 'season-1');
      setMockResponse(season1Images);

      const { result, rerender } = renderHook(
        ({ seasonId }) => useLookbookImages(seasonId),
        {
          wrapper,
          initialProps: { seasonId: 'season-1' },
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(result.current.data).toHaveLength(2);

      // Change seasonId
      const season2Images = mockImages.filter((img) => img.season_id === 'season-2');
      setMockResponse(season2Images);

      rerender({ seasonId: 'season-2' });

      await waitFor(() => {
        expect(result.current.data).toHaveLength(1);
      });
    });
  });

  describe('useCreateLookbookImage hook', () => {
    const newImageInput: Omit<LookbookImage, 'id' | 'created_at'> = {
      season_id: 'season-1',
      image_url: 'https://example.com/new-img.jpg',
      caption: 'New image caption',
      alt_text: 'New image alt text',
      display_order: 3,
      is_visible: true,
      photographer_credit: 'Jane Smith',
    };

    const createdImage: LookbookImage = {
      id: 'img-new',
      ...newImageInput,
      created_at: '2024-01-10T00:00:00Z',
    };

    it('should create image successfully', async () => {
      setMockResponse(createdImage);

      const { result } = renderHook(() => useCreateLookbookImage(), { wrapper });

      await act(async () => {
        const created = await result.current.mutateAsync(newImageInput);
        expect(created).toEqual(createdImage);
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('lookbook_images');
      const chainable = getChainable();
      expect(chainable.insert).toHaveBeenCalledWith(newImageInput);
    });

    it('should show success toast on create', async () => {
      setMockResponse(createdImage);

      const { result } = renderHook(() => useCreateLookbookImage(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(newImageInput);
      });

      expect(mockToast.success).toHaveBeenCalledWith('Изображение добавлено');
    });

    it('should invalidate queries on success', async () => {
      setMockResponse(createdImage);
      const mockInvalidate = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateLookbookImage(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(newImageInput);
      });

      expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ['lookbook-images'] });
    });

    it('should handle create error', async () => {
      const error = new Error('Invalid image URL');
      setMockResponse(null, error);

      const { result } = renderHook(() => useCreateLookbookImage(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync(newImageInput);
        } catch {
          // Expected error
        }
      });

      expect(mockToast.error).toHaveBeenCalledWith('Invalid image URL');
    });

    it('should handle image with minimal fields', async () => {
      const minimalInput: Omit<LookbookImage, 'id' | 'created_at'> = {
        season_id: 'season-1',
        image_url: 'https://example.com/minimal.jpg',
        display_order: 1,
        is_visible: true,
      };

      const minimalImage: LookbookImage = {
        id: 'img-minimal',
        ...minimalInput,
        created_at: '2024-01-01T00:00:00Z',
      };

      setMockResponse(minimalImage);

      const { result } = renderHook(() => useCreateLookbookImage(), { wrapper });

      await act(async () => {
        const created = await result.current.mutateAsync(minimalInput);
        expect(created.caption).toBeUndefined();
        expect(created.alt_text).toBeUndefined();
        expect(created.photographer_credit).toBeUndefined();
      });
    });
  });

  describe('useUpdateLookbookImage hook', () => {
    const updateInput = {
      id: 'img-1',
      caption: 'Updated caption',
      is_visible: false,
    };

    const updatedImage: LookbookImage = {
      ...mockImages[0],
      caption: 'Updated caption',
      is_visible: false,
    };

    it('should update image successfully', async () => {
      setMockResponse(updatedImage);

      const { result } = renderHook(() => useUpdateLookbookImage(), { wrapper });

      await act(async () => {
        const updated = await result.current.mutateAsync(updateInput);
        expect(updated).toEqual(updatedImage);
      });

      const chainable = getChainable();
      expect(chainable.update).toHaveBeenCalledWith({
        caption: 'Updated caption',
        is_visible: false,
      });
      expect(chainable.eq).toHaveBeenCalledWith('id', 'img-1');
    });

    it('should show success toast on update', async () => {
      setMockResponse(updatedImage);

      const { result } = renderHook(() => useUpdateLookbookImage(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(updateInput);
      });

      expect(mockToast.success).toHaveBeenCalledWith('Изображение обновлено');
    });

    it('should invalidate queries on success', async () => {
      setMockResponse(updatedImage);
      const mockInvalidate = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateLookbookImage(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(updateInput);
      });

      expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ['lookbook-images'] });
    });

    it('should handle update error', async () => {
      const error = new Error('Image not found');
      setMockResponse(null, error);

      const { result } = renderHook(() => useUpdateLookbookImage(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync(updateInput);
        } catch {
          // Expected error
        }
      });

      expect(mockToast.error).toHaveBeenCalledWith('Image not found');
    });

    it('should update display_order', async () => {
      const orderUpdate = { id: 'img-1', display_order: 10 };
      setMockResponse({ ...mockImages[0], display_order: 10 });

      const { result } = renderHook(() => useUpdateLookbookImage(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(orderUpdate);
      });

      const chainable = getChainable();
      expect(chainable.update).toHaveBeenCalledWith({ display_order: 10 });
    });

    it('should update image_url', async () => {
      const urlUpdate = {
        id: 'img-1',
        image_url: 'https://example.com/updated-img.jpg',
      };
      setMockResponse({ ...mockImages[0], ...urlUpdate });

      const { result } = renderHook(() => useUpdateLookbookImage(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(urlUpdate);
      });

      const chainable = getChainable();
      expect(chainable.update).toHaveBeenCalledWith({
        image_url: 'https://example.com/updated-img.jpg',
      });
    });

    it('should handle multiple field update', async () => {
      const multiUpdate = {
        id: 'img-1',
        caption: 'New caption',
        alt_text: 'New alt',
        photographer_credit: 'New photographer',
        is_visible: false,
      };
      setMockResponse({ ...mockImages[0], ...multiUpdate });

      const { result } = renderHook(() => useUpdateLookbookImage(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(multiUpdate);
      });

      const chainable = getChainable();
      expect(chainable.update).toHaveBeenCalledWith({
        caption: 'New caption',
        alt_text: 'New alt',
        photographer_credit: 'New photographer',
        is_visible: false,
      });
    });
  });

  describe('useDeleteLookbookImage hook', () => {
    it('should delete image successfully', async () => {
      setMockResponse(null);

      const { result } = renderHook(() => useDeleteLookbookImage(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('img-1');
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('lookbook_images');
      const chainable = getChainable();
      expect(chainable.delete).toHaveBeenCalled();
      expect(chainable.eq).toHaveBeenCalledWith('id', 'img-1');
    });

    it('should show success toast on delete', async () => {
      setMockResponse(null);

      const { result } = renderHook(() => useDeleteLookbookImage(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('img-1');
      });

      expect(mockToast.success).toHaveBeenCalledWith('Изображение удалено');
    });

    it('should invalidate queries on success', async () => {
      setMockResponse(null);
      const mockInvalidate = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteLookbookImage(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('img-1');
      });

      expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ['lookbook-images'] });
    });

    it('should handle delete error', async () => {
      const error = new Error('Permission denied');
      setMockResponse(null, error);

      const { result } = renderHook(() => useDeleteLookbookImage(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync('img-1');
        } catch {
          // Expected error
        }
      });

      expect(mockToast.error).toHaveBeenCalledWith('Permission denied');
    });

    it('should handle non-existent image deletion', async () => {
      const error = new Error('Image not found');
      setMockResponse(null, error);

      const { result } = renderHook(() => useDeleteLookbookImage(), { wrapper });

      let thrownError: Error | null = null;
      await act(async () => {
        try {
          await result.current.mutateAsync('non-existent-id');
        } catch (e) {
          thrownError = e as Error;
        }
      });

      expect(thrownError?.message).toBe('Image not found');
    });
  });

  describe('Edge cases', () => {
    it('should handle image with all optional fields undefined', async () => {
      const minimalImage: LookbookImage = {
        id: 'img-minimal',
        season_id: 'season-1',
        image_url: 'https://example.com/img.jpg',
        display_order: 1,
        is_visible: true,
        created_at: '2024-01-01T00:00:00Z',
      };
      setMockResponse([minimalImage]);

      const { result } = renderHook(() => useLookbookImages(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.[0].caption).toBeUndefined();
      expect(result.current.data?.[0].alt_text).toBeUndefined();
      expect(result.current.data?.[0].photographer_credit).toBeUndefined();
    });

    it('should handle very long caption', async () => {
      const longCaption = 'A'.repeat(5000);
      const longCaptionImage: LookbookImage = {
        ...mockImages[0],
        caption: longCaption,
      };
      setMockResponse([longCaptionImage]);

      const { result } = renderHook(() => useLookbookImages(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.[0].caption?.length).toBe(5000);
    });

    it('should handle special characters in caption', async () => {
      const specialCaption = 'Image with "quotes" & <special> chars';
      const specialImage: LookbookImage = {
        ...mockImages[0],
        caption: specialCaption,
      };
      setMockResponse([specialImage]);

      const { result } = renderHook(() => useLookbookImages(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.[0].caption).toBe(specialCaption);
    });

    it('should handle URL with special characters', async () => {
      const specialUrl = 'https://example.com/image%20with%20spaces.jpg?query=param&another=value';
      const specialUrlImage: LookbookImage = {
        ...mockImages[0],
        image_url: specialUrl,
      };
      setMockResponse([specialUrlImage]);

      const { result } = renderHook(() => useLookbookImages(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.[0].image_url).toBe(specialUrl);
    });

    it('should handle network timeout', async () => {
      const timeoutError = new Error('Request timeout');
      setMockResponse(null, timeoutError);

      const { result } = renderHook(() => useLookbookImages(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Request timeout');
    });

    it('should handle zero display_order', async () => {
      const zeroOrderImage: LookbookImage = {
        ...mockImages[0],
        display_order: 0,
      };
      setMockResponse(zeroOrderImage);

      const { result } = renderHook(() => useCreateLookbookImage(), { wrapper });

      await act(async () => {
        const created = await result.current.mutateAsync({
          season_id: 'season-1',
          image_url: 'https://example.com/img.jpg',
          display_order: 0,
          is_visible: true,
        });
        expect(created.display_order).toBe(0);
      });
    });

    it('should handle negative display_order', async () => {
      const negativeOrderImage: LookbookImage = {
        ...mockImages[0],
        display_order: -1,
      };
      setMockResponse(negativeOrderImage);

      const { result } = renderHook(() => useCreateLookbookImage(), { wrapper });

      await act(async () => {
        const created = await result.current.mutateAsync({
          season_id: 'season-1',
          image_url: 'https://example.com/img.jpg',
          display_order: -1,
          is_visible: true,
        });
        expect(created.display_order).toBe(-1);
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should handle CRUD workflow for images', async () => {
      // List images
      setMockResponse(mockImages.filter((img) => img.season_id === 'season-1'));
      const { result: listResult } = renderHook(() => useLookbookImages('season-1'), { wrapper });

      await waitFor(() => {
        expect(listResult.current.isSuccess).toBe(true);
      });
      expect(listResult.current.data).toHaveLength(2);

      // Create new image
      const newImage: LookbookImage = {
        id: 'img-new',
        season_id: 'season-1',
        image_url: 'https://example.com/new.jpg',
        caption: 'New image',
        display_order: 3,
        is_visible: true,
        created_at: '2024-01-10T00:00:00Z',
      };
      setMockResponse(newImage);
      const { result: createResult } = renderHook(() => useCreateLookbookImage(), { wrapper });

      await act(async () => {
        await createResult.current.mutateAsync({
          season_id: 'season-1',
          image_url: 'https://example.com/new.jpg',
          caption: 'New image',
          display_order: 3,
          is_visible: true,
        });
      });
      expect(mockToast.success).toHaveBeenCalledWith('Изображение добавлено');

      // Update image
      vi.clearAllMocks();
      setMockResponse({ ...newImage, caption: 'Updated caption' });
      const { result: updateResult } = renderHook(() => useUpdateLookbookImage(), { wrapper });

      await act(async () => {
        await updateResult.current.mutateAsync({ id: 'img-new', caption: 'Updated caption' });
      });
      expect(mockToast.success).toHaveBeenCalledWith('Изображение обновлено');

      // Delete image
      vi.clearAllMocks();
      setMockResponse(null);
      const { result: deleteResult } = renderHook(() => useDeleteLookbookImage(), { wrapper });

      await act(async () => {
        await deleteResult.current.mutateAsync('img-new');
      });
      expect(mockToast.success).toHaveBeenCalledWith('Изображение удалено');
    });

    it('should fetch images for different seasons', async () => {
      // Fetch season 1 images
      const season1Images = mockImages.filter((img) => img.season_id === 'season-1');
      setMockResponse(season1Images);

      const { result: season1Result } = renderHook(() => useLookbookImages('season-1'), { wrapper });

      await waitFor(() => {
        expect(season1Result.current.isSuccess).toBe(true);
      });
      expect(season1Result.current.data).toHaveLength(2);

      // Fetch season 2 images
      const season2Images = mockImages.filter((img) => img.season_id === 'season-2');
      setMockResponse(season2Images);

      const { result: season2Result } = renderHook(() => useLookbookImages('season-2'), { wrapper });

      await waitFor(() => {
        expect(season2Result.current.isSuccess).toBe(true);
      });
      expect(season2Result.current.data).toHaveLength(1);
    });

    it('should reorder images by updating display_order', async () => {
      // Update display_order for first image
      setMockResponse({ ...mockImages[0], display_order: 5 });
      const { result: updateResult } = renderHook(() => useUpdateLookbookImage(), { wrapper });

      await act(async () => {
        await updateResult.current.mutateAsync({ id: 'img-1', display_order: 5 });
      });

      const chainable = getChainable();
      expect(chainable.update).toHaveBeenCalledWith({ display_order: 5 });
    });

    it('should toggle visibility', async () => {
      // Hide visible image
      setMockResponse({ ...mockImages[0], is_visible: false });
      const { result: updateResult } = renderHook(() => useUpdateLookbookImage(), { wrapper });

      await act(async () => {
        await updateResult.current.mutateAsync({ id: 'img-1', is_visible: false });
      });

      const chainable = getChainable();
      expect(chainable.update).toHaveBeenCalledWith({ is_visible: false });

      // Show hidden image
      vi.clearAllMocks();
      setMockResponse({ ...mockImages[2], is_visible: true });

      await act(async () => {
        await updateResult.current.mutateAsync({ id: 'img-3', is_visible: true });
      });

      expect(getChainable().update).toHaveBeenCalledWith({ is_visible: true });
    });
  });
});
