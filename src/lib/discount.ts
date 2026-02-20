import type { UserDiscount } from '@/types/discount';

/**
 * Вычисляет цену со скидкой
 *
 * @param price - Исходная цена
 * @param discount - Процент скидки (0-100)
 * @returns Цена со скидкой, округленная до 2 знаков
 */
export function calculateDiscountedPrice(price: number, discount: number): number {
  if (discount < 0 || discount > 100) {
    throw new Error('Скидка должна быть в диапазоне 0-100%');
  }

  const discountedPrice = price * (1 - discount / 100);
  return Math.round(discountedPrice * 100) / 100;
}

/**
 * Проверяет, является ли скидка действительной на текущий момент
 *
 * @param discount - Скидка для проверки
 * @returns true, если скидка активна и в пределах срока действия
 */
export function isDiscountValid(discount: UserDiscount): boolean {
  if (!discount.is_active) {
    return false;
  }

  const now = new Date();
  const validFrom = new Date(discount.valid_from);

  if (now < validFrom) {
    return false;
  }

  if (discount.valid_until) {
    const validUntil = new Date(discount.valid_until);
    if (now > validUntil) {
      return false;
    }
  }

  return true;
}

/**
 * Возвращает лучшую (максимальную) действительную скидку из списка
 *
 * @param discounts - Массив скидок
 * @returns Скидка с максимальным процентом или null, если нет действительных скидок
 */
export function getBestDiscount(discounts: UserDiscount[]): UserDiscount | null {
  const validDiscounts = discounts.filter(isDiscountValid);

  if (validDiscounts.length === 0) {
    return null;
  }

  return validDiscounts.reduce((best, current) =>
    current.discount_amount > best.discount_amount ? current : best
  );
}

/**
 * Форматирует процент скидки для отображения
 *
 * @param discount - Процент скидки
 * @returns Отформатированная строка (например, "15%")
 */
export function formatDiscount(discount: number): string {
  return `${discount}%`;
}

/**
 * Возвращает описание типа скидки на русском
 *
 * @param type - Тип скидки
 * @returns Описание типа скидки
 */
export function getDiscountTypeLabel(type: UserDiscount['discount_type']): string {
  const labels: Record<UserDiscount['discount_type'], string> = {
    first_order: 'Скидка на первый заказ',
    personal: 'Персональная скидка',
    birthday: 'Скидка на день рождения',
    loyalty: 'Программа лояльности',
  };

  return labels[type] || type;
}

/**
 * Вычисляет сумму экономии от скидки
 *
 * @param price - Исходная цена
 * @param discount - Процент скидки (0-100)
 * @returns Сумма экономии
 */
export function calculateSavings(price: number, discount: number): number {
  const discountedPrice = calculateDiscountedPrice(price, discount);
  return Math.round((price - discountedPrice) * 100) / 100;
}

/**
 * Проверяет, можно ли комбинировать скидки
 *
 * @param discounts - Массив скидок для проверки
 * @returns true, если скидки можно комбинировать
 */
export function canCombineDiscounts(discounts: UserDiscount[]): boolean {
  // По умолчанию запрещаем комбинирование скидок
  // В будущем можно добавить логику комбинирования
  return false;
}
