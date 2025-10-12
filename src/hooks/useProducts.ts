import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useProducts = (categoryId?: string | null, isSale?: boolean) => {
  return useQuery({
    queryKey: ['products', categoryId, isSale],
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

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      if (isSale) {
        query = query.eq('is_sale', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
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