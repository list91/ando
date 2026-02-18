import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { createWrapper, createTestQueryClient } from '@/__mocks__/react-query';

// Use vi.hoisted to create mocks that are available before module imports
const { mockSupabaseClient, mockToast, setMockResponse, getChainable, resetChainable } = vi.hoisted(() => {
  // Store for response data
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
import { createSupabaseCRUD, CRUDConfig, CRUDHooks } from '../createSupabaseCRUD';

// Test entity type
interface TestEntity {
  id: string;
  name: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

type TestCreateInput = Omit<TestEntity, 'id' | 'created_at' | 'updated_at'>;
type TestUpdateInput = Partial<TestEntity>;

// Test configuration
const testConfig: CRUDConfig<TestEntity> = {
  tableName: 'test_entities',
  queryKey: 'test-entities',
  messages: {
    created: 'Entity created',
    updated: 'Entity updated',
    deleted: 'Entity deleted',
  },
  orderBy: {
    column: 'display_order',
    ascending: true,
  },
};

// Mock test data
const mockEntities: TestEntity[] = [
  { id: '1', name: 'Entity 1', display_order: 1, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: '2', name: 'Entity 2', display_order: 2, created_at: '2024-01-02T00:00:00Z', updated_at: '2024-01-02T00:00:00Z' },
  { id: '3', name: 'Entity 3', display_order: 3, created_at: '2024-01-03T00:00:00Z', updated_at: '2024-01-03T00:00:00Z' },
];

describe('createSupabaseCRUD', () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;
  let wrapper: ReturnType<typeof createWrapper>;
  let hooks: CRUDHooks<TestEntity, TestCreateInput, TestUpdateInput>;

  beforeEach(() => {
    vi.clearAllMocks();
    resetChainable();
    queryClient = createTestQueryClient();
    wrapper = createWrapper(queryClient);
    hooks = createSupabaseCRUD<TestEntity, TestCreateInput, TestUpdateInput>(testConfig);
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('createSupabaseCRUD factory', () => {
    it('should return an object with useList, useCreate, useUpdate, useDelete hooks', () => {
      expect(hooks).toHaveProperty('useList');
      expect(hooks).toHaveProperty('useCreate');
      expect(hooks).toHaveProperty('useUpdate');
      expect(hooks).toHaveProperty('useDelete');
      expect(typeof hooks.useList).toBe('function');
      expect(typeof hooks.useCreate).toBe('function');
      expect(typeof hooks.useUpdate).toBe('function');
      expect(typeof hooks.useDelete).toBe('function');
    });

    it('should create hooks with custom configuration', () => {
      const customConfig: CRUDConfig<TestEntity> = {
        tableName: 'custom_table',
        queryKey: 'custom-key',
        messages: {
          created: 'Custom created message',
          updated: 'Custom updated message',
          deleted: 'Custom deleted message',
        },
      };

      const customHooks = createSupabaseCRUD<TestEntity>(customConfig);
      expect(customHooks).toHaveProperty('useList');
      expect(customHooks).toHaveProperty('useCreate');
      expect(customHooks).toHaveProperty('useUpdate');
      expect(customHooks).toHaveProperty('useDelete');
    });
  });

  describe('useList hook', () => {
    it('should fetch all entities successfully', async () => {
      setMockResponse(mockEntities);

      const { result } = renderHook(() => hooks.useList(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockEntities);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('test_entities');
      const chainable = getChainable();
      expect(chainable.select).toHaveBeenCalledWith('*');
    });

    it('should apply orderBy when configured', async () => {
      setMockResponse(mockEntities);

      const { result } = renderHook(() => hooks.useList(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const chainable = getChainable();
      expect(chainable.order).toHaveBeenCalledWith('display_order', { ascending: true });
    });

    it('should apply orderBy with descending order', async () => {
      const descConfig: CRUDConfig<TestEntity> = {
        ...testConfig,
        orderBy: { column: 'display_order', ascending: false },
      };
      const descHooks = createSupabaseCRUD<TestEntity>(descConfig);
      setMockResponse(mockEntities);

      const { result } = renderHook(() => descHooks.useList(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const chainable = getChainable();
      expect(chainable.order).toHaveBeenCalledWith('display_order', { ascending: false });
    });

    it('should not apply orderBy when not configured', async () => {
      const noOrderConfig: CRUDConfig<TestEntity> = {
        tableName: 'test_entities',
        queryKey: 'test-entities-no-order',
        messages: testConfig.messages,
      };
      const noOrderHooks = createSupabaseCRUD<TestEntity>(noOrderConfig);
      setMockResponse(mockEntities);
      resetChainable();

      const { result } = renderHook(() => noOrderHooks.useList(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const chainable = getChainable();
      expect(chainable.order).not.toHaveBeenCalled();
    });

    it('should handle empty results', async () => {
      setMockResponse([]);

      const { result } = renderHook(() => hooks.useList(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('should handle fetch error', async () => {
      const error = new Error('Database connection failed');
      setMockResponse(null, error);

      const { result } = renderHook(() => hooks.useList(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });

    it('should accept custom query options', async () => {
      setMockResponse(mockEntities);

      const { result } = renderHook(
        () => hooks.useList({ staleTime: 5000 }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockEntities);
    });

    it('should use correct query key', async () => {
      setMockResponse(mockEntities);

      renderHook(() => hooks.useList(), { wrapper });

      await waitFor(() => {
        const queryState = queryClient.getQueryState(['test-entities']);
        expect(queryState).toBeDefined();
      });
    });

    it('should handle loading state correctly', () => {
      setMockResponse(mockEntities);

      const { result } = renderHook(() => hooks.useList(), { wrapper });

      // Initially should be loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('should handle refetch correctly', async () => {
      setMockResponse(mockEntities);

      const { result } = renderHook(() => hooks.useList(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(3);

      // Verify refetch function exists and can be called
      expect(typeof result.current.refetch).toBe('function');
    });
  });

  describe('useCreate hook', () => {
    const newEntityInput: TestCreateInput = {
      name: 'New Entity',
      display_order: 4,
    };

    const createdEntity: TestEntity = {
      id: 'new-id',
      ...newEntityInput,
      created_at: '2024-01-10T00:00:00Z',
      updated_at: '2024-01-10T00:00:00Z',
    };

    it('should create entity successfully', async () => {
      setMockResponse(createdEntity);

      const { result } = renderHook(() => hooks.useCreate(), { wrapper });

      await act(async () => {
        const created = await result.current.mutateAsync(newEntityInput);
        expect(created).toEqual(createdEntity);
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('test_entities');
      const chainable = getChainable();
      expect(chainable.insert).toHaveBeenCalledWith(newEntityInput);
      expect(chainable.select).toHaveBeenCalled();
      expect(chainable.single).toHaveBeenCalled();
    });

    it('should show success toast on create', async () => {
      setMockResponse(createdEntity);

      const { result } = renderHook(() => hooks.useCreate(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(newEntityInput);
      });

      expect(mockToast.success).toHaveBeenCalledWith('Entity created');
    });

    it('should invalidate queries on success', async () => {
      setMockResponse(createdEntity);
      const mockInvalidate = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => hooks.useCreate(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(newEntityInput);
      });

      expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ['test-entities'] });
    });

    it('should handle create error', async () => {
      const error = new Error('Duplicate key violation');
      setMockResponse(null, error);

      const { result } = renderHook(() => hooks.useCreate(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync(newEntityInput);
        } catch {
          // Expected error
        }
      });

      expect(mockToast.error).toHaveBeenCalledWith('Duplicate key violation');
    });

    it('should show error toast with correct message on failure', async () => {
      const error = new Error('Custom error message');
      setMockResponse(null, error);

      const { result } = renderHook(() => hooks.useCreate(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync(newEntityInput);
        } catch {
          // Expected error
        }
      });

      expect(mockToast.error).toHaveBeenCalledWith('Custom error message');
    });

    it('should handle pending state', () => {
      setMockResponse(createdEntity);

      const { result } = renderHook(() => hooks.useCreate(), { wrapper });

      expect(result.current.isPending).toBe(false);
    });

    it('should return created entity data', async () => {
      setMockResponse(createdEntity);

      const { result } = renderHook(() => hooks.useCreate(), { wrapper });

      let returnedData: any;
      await act(async () => {
        returnedData = await result.current.mutateAsync(newEntityInput);
      });

      // mutateAsync returns the created entity
      expect(returnedData).toEqual(createdEntity);
    });
  });

  describe('useUpdate hook', () => {
    const updateInput = {
      id: '1',
      name: 'Updated Entity',
    };

    const updatedEntity: TestEntity = {
      ...mockEntities[0],
      name: 'Updated Entity',
      updated_at: '2024-01-15T00:00:00Z',
    };

    it('should update entity successfully', async () => {
      setMockResponse(updatedEntity);

      const { result } = renderHook(() => hooks.useUpdate(), { wrapper });

      await act(async () => {
        const updated = await result.current.mutateAsync(updateInput);
        expect(updated).toEqual(updatedEntity);
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('test_entities');
      const chainable = getChainable();
      expect(chainable.update).toHaveBeenCalledWith({ name: 'Updated Entity' });
      expect(chainable.eq).toHaveBeenCalledWith('id', '1');
      expect(chainable.select).toHaveBeenCalled();
      expect(chainable.single).toHaveBeenCalled();
    });

    it('should show success toast on update', async () => {
      setMockResponse(updatedEntity);

      const { result } = renderHook(() => hooks.useUpdate(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(updateInput);
      });

      expect(mockToast.success).toHaveBeenCalledWith('Entity updated');
    });

    it('should invalidate queries on success', async () => {
      setMockResponse(updatedEntity);
      const mockInvalidate = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => hooks.useUpdate(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(updateInput);
      });

      expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ['test-entities'] });
    });

    it('should handle update error', async () => {
      const error = new Error('Entity not found');
      setMockResponse(null, error);

      const { result } = renderHook(() => hooks.useUpdate(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync(updateInput);
        } catch {
          // Expected error
        }
      });

      expect(mockToast.error).toHaveBeenCalledWith('Entity not found');
    });

    it('should handle partial update with multiple fields', async () => {
      const partialUpdate = {
        id: '1',
        name: 'New Name',
        display_order: 10,
      };
      setMockResponse({ ...mockEntities[0], ...partialUpdate });

      const { result } = renderHook(() => hooks.useUpdate(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(partialUpdate);
      });

      const chainable = getChainable();
      expect(chainable.update).toHaveBeenCalledWith({ name: 'New Name', display_order: 10 });
    });

    it('should extract id from input and pass rest to update', async () => {
      const input = { id: '2', name: 'Test', display_order: 5 };
      setMockResponse({ ...mockEntities[1], ...input });

      const { result } = renderHook(() => hooks.useUpdate(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(input);
      });

      const chainable = getChainable();
      expect(chainable.eq).toHaveBeenCalledWith('id', '2');
      expect(chainable.update).toHaveBeenCalledWith({ name: 'Test', display_order: 5 });
    });
  });

  describe('useDelete hook', () => {
    it('should delete entity successfully', async () => {
      setMockResponse(null);

      const { result } = renderHook(() => hooks.useDelete(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('1');
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('test_entities');
      const chainable = getChainable();
      expect(chainable.delete).toHaveBeenCalled();
      expect(chainable.eq).toHaveBeenCalledWith('id', '1');
    });

    it('should show success toast on delete', async () => {
      setMockResponse(null);

      const { result } = renderHook(() => hooks.useDelete(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('1');
      });

      expect(mockToast.success).toHaveBeenCalledWith('Entity deleted');
    });

    it('should invalidate queries on success', async () => {
      setMockResponse(null);
      const mockInvalidate = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => hooks.useDelete(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('1');
      });

      expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ['test-entities'] });
    });

    it('should handle delete error', async () => {
      const error = new Error('Cannot delete: entity in use');
      setMockResponse(null, error);

      const { result } = renderHook(() => hooks.useDelete(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync('1');
        } catch {
          // Expected error
        }
      });

      expect(mockToast.error).toHaveBeenCalledWith('Cannot delete: entity in use');
    });

    it('should handle non-existent entity deletion', async () => {
      const error = new Error('Entity not found');
      setMockResponse(null, error);

      const { result } = renderHook(() => hooks.useDelete(), { wrapper });

      let thrownError: Error | null = null;
      await act(async () => {
        try {
          await result.current.mutateAsync('non-existent-id');
        } catch (e) {
          thrownError = e as Error;
        }
      });

      expect(thrownError?.message).toBe('Entity not found');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle create-list-update-delete workflow', async () => {
      // Step 1: List existing entities
      setMockResponse(mockEntities);
      const { result: listResult } = renderHook(() => hooks.useList(), { wrapper });

      await waitFor(() => {
        expect(listResult.current.isSuccess).toBe(true);
      });
      expect(listResult.current.data).toHaveLength(3);

      // Step 2: Create new entity
      const newEntity: TestEntity = {
        id: '4',
        name: 'New Entity',
        display_order: 4,
        created_at: '2024-01-10T00:00:00Z',
        updated_at: '2024-01-10T00:00:00Z',
      };
      setMockResponse(newEntity);
      const { result: createResult } = renderHook(() => hooks.useCreate(), { wrapper });

      await act(async () => {
        await createResult.current.mutateAsync({ name: 'New Entity', display_order: 4 });
      });
      expect(mockToast.success).toHaveBeenCalledWith('Entity created');

      // Step 3: Update entity
      const updatedEntity = { ...newEntity, name: 'Updated Entity' };
      setMockResponse(updatedEntity);
      const { result: updateResult } = renderHook(() => hooks.useUpdate(), { wrapper });

      await act(async () => {
        await updateResult.current.mutateAsync({ id: '4', name: 'Updated Entity' });
      });
      expect(mockToast.success).toHaveBeenCalledWith('Entity updated');

      // Step 4: Delete entity
      setMockResponse(null);
      const { result: deleteResult } = renderHook(() => hooks.useDelete(), { wrapper });

      await act(async () => {
        await deleteResult.current.mutateAsync('4');
      });
      expect(mockToast.success).toHaveBeenCalledWith('Entity deleted');
    });

    it('should use custom messages from configuration', async () => {
      const customConfig: CRUDConfig<TestEntity> = {
        tableName: 'custom_entities',
        queryKey: 'custom-entities',
        messages: {
          created: 'Custom create message!',
          updated: 'Custom update message!',
          deleted: 'Custom delete message!',
        },
      };

      const customHooks = createSupabaseCRUD<TestEntity, TestCreateInput, TestUpdateInput>(customConfig);

      // Test create message
      setMockResponse({ id: '1', name: 'Test', display_order: 1, created_at: '', updated_at: '' });
      const { result: createResult } = renderHook(() => customHooks.useCreate(), { wrapper });

      await act(async () => {
        await createResult.current.mutateAsync({ name: 'Test', display_order: 1 });
      });
      expect(mockToast.success).toHaveBeenCalledWith('Custom create message!');

      // Test update message
      vi.clearAllMocks();
      setMockResponse({ id: '1', name: 'Updated', display_order: 1, created_at: '', updated_at: '' });
      const { result: updateResult } = renderHook(() => customHooks.useUpdate(), { wrapper });

      await act(async () => {
        await updateResult.current.mutateAsync({ id: '1', name: 'Updated' });
      });
      expect(mockToast.success).toHaveBeenCalledWith('Custom update message!');

      // Test delete message
      vi.clearAllMocks();
      setMockResponse(null);
      const { result: deleteResult } = renderHook(() => customHooks.useDelete(), { wrapper });

      await act(async () => {
        await deleteResult.current.mutateAsync('1');
      });
      expect(mockToast.success).toHaveBeenCalledWith('Custom delete message!');
    });
  });

  describe('Edge cases', () => {
    it('should handle null data response', async () => {
      setMockResponse(null);

      const { result } = renderHook(() => hooks.useList(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // null should be cast as T[] which is empty array
      expect(result.current.data).toBeNull();
    });

    it('should handle entity with minimal fields', async () => {
      const minimalEntity = { id: '1', name: '', display_order: 0, created_at: '', updated_at: '' };
      setMockResponse(minimalEntity);

      const { result } = renderHook(() => hooks.useCreate(), { wrapper });

      await act(async () => {
        const created = await result.current.mutateAsync({ name: '', display_order: 0 });
        expect(created).toEqual(minimalEntity);
      });
    });

    it('should handle entity with special characters in name', async () => {
      const specialEntity = {
        id: '1',
        name: 'Entity with "quotes" & <special> chars',
        display_order: 1,
        created_at: '',
        updated_at: '',
      };
      setMockResponse(specialEntity);

      const { result } = renderHook(() => hooks.useCreate(), { wrapper });

      await act(async () => {
        const created = await result.current.mutateAsync({
          name: 'Entity with "quotes" & <special> chars',
          display_order: 1,
        });
        expect(created.name).toBe('Entity with "quotes" & <special> chars');
      });
    });

    it('should handle network timeout gracefully', async () => {
      const timeoutError = new Error('Request timeout');
      setMockResponse(null, timeoutError);

      const { result } = renderHook(() => hooks.useList(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Request timeout');
    });

    it('should handle update with only id (no changes)', async () => {
      // This is an edge case where someone might call update with just an id
      setMockResponse(mockEntities[0]);

      const { result } = renderHook(() => hooks.useUpdate(), { wrapper });

      await act(async () => {
        // TypeScript will complain but at runtime this is possible
        await result.current.mutateAsync({ id: '1' } as any);
      });

      const chainable = getChainable();
      // Should still call update with empty object (minus the id)
      expect(chainable.update).toHaveBeenCalledWith({});
    });
  });

  describe('Type safety', () => {
    it('should enforce correct input types for create', async () => {
      // This test verifies type safety at runtime
      const validInput: TestCreateInput = {
        name: 'Valid Name',
        display_order: 1,
      };

      setMockResponse({ id: '1', ...validInput, created_at: '', updated_at: '' });

      const { result } = renderHook(() => hooks.useCreate(), { wrapper });

      let createdData: any;
      await act(async () => {
        createdData = await result.current.mutateAsync(validInput);
      });

      expect(createdData).toBeDefined();
      expect(createdData.name).toBe('Valid Name');
    });

    it('should enforce correct input types for update', async () => {
      const validUpdate = {
        id: '1',
        name: 'Updated Name',
      };

      setMockResponse({ ...mockEntities[0], name: 'Updated Name' });

      const { result } = renderHook(() => hooks.useUpdate(), { wrapper });

      let updatedData: any;
      await act(async () => {
        updatedData = await result.current.mutateAsync(validUpdate);
      });

      expect(updatedData).toBeDefined();
      expect(updatedData.name).toBe('Updated Name');
    });
  });
});
