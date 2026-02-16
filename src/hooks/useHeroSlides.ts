import { createSupabaseCRUD } from './createSupabaseCRUD';

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  image_url_tablet: string | null;
  image_url_mobile: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Create CRUD hooks using factory
const heroSlidesHooks = createSupabaseCRUD<HeroSlide>({
  tableName: 'hero_slides',
  queryKey: 'hero-slides',
  messages: {
    created: 'Слайд создан',
    updated: 'Слайд обновлен',
    deleted: 'Слайд удален',
  },
  orderBy: { column: 'display_order', ascending: true },
});

// Export hooks with original names for backward compatibility
export const useHeroSlides = heroSlidesHooks.useList;
export const useCreateHeroSlide = heroSlidesHooks.useCreate;
export const useUpdateHeroSlide = heroSlidesHooks.useUpdate;
export const useDeleteHeroSlide = heroSlidesHooks.useDelete;
