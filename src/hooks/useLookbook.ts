import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

export const useLookbookSeasons = () => {
  return useQuery({
    queryKey: ['lookbook-seasons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lookbook_seasons')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as LookbookSeason[];
    },
  });
};

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

export const useCreateLookbookSeason = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (season: Omit<LookbookSeason, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('lookbook_seasons')
        .insert(season)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lookbook-seasons'] });
      toast({
        title: 'Успешно',
        description: 'Сезон создан',
      });
    },
    onError: (error) => {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateLookbookSeason = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LookbookSeason> & { id: string }) => {
      const { data, error } = await supabase
        .from('lookbook_seasons')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lookbook-seasons'] });
      toast({
        title: 'Успешно',
        description: 'Сезон обновлен',
      });
    },
    onError: (error) => {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteLookbookSeason = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lookbook_seasons')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lookbook-seasons'] });
      toast({
        title: 'Успешно',
        description: 'Сезон удален',
      });
    },
    onError: (error) => {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
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
      toast({
        title: 'Успешно',
        description: 'Изображение добавлено',
      });
    },
    onError: (error) => {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
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
      toast({
        title: 'Успешно',
        description: 'Изображение обновлено',
      });
    },
    onError: (error) => {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
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
      toast({
        title: 'Успешно',
        description: 'Изображение удалено',
      });
    },
    onError: (error) => {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
