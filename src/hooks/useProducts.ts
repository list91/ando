import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

export const useProducts = (filters?: ProductFilters) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      let query = supabase
        .from('products')
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

      if (error) throw error;
      
      // Client-side filtering for arrays
      let filteredData = data || [];
      
      if (filters?.materials && filters.materials.length > 0) {
        filteredData = filteredData.filter(product => 
          product.material && filters.materials!.includes(product.material)
        );
      }

      if (filters?.colors && filters.colors.length > 0) {
        filteredData = filteredData.filter(product =>
          product.available_colors && 
          product.available_colors.some((color: string) => filters.colors!.includes(color))
        );
      }

      if (filters?.sizes && filters.sizes.length > 0) {
        filteredData = filteredData.filter(product =>
          product.available_sizes && 
          product.available_sizes.some((size: string) => filters.sizes!.includes(size))
        );
      }

      return filteredData;
    },
  });
};

export const useProductFilters = () => {
  return useQuery({
    queryKey: ['product-filters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('material, available_colors, available_sizes, price');

      if (error) throw error;

      const materials = new Set<string>();
      const colors = new Set<string>();
      const sizes = new Set<string>();
      let minPrice = Infinity;
      let maxPrice = 0;

      data.forEach(product => {
        if (product.material) materials.add(product.material);
        if (product.available_colors) {
          product.available_colors.forEach((color: string) => colors.add(color));
        }
        if (product.available_sizes) {
          product.available_sizes.forEach((size: string) => sizes.add(size));
        }
        if (product.price) {
          minPrice = Math.min(minPrice, Number(product.price));
          maxPrice = Math.max(maxPrice, Number(product.price));
        }
      });

      return {
        materials: Array.from(materials).sort(),
        colors: Array.from(colors).sort(),
        sizes: Array.from(sizes).sort(),
        priceRange: { min: minPrice === Infinity ? 0 : minPrice, max: maxPrice }
      };
    },
  });
};

export const useProduct = (slug: string) => {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
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
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
};