import { createSupabaseCRUD } from './createSupabaseCRUD';

export interface LookbookSeason {
  id: string;
  season_name: string;
  slug: string;
  short_description?: string;
  cover_image_url?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Create CRUD hooks using factory
const lookbookSeasonsHooks = createSupabaseCRUD<LookbookSeason>({
  tableName: 'lookbook_seasons',
  queryKey: 'lookbook-seasons',
  messages: {
    created: 'Сезон создан',
    updated: 'Сезон обновлен',
    deleted: 'Сезон удален',
  },
  orderBy: { column: 'display_order', ascending: true },
});

// Export hooks with original names for backward compatibility
export const useLookbookSeasons = lookbookSeasonsHooks.useList;
export const useCreateLookbookSeason = lookbookSeasonsHooks.useCreate;
export const useUpdateLookbookSeason = lookbookSeasonsHooks.useUpdate;
export const useDeleteLookbookSeason = lookbookSeasonsHooks.useDelete;
