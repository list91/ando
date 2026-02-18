import { BaseRepository, QueryOptions, RepositoryResult } from './BaseRepository';
import type { Database } from '@/integrations/supabase/types';

type Category = Database['public']['Tables']['categories']['Row'];
type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
type CategoryUpdate = Database['public']['Tables']['categories']['Update'];

/**
 * Category with product count
 */
export interface CategoryWithCount extends Category {
  product_count: number;
}

/**
 * Repository for Category entity operations
 */
export class CategoryRepository extends BaseRepository<'categories'> {
  constructor() {
    super('categories');
  }

  /**
   * Find all categories ordered by display_order
   */
  async findAllOrdered(): Promise<RepositoryResult<Category[]>> {
    return this.findAll({
      orderBy: { column: 'display_order', ascending: true }
    });
  }

  /**
   * Find category by slug
   */
  async findBySlug(slug: string): Promise<RepositoryResult<Category | null>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      return { data: null, error: this.handleError(error) };
    }

    return { data: data as Category | null, error: null };
  }

  /**
   * Find category by name (case-insensitive)
   */
  async findByName(name: string): Promise<RepositoryResult<Category | null>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .ilike('name', name)
      .maybeSingle();

    if (error) {
      return { data: null, error: this.handleError(error) };
    }

    return { data: data as Category | null, error: null };
  }

  /**
   * Get all categories with product counts
   */
  async findAllWithProductCounts(): Promise<RepositoryResult<CategoryWithCount[]>> {
    // Get categories
    const { data: categories, error: catError } = await this.supabase
      .from(this.tableName)
      .select('*')
      .order('display_order', { ascending: true });

    if (catError) {
      return { data: null, error: this.handleError(catError) };
    }

    // Get product counts per category
    const { data: products, error: prodError } = await this.supabase
      .from('products')
      .select('category_id');

    if (prodError) {
      return { data: null, error: this.handleError(prodError) };
    }

    // Count products per category
    const countMap = new Map<string, number>();
    (products || []).forEach((p) => {
      if (p.category_id) {
        countMap.set(p.category_id, (countMap.get(p.category_id) || 0) + 1);
      }
    });

    const result: CategoryWithCount[] = (categories || []).map((cat) => ({
      ...cat,
      product_count: countMap.get(cat.id) || 0
    }));

    return { data: result, error: null };
  }

  /**
   * Check if slug is unique (for validation)
   */
  async isSlugUnique(slug: string, excludeId?: string): Promise<RepositoryResult<boolean>> {
    let query = this.supabase
      .from(this.tableName)
      .select('id')
      .eq('slug', slug);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      return { data: null, error: this.handleError(error) };
    }

    return { data: data === null, error: null };
  }

  /**
   * Get maximum display order
   */
  async getMaxDisplayOrder(): Promise<RepositoryResult<number>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return { data: null, error: this.handleError(error) };
    }

    return { data: data?.display_order ?? 0, error: null };
  }

  /**
   * Reorder categories
   */
  async reorder(orderedIds: string[]): Promise<RepositoryResult<void>> {
    // Update each category with new display_order
    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await this.supabase
        .from(this.tableName)
        .update({ display_order: i + 1 })
        .eq('id', orderedIds[i]);

      if (error) {
        return { data: null, error: this.handleError(error) };
      }
    }

    return { data: undefined, error: null };
  }
}

// Singleton instance for convenience
export const categoryRepository = new CategoryRepository();
