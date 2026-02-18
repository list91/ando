import { BaseRepository, QueryOptions, RepositoryResult, RepositoryError } from './BaseRepository';
import type { Database } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['products']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];
type ProductUpdate = Database['public']['Tables']['products']['Update'];
type ProductImage = Database['public']['Tables']['product_images']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

/**
 * Product with related images
 */
export interface ProductWithImages extends Product {
  product_images: ProductImage[];
}

/**
 * Product with images and category
 */
export interface ProductWithRelations extends Product {
  product_images: ProductImage[];
  categories: Pick<Category, 'id' | 'name' | 'slug'> | null;
}

/**
 * Filter options for product queries
 */
export interface ProductFilters {
  categoryId?: string | null;
  gender?: string | null;
  isSale?: boolean;
  isNew?: boolean;
  materials?: string[];
  colors?: string[];
  sizes?: string[];
  minPrice?: number;
  maxPrice?: number;
}

/**
 * Available filter values from products
 */
export interface ProductFilterValues {
  materials: string[];
  colors: string[];
  sizes: string[];
  priceRange: { min: number; max: number };
}

/**
 * Repository for Product entity operations
 */
export class ProductRepository extends BaseRepository<'products'> {
  constructor() {
    super('products');
  }

  /**
   * Find all products with images
   */
  async findAllWithImages(
    options?: QueryOptions<Product>
  ): Promise<RepositoryResult<ProductWithImages[]>> {
    let query = this.supabase
      .from(this.tableName)
      .select(`
        *,
        product_images (
          id,
          image_url,
          alt_text,
          display_order
        )
      `)
      .order('display_order', { ascending: true })
      .order('display_order', { referencedTable: 'product_images', ascending: true });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: this.handleError(error) };
    }

    return { data: data as ProductWithImages[], error: null };
  }

  /**
   * Find products matching filters (database + client-side filtering)
   */
  async findByFilters(filters?: ProductFilters): Promise<RepositoryResult<ProductWithImages[]>> {
    let query = this.supabase
      .from(this.tableName)
      .select(`
        *,
        product_images (
          id,
          image_url,
          alt_text,
          display_order
        )
      `)
      .order('display_order', { ascending: true })
      .order('display_order', { referencedTable: 'product_images', ascending: true });

    // Database-level filters
    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }

    if (filters?.gender) {
      query = query.eq('gender', filters.gender);
    }

    if (filters?.isSale) {
      query = query.eq('is_sale', true);
    }

    if (filters?.isNew) {
      query = query.eq('is_new', true);
    }

    if (filters?.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice);
    }

    if (filters?.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: this.handleError(error) };
    }

    // Client-side array filtering
    let filteredData = (data as ProductWithImages[]) || [];

    if (filters?.materials && filters.materials.length > 0) {
      filteredData = filteredData.filter(
        (product) => product.material && filters.materials!.includes(product.material)
      );
    }

    if (filters?.colors && filters.colors.length > 0) {
      filteredData = filteredData.filter(
        (product) =>
          product.available_colors &&
          product.available_colors.some((color: string) => filters.colors!.includes(color))
      );
    }

    if (filters?.sizes && filters.sizes.length > 0) {
      filteredData = filteredData.filter((product) => {
        // Use size_quantities if available, fallback to available_sizes
        if (product.size_quantities && typeof product.size_quantities === 'object') {
          const sizeQty = product.size_quantities as Record<string, number>;
          return filters.sizes!.some((size) => (sizeQty[size] || 0) > 0);
        }
        // Fallback for legacy data
        return (
          product.available_sizes &&
          product.available_sizes.some((size: string) => filters.sizes!.includes(size))
        );
      });
    }

    return { data: filteredData, error: null };
  }

  /**
   * Find product by slug with full relations
   */
  async findBySlug(slug: string): Promise<RepositoryResult<ProductWithRelations | null>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        product_images (
          id,
          image_url,
          alt_text,
          display_order
        ),
        categories (
          id,
          name,
          slug
        )
      `)
      .eq('slug', slug)
      .order('display_order', { referencedTable: 'product_images', ascending: true })
      .maybeSingle();

    if (error) {
      return { data: null, error: this.handleError(error) };
    }

    return { data: data as ProductWithRelations | null, error: null };
  }

  /**
   * Find products by category ID
   */
  async findByCategory(
    categoryId: string,
    options?: QueryOptions<Product>
  ): Promise<RepositoryResult<ProductWithImages[]>> {
    let query = this.supabase
      .from(this.tableName)
      .select(`
        *,
        product_images (
          id,
          image_url,
          alt_text,
          display_order
        )
      `)
      .eq('category_id', categoryId)
      .order('display_order', { ascending: true });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: this.handleError(error) };
    }

    return { data: data as ProductWithImages[], error: null };
  }

  /**
   * Search products by name (case-insensitive)
   */
  async searchByName(
    searchQuery: string,
    limit: number = 20
  ): Promise<RepositoryResult<ProductWithImages[]>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        product_images (
          id,
          image_url,
          alt_text,
          display_order
        )
      `)
      .ilike('name', `%${searchQuery}%`)
      .order('display_order', { ascending: true })
      .limit(limit);

    if (error) {
      return { data: null, error: this.handleError(error) };
    }

    return { data: data as ProductWithImages[], error: null };
  }

  /**
   * Get available filter values from all products
   */
  async getFilterValues(): Promise<RepositoryResult<ProductFilterValues>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('material, available_colors, available_sizes, size_quantities, price');

    if (error) {
      return { data: null, error: this.handleError(error) };
    }

    const materials = new Set<string>();
    const colors = new Set<string>();
    const sizes = new Set<string>();
    let minPrice = Infinity;
    let maxPrice = 0;

    (data || []).forEach((product) => {
      if (product.material) materials.add(product.material);
      if (product.available_colors) {
        product.available_colors.forEach((color: string) => colors.add(color));
      }

      // Get sizes with quantity > 0 from size_quantities
      const sizeQty = (product.size_quantities as Record<string, number>) || {};
      const hasQtyData = Object.keys(sizeQty).length > 0;

      if (hasQtyData) {
        Object.entries(sizeQty).forEach(([size, qty]) => {
          if (qty > 0) sizes.add(size);
        });
      } else if (product.available_sizes) {
        // Fallback for legacy data
        product.available_sizes.forEach((size: string) => sizes.add(size));
      }

      if (product.price) {
        minPrice = Math.min(minPrice, Number(product.price));
        maxPrice = Math.max(maxPrice, Number(product.price));
      }
    });

    return {
      data: {
        materials: Array.from(materials).sort(),
        colors: Array.from(colors).sort(),
        sizes: Array.from(sizes),
        priceRange: { min: minPrice === Infinity ? 0 : minPrice, max: maxPrice }
      },
      error: null
    };
  }

  /**
   * Find new products
   */
  async findNew(limit: number = 10): Promise<RepositoryResult<ProductWithImages[]>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        product_images (
          id,
          image_url,
          alt_text,
          display_order
        )
      `)
      .eq('is_new', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { data: null, error: this.handleError(error) };
    }

    return { data: data as ProductWithImages[], error: null };
  }

  /**
   * Find products on sale
   */
  async findOnSale(limit: number = 10): Promise<RepositoryResult<ProductWithImages[]>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        product_images (
          id,
          image_url,
          alt_text,
          display_order
        )
      `)
      .eq('is_sale', true)
      .order('display_order', { ascending: true })
      .limit(limit);

    if (error) {
      return { data: null, error: this.handleError(error) };
    }

    return { data: data as ProductWithImages[], error: null };
  }
}

// Singleton instance for convenience
export const productRepository = new ProductRepository();
