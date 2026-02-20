import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { UserDiscount, PromoCode, CreateDiscountDTO, UpdateDiscountDTO } from '@/types/discount';

/**
 * Hook для получения активных скидок текущего пользователя
 */
export const useUserDiscounts = () => {
  return useQuery({
    queryKey: ['user-discounts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Пользователь не авторизован');

      const { data, error } = await supabase
        .from('user_discounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('discount_amount', { ascending: false });

      if (error) throw error;
      return data as UserDiscount[];
    }
  });
};

/**
 * Hook для получения всех скидок с email пользователя (только для админов)
 */
export const useAdminDiscounts = () => {
  return useQuery({
    queryKey: ['admin-discounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_discounts')
        .select(`
          *,
          profiles:user_id (email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Трансформируем данные, добавляя user_email
      return (data || []).map((item: any) => ({
        ...item,
        user_email: item.profiles?.email || null,
        profiles: undefined, // Убираем вложенный объект
      })) as UserDiscount[];
    }
  });
};

/**
 * Hook для поиска пользователя по email
 */
export const useFindUserByEmail = () => {
  return useMutation<{ id: string; email: string } | null, Error, string>({
    mutationFn: async (email) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email')
        .ilike('email', email.trim())
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
};

/**
 * Hook для создания скидки (только для админов)
 */
export const useCreateDiscount = () => {
  const queryClient = useQueryClient();

  return useMutation<UserDiscount, Error, CreateDiscountDTO>({
    mutationFn: async (dto) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Пользователь не авторизован');

      const { data, error } = await supabase
        .from('user_discounts')
        .insert({
          ...dto,
          assigned_by_admin: user.id,
          is_active: true,
          valid_from: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as UserDiscount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-discounts'] });
      queryClient.invalidateQueries({ queryKey: ['user-discounts'] });
      toast.success('Скидка создана');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

/**
 * Hook для обновления скидки (только для админов)
 */
export const useUpdateDiscount = () => {
  const queryClient = useQueryClient();

  return useMutation<UserDiscount, Error, UpdateDiscountDTO & { id: string }>({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('user_discounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as UserDiscount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-discounts'] });
      queryClient.invalidateQueries({ queryKey: ['user-discounts'] });
      toast.success('Скидка обновлена');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

/**
 * Hook для удаления скидки (только для админов)
 */
export const useDeleteDiscount = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('user_discounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-discounts'] });
      queryClient.invalidateQueries({ queryKey: ['user-discounts'] });
      toast.success('Скидка удалена');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

/**
 * Hook для валидации промокода
 */
export const useValidatePromoCode = () => {
  return useMutation<PromoCode, Error, string>({
    mutationFn: async (code) => {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (error) throw new Error('Промокод не найден или неактивен');

      const promoCode = data as PromoCode;

      // Проверка срока действия
      const now = new Date();
      const validFrom = new Date(promoCode.valid_from);
      const validUntil = promoCode.valid_until ? new Date(promoCode.valid_until) : null;

      if (now < validFrom) {
        throw new Error('Промокод еще не активен');
      }

      if (validUntil && now > validUntil) {
        throw new Error('Срок действия промокода истек');
      }

      // Проверка лимита использований
      if (promoCode.max_uses !== null && promoCode.used_count >= promoCode.max_uses) {
        throw new Error('Промокод исчерпан');
      }

      return promoCode;
    },
    onSuccess: (promoCode) => {
      toast.success(`Промокод применен: ${promoCode.discount_amount}% скидка`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

/**
 * Hook для получения списка промокодов (админ)
 */
export const usePromoCodes = () => {
  return useQuery({
    queryKey: ['promo-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PromoCode[];
    }
  });
};
