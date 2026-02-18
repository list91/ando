import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LookbookImage {
  id: string;
  season_id: string;
  image_url: string;
  caption?: string;
  alt_text?: string;
  display_order: number;
  is_visible: boolean;
  photographer_credit?: string;
  created_at: string;
}

// Note: useLookbookImages has a seasonId filter parameter,
// which doesn't fit the simple CRUD factory pattern.
// Keeping manual implementation for this hook.

export const useLookbookImages = (seasonId?: string) => {
  return useQuery({
    queryKey: ['lookbook-images', seasonId],
    queryFn: async () => {
      let query = supabase
        .from('lookbook_images')
        .select('*')
        .order('display_order', { ascending: true });

      if (seasonId) {
        query = query.eq('season_id', seasonId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as LookbookImage[];
    },
  });
};

export const useCreateLookbookImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (image: Omit<LookbookImage, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('lookbook_images')
        .insert(image)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lookbook-images'] });
      toast.success('Изображение добавлено');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateLookbookImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LookbookImage> & { id: string }) => {
      const { data, error } = await supabase
        .from('lookbook_images')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lookbook-images'] });
      toast.success('Изображение обновлено');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteLookbookImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lookbook_images')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lookbook-images'] });
      toast.success('Изображение удалено');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};
