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
  useLookbookSeasons,
  useCreateLookbookSeason,
  useUpdateLookbookSeason,
  useDeleteLookbookSeason,
  type LookbookSeason,
} from '../useLookbookSeasons';

// Mock test data
const mockSeasons: LookbookSeason[] = [
  {
    id: 'season-1',
    season_name: 'Spring 2024',
    slug: 'spring-2024',
    short_description: 'Spring collection',
    cover_image_url: 'https://example.com/spring.jpg',
    title: 'Spring Collection',
    subtitle: 'Fresh looks for spring',
    description: 'Full spring description',
    display_order: 1,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'season-2',
    season_name: 'Summer 2024',
    slug: 'summer-2024',
    short_description: 'Summer collection',
    cover_image_url: 'https://example.com/summer.jpg',
    title: 'Summer Collection',
    subtitle: 'Hot summer styles',
    description: 'Full summer description',
    display_order: 2,
    is_active: true,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
  },
  {
    id: 'season-3',
    season_name: 'Fall 2024',
    slug: 'fall-2024',
    display_order: 3,
    is_active: false,
    created_at: '2024-03-01T00:00:00Z',
    updated_at: '2024-03-01T00:00:00Z',
  },
];

describe('useLookbookSeasons', () => {
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

  describe('useLookbookSeasons hook', () => {
    it('should fetch all seasons successfully', async () => {
      setMockResponse(mockSeasons);

      const { result } = renderHook(() => useLookbookSeasons(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockSeasons);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('lookbook_seasons');
    });

    it('should order by display_order ascending', async () => {
      setMockResponse(mockSeasons);

      const { result } = renderHook(() => useLookbookSeasons(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const chainable = getChainable();
      expect(chainable.order).toHaveBeenCalledWith('display_order', { ascending: true });
    });

    it('should handle empty results', async () => {
      setMockResponse([]);

      const { result } = renderHook(() => useLookbookSeasons(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('should handle fetch error', async () => {
      const error = new Error('Database connection failed');
      setMockResponse(null, error);

      const { result } = renderHook(() => useLookbookSeasons(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });

    it('should use correct query key', async () => {
      setMockResponse(mockSeasons);

      renderHook(() => useLookbookSeasons(), { wrapper });

      await waitFor(() => {
        const queryState = queryClient.getQueryState(['lookbook-seasons']);
        expect(queryState).toBeDefined();
      });
    });

    it('should handle loading state', () => {
      setMockResponse(mockSeasons);

      const { result } = renderHook(() => useLookbookSeasons(), { wrapper });

      expect(result.current.isLoading).toBe(true);
    });

    it('should accept custom query options', async () => {
      setMockResponse(mockSeasons);

      const { result } = renderHook(
        () => useLookbookSeasons({ staleTime: 10000 }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockSeasons);
    });
  });

  describe('useCreateLookbookSeason hook', () => {
    const newSeasonInput = {
      season_name: 'Winter 2024',
      slug: 'winter-2024',
      short_description: 'Winter collection',
      display_order: 4,
      is_active: true,
    };

    const createdSeason: LookbookSeason = {
      id: 'season-4',
      ...newSeasonInput,
      created_at: '2024-04-01T00:00:00Z',
      updated_at: '2024-04-01T00:00:00Z',
    };

    it('should create season successfully', async () => {
      setMockResponse(createdSeason);

      const { result } = renderHook(() => useCreateLookbookSeason(), { wrapper });

      await act(async () => {
        const created = await result.current.mutateAsync(newSeasonInput);
        expect(created).toEqual(createdSeason);
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('lookbook_seasons');
      const chainable = getChainable();
      expect(chainable.insert).toHaveBeenCalledWith(newSeasonInput);
    });

    it('should show success toast on create', async () => {
      setMockResponse(createdSeason);

      const { result } = renderHook(() => useCreateLookbookSeason(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(newSeasonInput);
      });

      expect(mockToast.success).toHaveBeenCalledWith('Сезон создан');
    });

    it('should invalidate queries on success', async () => {
      setMockResponse(createdSeason);
      const mockInvalidate = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateLookbookSeason(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(newSeasonInput);
      });

      expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ['lookbook-seasons'] });
    });

    it('should handle create error', async () => {
      const error = new Error('Duplicate slug');
      setMockResponse(null, error);

      const { result } = renderHook(() => useCreateLookbookSeason(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync(newSeasonInput);
        } catch {
          // Expected error
        }
      });

      expect(mockToast.error).toHaveBeenCalledWith('Duplicate slug');
    });

    it('should handle season with optional fields', async () => {
      const minimalInput = {
        season_name: 'Minimal Season',
        slug: 'minimal-season',
        display_order: 5,
        is_active: false,
      };

      const minimalSeason: LookbookSeason = {
        id: 'season-5',
        ...minimalInput,
        created_at: '2024-05-01T00:00:00Z',
        updated_at: '2024-05-01T00:00:00Z',
      };

      setMockResponse(minimalSeason);

      const { result } = renderHook(() => useCreateLookbookSeason(), { wrapper });

      await act(async () => {
        const created = await result.current.mutateAsync(minimalInput);
        expect(created.short_description).toBeUndefined();
        expect(created.cover_image_url).toBeUndefined();
      });
    });
  });

  describe('useUpdateLookbookSeason hook', () => {
    const updateInput = {
      id: 'season-1',
      season_name: 'Updated Spring 2024',
      is_active: false,
    };

    const updatedSeason: LookbookSeason = {
      ...mockSeasons[0],
      season_name: 'Updated Spring 2024',
      is_active: false,
      updated_at: '2024-01-15T00:00:00Z',
    };

    it('should update season successfully', async () => {
      setMockResponse(updatedSeason);

      const { result } = renderHook(() => useUpdateLookbookSeason(), { wrapper });

      await act(async () => {
        const updated = await result.current.mutateAsync(updateInput);
        expect(updated).toEqual(updatedSeason);
      });

      const chainable = getChainable();
      expect(chainable.update).toHaveBeenCalledWith({
        season_name: 'Updated Spring 2024',
        is_active: false,
      });
      expect(chainable.eq).toHaveBeenCalledWith('id', 'season-1');
    });

    it('should show success toast on update', async () => {
      setMockResponse(updatedSeason);

      const { result } = renderHook(() => useUpdateLookbookSeason(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(updateInput);
      });

      expect(mockToast.success).toHaveBeenCalledWith('Сезон обновлен');
    });

    it('should invalidate queries on success', async () => {
      setMockResponse(updatedSeason);
      const mockInvalidate = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateLookbookSeason(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(updateInput);
      });

      expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ['lookbook-seasons'] });
    });

    it('should handle update error', async () => {
      const error = new Error('Season not found');
      setMockResponse(null, error);

      const { result } = renderHook(() => useUpdateLookbookSeason(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync(updateInput);
        } catch {
          // Expected error
        }
      });

      expect(mockToast.error).toHaveBeenCalledWith('Season not found');
    });

    it('should handle partial update', async () => {
      const partialUpdate = { id: 'season-1', display_order: 10 };
      setMockResponse({ ...mockSeasons[0], display_order: 10 });

      const { result } = renderHook(() => useUpdateLookbookSeason(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(partialUpdate);
      });

      const chainable = getChainable();
      expect(chainable.update).toHaveBeenCalledWith({ display_order: 10 });
    });

    it('should update cover_image_url', async () => {
      const imageUpdate = {
        id: 'season-1',
        cover_image_url: 'https://example.com/new-cover.jpg',
      };
      setMockResponse({ ...mockSeasons[0], ...imageUpdate });

      const { result } = renderHook(() => useUpdateLookbookSeason(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(imageUpdate);
      });

      const chainable = getChainable();
      expect(chainable.update).toHaveBeenCalledWith({
        cover_image_url: 'https://example.com/new-cover.jpg',
      });
    });
  });

  describe('useDeleteLookbookSeason hook', () => {
    it('should delete season successfully', async () => {
      setMockResponse(null);

      const { result } = renderHook(() => useDeleteLookbookSeason(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('season-1');
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('lookbook_seasons');
      const chainable = getChainable();
      expect(chainable.delete).toHaveBeenCalled();
      expect(chainable.eq).toHaveBeenCalledWith('id', 'season-1');
    });

    it('should show success toast on delete', async () => {
      setMockResponse(null);

      const { result } = renderHook(() => useDeleteLookbookSeason(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('season-1');
      });

      expect(mockToast.success).toHaveBeenCalledWith('Сезон удален');
    });

    it('should invalidate queries on success', async () => {
      setMockResponse(null);
      const mockInvalidate = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteLookbookSeason(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('season-1');
      });

      expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ['lookbook-seasons'] });
    });

    it('should handle delete error', async () => {
      const error = new Error('Cannot delete: has images');
      setMockResponse(null, error);

      const { result } = renderHook(() => useDeleteLookbookSeason(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync('season-1');
        } catch {
          // Expected error
        }
      });

      expect(mockToast.error).toHaveBeenCalledWith('Cannot delete: has images');
    });

    it('should handle non-existent season deletion', async () => {
      const error = new Error('Season not found');
      setMockResponse(null, error);

      const { result } = renderHook(() => useDeleteLookbookSeason(), { wrapper });

      let thrownError: Error | null = null;
      await act(async () => {
        try {
          await result.current.mutateAsync('non-existent-id');
        } catch (e) {
          thrownError = e as Error;
        }
      });

      expect(thrownError?.message).toBe('Season not found');
    });
  });

  describe('Edge cases', () => {
    it('should handle season with all optional fields null', async () => {
      const nullFieldsSeason: LookbookSeason = {
        id: 'season-null',
        season_name: 'Null Season',
        slug: 'null-season',
        short_description: undefined,
        cover_image_url: undefined,
        title: undefined,
        subtitle: undefined,
        description: undefined,
        display_order: 1,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      setMockResponse([nullFieldsSeason]);

      const { result } = renderHook(() => useLookbookSeasons(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.[0].short_description).toBeUndefined();
      expect(result.current.data?.[0].cover_image_url).toBeUndefined();
    });

    it('should handle season with special characters in season_name', async () => {
      const specialSeason: LookbookSeason = {
        id: 'season-special',
        season_name: 'Spring "Collection" & Summer <2024>',
        slug: 'spring-collection-summer-2024',
        display_order: 1,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      setMockResponse(specialSeason);

      const { result } = renderHook(() => useCreateLookbookSeason(), { wrapper });

      await act(async () => {
        const created = await result.current.mutateAsync({
          season_name: 'Spring "Collection" & Summer <2024>',
          slug: 'spring-collection-summer-2024',
          display_order: 1,
          is_active: true,
        });
        expect(created.season_name).toBe('Spring "Collection" & Summer <2024>');
      });
    });

    it('should handle season with unicode in description', async () => {
      const unicodeSeason: LookbookSeason = {
        id: 'season-unicode',
        season_name: 'Unicode Season',
        slug: 'unicode-season',
        description: 'Description with unicode: emoji test',
        display_order: 1,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      setMockResponse([unicodeSeason]);

      const { result } = renderHook(() => useLookbookSeasons(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.[0].description).toContain('unicode');
    });

    it('should handle network timeout', async () => {
      const timeoutError = new Error('Request timeout');
      setMockResponse(null, timeoutError);

      const { result } = renderHook(() => useLookbookSeasons(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Request timeout');
    });

    it('should handle very long description', async () => {
      const longDescription = 'A'.repeat(10000);
      const longDescSeason: LookbookSeason = {
        id: 'season-long',
        season_name: 'Long Description Season',
        slug: 'long-description',
        description: longDescription,
        display_order: 1,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      setMockResponse([longDescSeason]);

      const { result } = renderHook(() => useLookbookSeasons(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.[0].description?.length).toBe(10000);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle create-update-delete workflow', async () => {
      // Create
      const newSeason: LookbookSeason = {
        id: 'new-season',
        season_name: 'New Season',
        slug: 'new-season',
        display_order: 5,
        is_active: true,
        created_at: '2024-05-01T00:00:00Z',
        updated_at: '2024-05-01T00:00:00Z',
      };
      setMockResponse(newSeason);
      const { result: createResult } = renderHook(() => useCreateLookbookSeason(), { wrapper });

      await act(async () => {
        await createResult.current.mutateAsync({
          season_name: 'New Season',
          slug: 'new-season',
          display_order: 5,
          is_active: true,
        });
      });
      expect(mockToast.success).toHaveBeenCalledWith('Сезон создан');

      // Update
      vi.clearAllMocks();
      setMockResponse({ ...newSeason, season_name: 'Updated Season' });
      const { result: updateResult } = renderHook(() => useUpdateLookbookSeason(), { wrapper });

      await act(async () => {
        await updateResult.current.mutateAsync({ id: 'new-season', season_name: 'Updated Season' });
      });
      expect(mockToast.success).toHaveBeenCalledWith('Сезон обновлен');

      // Delete
      vi.clearAllMocks();
      setMockResponse(null);
      const { result: deleteResult } = renderHook(() => useDeleteLookbookSeason(), { wrapper });

      await act(async () => {
        await deleteResult.current.mutateAsync('new-season');
      });
      expect(mockToast.success).toHaveBeenCalledWith('Сезон удален');
    });

    it('should refetch after mutation', async () => {
      setMockResponse(mockSeasons);
      const { result: listResult } = renderHook(() => useLookbookSeasons(), { wrapper });

      await waitFor(() => {
        expect(listResult.current.isSuccess).toBe(true);
      });
      expect(listResult.current.data).toHaveLength(3);

      // Create new season
      const newSeason: LookbookSeason = {
        id: 'season-4',
        season_name: 'Winter 2024',
        slug: 'winter-2024',
        display_order: 4,
        is_active: true,
        created_at: '2024-04-01T00:00:00Z',
        updated_at: '2024-04-01T00:00:00Z',
      };
      setMockResponse(newSeason);

      const mockInvalidate = vi.spyOn(queryClient, 'invalidateQueries');
      const { result: createResult } = renderHook(() => useCreateLookbookSeason(), { wrapper });

      await act(async () => {
        await createResult.current.mutateAsync({
          season_name: 'Winter 2024',
          slug: 'winter-2024',
          display_order: 4,
          is_active: true,
        });
      });

      expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ['lookbook-seasons'] });
    });
  });
});
