import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface InfoPage {
  id: string;
  page_key: string;
  title: string;
  content: string;
  image_url?: string | null;
  display_order: number;
  is_visible: boolean;
  updated_at: string;
  created_at: string;
}

export const useInfoPages = () => {
  return useQuery({
    queryKey: ['info-pages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('info_pages')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as InfoPage[];
    },
  });
};

export const useInfoPage = (pageKey: string) => {
  return useQuery({
    queryKey: ['info-page', pageKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('info_pages')
        .select('*')
        .eq('page_key', pageKey)
        .single();

      if (error) throw error;
      return data as InfoPage;
    },
    enabled: !!pageKey,
  });
};

export const useCreateInfoPage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (page: Omit<InfoPage, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('info_pages')
        .insert(page)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['info-pages'] });
      toast({
        title: 'Успешно',
        description: 'Страница создана',
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

export const useUpdateInfoPage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InfoPage> & { id: string }) => {
      const { data, error } = await supabase
        .from('info_pages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['info-pages'] });
      toast({
        title: 'Успешно',
        description: 'Страница обновлена',
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

export const useDeleteInfoPage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('info_pages')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['info-pages'] });
      toast({
        title: 'Успешно',
        description: 'Страница удалена',
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
