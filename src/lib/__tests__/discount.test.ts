import { describe, it, expect } from 'vitest';
import {
  calculateDiscountedPrice,
  isDiscountValid,
  getBestDiscount,
  formatDiscount,
  getDiscountTypeLabel,
  calculateSavings,
  canCombineDiscounts,
} from '../discount';
import type { UserDiscount } from '@/types/discount';

// Mock data factory
const createMockDiscount = (overrides: Partial<UserDiscount> = {}): UserDiscount => ({
  id: 'discount-1',
  user_id: 'user-1',
  discount_type: 'personal',
  discount_amount: 10,
  description: 'Test discount',
  assigned_by_admin: 'admin-1',
  is_active: true,
  valid_from: new Date().toISOString(),
  valid_until: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

describe('calculateDiscountedPrice', () => {
  it('should calculate correct discounted price', () => {
    expect(calculateDiscountedPrice(100, 10)).toBe(90);
    expect(calculateDiscountedPrice(100, 25)).toBe(75);
    expect(calculateDiscountedPrice(100, 50)).toBe(50);
  });

  it('should handle decimal prices correctly', () => {
    expect(calculateDiscountedPrice(99.99, 10)).toBe(89.99);
    expect(calculateDiscountedPrice(49.95, 20)).toBe(39.96);
  });

  it('should round to 2 decimal places', () => {
    const result = calculateDiscountedPrice(33.33, 15);
    expect(result).toBe(28.33);
  });

  it('should handle 0% discount', () => {
    expect(calculateDiscountedPrice(100, 0)).toBe(100);
  });

  it('should handle 100% discount', () => {
    expect(calculateDiscountedPrice(100, 100)).toBe(0);
  });

  it('should throw error for negative discount', () => {
    expect(() => calculateDiscountedPrice(100, -10)).toThrow('Скидка должна быть в диапазоне 0-100%');
  });

  it('should throw error for discount > 100%', () => {
    expect(() => calculateDiscountedPrice(100, 150)).toThrow('Скидка должна быть в диапазоне 0-100%');
  });
});

describe('isDiscountValid', () => {
  it('should return true for active discount without expiration', () => {
    const discount = createMockDiscount({
      is_active: true,
      valid_from: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      valid_until: null,
    });

    expect(isDiscountValid(discount)).toBe(true);
  });

  it('should return false for inactive discount', () => {
    const discount = createMockDiscount({
      is_active: false,
    });

    expect(isDiscountValid(discount)).toBe(false);
  });

  it('should return false for discount not yet valid', () => {
    const discount = createMockDiscount({
      is_active: true,
      valid_from: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      valid_until: null,
    });

    expect(isDiscountValid(discount)).toBe(false);
  });

  it('should return true for discount within valid period', () => {
    const discount = createMockDiscount({
      is_active: true,
      valid_from: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      valid_until: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    });

    expect(isDiscountValid(discount)).toBe(true);
  });

  it('should return false for expired discount', () => {
    const discount = createMockDiscount({
      is_active: true,
      valid_from: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      valid_until: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    });

    expect(isDiscountValid(discount)).toBe(false);
  });
});

describe('getBestDiscount', () => {
  it('should return discount with highest amount', () => {
    const discounts: UserDiscount[] = [
      createMockDiscount({ id: '1', discount_amount: 10 }),
      createMockDiscount({ id: '2', discount_amount: 25 }),
      createMockDiscount({ id: '3', discount_amount: 15 }),
    ];

    const best = getBestDiscount(discounts);
    expect(best?.discount_amount).toBe(25);
    expect(best?.id).toBe('2');
  });

  it('should return null for empty array', () => {
    expect(getBestDiscount([])).toBeNull();
  });

  it('should ignore invalid discounts', () => {
    const discounts: UserDiscount[] = [
      createMockDiscount({ id: '1', discount_amount: 30, is_active: false }), // Invalid
      createMockDiscount({ id: '2', discount_amount: 10, is_active: true }),
      createMockDiscount({ id: '3', discount_amount: 15, is_active: true }),
    ];

    const best = getBestDiscount(discounts);
    expect(best?.discount_amount).toBe(15);
    expect(best?.id).toBe('3');
  });

  it('should return null when all discounts are invalid', () => {
    const discounts: UserDiscount[] = [
      createMockDiscount({ is_active: false }),
      createMockDiscount({ is_active: false }),
    ];

    expect(getBestDiscount(discounts)).toBeNull();
  });

  it('should handle single discount', () => {
    const discounts: UserDiscount[] = [
      createMockDiscount({ discount_amount: 20 }),
    ];

    const best = getBestDiscount(discounts);
    expect(best?.discount_amount).toBe(20);
  });
});

describe('formatDiscount', () => {
  it('should format integer discount', () => {
    expect(formatDiscount(10)).toBe('10%');
    expect(formatDiscount(25)).toBe('25%');
    expect(formatDiscount(100)).toBe('100%');
  });

  it('should format decimal discount', () => {
    expect(formatDiscount(15.5)).toBe('15.5%');
    expect(formatDiscount(7.25)).toBe('7.25%');
  });

  it('should format zero discount', () => {
    expect(formatDiscount(0)).toBe('0%');
  });
});

describe('getDiscountTypeLabel', () => {
  it('should return correct label for first_order', () => {
    expect(getDiscountTypeLabel('first_order')).toBe('Скидка на первый заказ');
  });

  it('should return correct label for personal', () => {
    expect(getDiscountTypeLabel('personal')).toBe('Персональная скидка');
  });

  it('should return correct label for birthday', () => {
    expect(getDiscountTypeLabel('birthday')).toBe('Скидка на день рождения');
  });

  it('should return correct label for loyalty', () => {
    expect(getDiscountTypeLabel('loyalty')).toBe('Программа лояльности');
  });
});

describe('calculateSavings', () => {
  it('should calculate correct savings amount', () => {
    expect(calculateSavings(100, 10)).toBe(10);
    expect(calculateSavings(100, 25)).toBe(25);
    expect(calculateSavings(100, 50)).toBe(50);
  });

  it('should handle decimal prices', () => {
    expect(calculateSavings(99.99, 10)).toBe(10);
    expect(calculateSavings(49.95, 20)).toBe(9.99);
  });

  it('should round to 2 decimal places', () => {
    const savings = calculateSavings(33.33, 15);
    expect(savings).toBe(5);
  });

  it('should return 0 for 0% discount', () => {
    expect(calculateSavings(100, 0)).toBe(0);
  });

  it('should return full price for 100% discount', () => {
    expect(calculateSavings(100, 100)).toBe(100);
  });
});

describe('canCombineDiscounts', () => {
  it('should return false by default (no combining)', () => {
    const discounts: UserDiscount[] = [
      createMockDiscount({ discount_amount: 10 }),
      createMockDiscount({ discount_amount: 15 }),
    ];

    expect(canCombineDiscounts(discounts)).toBe(false);
  });

  it('should return false for single discount', () => {
    const discounts: UserDiscount[] = [
      createMockDiscount({ discount_amount: 10 }),
    ];

    expect(canCombineDiscounts(discounts)).toBe(false);
  });

  it('should return false for empty array', () => {
    expect(canCombineDiscounts([])).toBe(false);
  });
});

describe('Edge Cases', () => {
  it('calculateDiscountedPrice should handle very small amounts', () => {
    expect(calculateDiscountedPrice(0.01, 50)).toBe(0.01);
  });

  it('calculateDiscountedPrice should handle very large amounts', () => {
    expect(calculateDiscountedPrice(1000000, 10)).toBe(900000);
  });

  it('isDiscountValid should handle timestamps at exact boundaries', () => {
    const now = Date.now();
    const discount = createMockDiscount({
      is_active: true,
      valid_from: new Date(now).toISOString(),
      valid_until: new Date(now + 1000).toISOString(), // 1 second in future
    });

    // Should be valid at the exact start time
    expect(isDiscountValid(discount)).toBe(true);
  });

  it('getBestDiscount should handle equal discount amounts', () => {
    const discounts: UserDiscount[] = [
      createMockDiscount({ id: '1', discount_amount: 20 }),
      createMockDiscount({ id: '2', discount_amount: 20 }),
      createMockDiscount({ id: '3', discount_amount: 20 }),
    ];

    const best = getBestDiscount(discounts);
    expect(best?.discount_amount).toBe(20);
    // Should return first one found (reduce behavior)
    expect(best?.id).toBe('1');
  });
});
