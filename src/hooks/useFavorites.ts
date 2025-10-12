import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Favorite {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export const useFavorites = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data as Favorite[];
    },
    enabled: !!user,
  });

  const addToFavorites = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) {
        throw new Error('Необходима авторизация');
      }

      const { data, error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, product_id: productId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
      toast({
        title: 'Добавлено в избранное',
        duration: 2000,
      });
    },
    onError: (error: any) => {
      if (error.message === 'Необходима авторизация') {
        toast({
          title: 'Требуется авторизация',
          description: 'Войдите или зарегистрируйтесь для добавления в избранное',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Ошибка',
          description: 'Не удалось добавить в избранное',
          variant: 'destructive',
        });
      }
    },
  });

  const removeFromFavorites = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error('Необходима авторизация');

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
      toast({
        title: 'Удалено из избранного',
        duration: 2000,
      });
    },
    onError: () => {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить из избранного',
        variant: 'destructive',
      });
    },
  });

  const isFavorite = (productId: string) => {
    return favorites.some((fav) => fav.product_id === productId);
  };

  const toggleFavorite = async (productId: string) => {
    if (!user) {
      toast({
        title: 'Требуется авторизация',
        description: 'Войдите или зарегистрируйтесь для добавления в избранное',
        variant: 'destructive',
      });
      return;
    }

    if (isFavorite(productId)) {
      await removeFromFavorites.mutateAsync(productId);
    } else {
      await addToFavorites.mutateAsync(productId);
    }
  };

  return {
    favorites,
    isLoading,
    isFavorite,
    toggleFavorite,
    addToFavorites: addToFavorites.mutate,
    removeFromFavorites: removeFromFavorites.mutate,
  };
};
