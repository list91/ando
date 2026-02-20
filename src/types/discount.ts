/**
 * Тип скидки
 */
export type DiscountType = 'first_order' | 'personal' | 'birthday' | 'loyalty';

/**
 * Скидка пользователя
 */
export interface UserDiscount {
  id: string;
  user_id: string;
  user_email?: string; // Email из profiles (для админки)
  discount_type: DiscountType;
  discount_amount: number;
  description: string | null;
  assigned_by_admin: string | null;
  is_active: boolean;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Промокод
 */
export interface PromoCode {
  id: string;
  code: string;
  discount_amount: number;
  is_active: boolean;
  max_uses: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
}

/**
 * DTO для создания скидки (админ)
 */
export interface CreateDiscountDTO {
  user_id: string;
  discount_type: DiscountType;
  discount_amount: number;
  description?: string;
  valid_until?: string;
}

/**
 * DTO для обновления скидки (админ)
 */
export interface UpdateDiscountDTO {
  discount_amount?: number;
  description?: string;
  is_active?: boolean;
  valid_until?: string;
}
