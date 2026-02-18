import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Configuration for CRUD factory
 */
export interface CRUDConfig<T> {
  /** Supabase table name */
  tableName: string;
  /** React Query cache key */
  queryKey: string;
  /** Toast messages (Russian) */
  messages: {
    created: string;
    updated: string;
    deleted: string;
  };
  /** Default order by field */
  orderBy?: {
    column: keyof T & string;
    ascending?: boolean;
  };
  /** Fields to omit from create payload (auto-generated) */
  omitOnCreate?: (keyof T)[];
  /** Fields to omit from update payload (immutable) */
  omitOnUpdate?: (keyof T)[];
}

/**
 * Return type of createSupabaseCRUD factory
 */
export interface CRUDHooks<T, CreateInput, UpdateInput> {
  useList: (options?: Partial<UseQueryOptions<T[], Error>>) => ReturnType<typeof useQuery<T[], Error>>;
  useCreate: () => ReturnType<typeof useMutation<T, Error, CreateInput>>;
  useUpdate: () => ReturnType<typeof useMutation<T, Error, UpdateInput & { id: string }>>;
  useDelete: () => ReturnType<typeof useMutation<void, Error, string>>;
}

/**
 * Factory to create standardized CRUD hooks for Supabase tables
 *
 * @example
 * ```ts
 * const heroSlidesHooks = createSupabaseCRUD<HeroSlide>({
 *   tableName: 'hero_slides',
 *   queryKey: 'hero-slides',
 *   messages: {
 *     created: 'Слайд создан',
 *     updated: 'Слайд обновлен',
 *     deleted: 'Слайд удален',
 *   },
 *   orderBy: { column: 'display_order', ascending: true },
 *   omitOnCreate: ['id', 'created_at', 'updated_at'],
 * });
 *
 * export const useHeroSlides = heroSlidesHooks.useList;
 * export const useCreateHeroSlide = heroSlidesHooks.useCreate;
 * export const useUpdateHeroSlide = heroSlidesHooks.useUpdate;
 * export const useDeleteHeroSlide = heroSlidesHooks.useDelete;
 * ```
 */
export function createSupabaseCRUD<
  T extends { id: string },
  CreateInput = Omit<T, 'id' | 'created_at' | 'updated_at'>,
  UpdateInput = Partial<T>
>(config: CRUDConfig<T>): CRUDHooks<T, CreateInput, UpdateInput> {
  const {
    tableName,
    queryKey,
    messages,
    orderBy,
  } = config;

  /**
   * Hook to fetch list of items
   */
  const useList = (options?: Partial<UseQueryOptions<T[], Error>>) => {
    return useQuery<T[], Error>({
      queryKey: [queryKey],
      queryFn: async () => {
        let query = supabase.from(tableName).select('*');

        if (orderBy) {
          query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
        }

        const { data, error } = await query;

        if (error) throw error;
        return data as T[];
      },
      ...options,
    });
  };

  /**
   * Hook to create new item
   */
  const useCreate = () => {
    const queryClient = useQueryClient();

    return useMutation<T, Error, CreateInput>({
      mutationFn: async (item) => {
        const { data, error } = await supabase
          .from(tableName)
          .insert(item as Record<string, unknown>)
          .select()
          .single();

        if (error) throw error;
        return data as T;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
        toast.success(messages.created);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  /**
   * Hook to update existing item
   */
  const useUpdate = () => {
    const queryClient = useQueryClient();

    return useMutation<T, Error, UpdateInput & { id: string }>({
      mutationFn: async ({ id, ...updates }) => {
        const { data, error } = await supabase
          .from(tableName)
          .update(updates as Record<string, unknown>)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data as T;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
        toast.success(messages.updated);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  /**
   * Hook to delete item by id
   */
  const useDelete = () => {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
      mutationFn: async (id) => {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', id);

        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
        toast.success(messages.deleted);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  return {
    useList,
    useCreate,
    useUpdate,
    useDelete,
  };
}
