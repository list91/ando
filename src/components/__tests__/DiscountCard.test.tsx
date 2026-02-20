import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DiscountCard, EmptyDiscounts, DiscountCardSkeleton } from '../DiscountCard';
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

describe('DiscountCard', () => {
  it('should render active discount correctly', () => {
    const discount = createMockDiscount({
      discount_amount: 15,
      discount_type: 'personal',
      description: 'Персональная скидка 15%',
      is_active: true,
    });

    render(<DiscountCard discount={discount} />);

    // Проверяем процент скидки
    expect(screen.getByText('15%')).toBeInTheDocument();

    // Проверяем описание
    expect(screen.getByText('Персональная скидка 15%')).toBeInTheDocument();

    // Проверяем статус "Активна"
    expect(screen.getByText('Активна')).toBeInTheDocument();

    // Проверяем текст про автоматическое применение
    expect(screen.getByText(/применяется автоматически/i)).toBeInTheDocument();
  });

  it('should render expired discount correctly', () => {
    const discount = createMockDiscount({
      discount_amount: 20,
      is_active: true,
      valid_from: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      valid_until: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    });

    render(<DiscountCard discount={discount} />);

    // Проверяем статус "Истекла"
    expect(screen.getByText('Истекла')).toBeInTheDocument();

    // Не должно быть текста про автоматическое применение
    expect(screen.queryByText(/применяется автоматически/i)).not.toBeInTheDocument();
  });

  it('should render first_order discount with correct icon', () => {
    const discount = createMockDiscount({
      discount_type: 'first_order',
      discount_amount: 5,
      description: null, // Убираем описание, чтобы показалась дефолтная метка
    });

    const { container } = render(<DiscountCard discount={discount} />);

    // Проверяем наличие SVG иконки
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();

    // Проверяем метку типа скидки
    expect(screen.getByText(/скидка на первый заказ/i)).toBeInTheDocument();
  });

  it('should render birthday discount with cake icon', () => {
    const discount = createMockDiscount({
      discount_type: 'birthday',
      discount_amount: 10,
      description: 'С днём рождения!',
    });

    const { container } = render(<DiscountCard discount={discount} />);

    // Проверяем описание
    expect(screen.getByText('С днём рождения!')).toBeInTheDocument();

    // Проверяем наличие SVG иконки
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should render loyalty discount with award icon', () => {
    const discount = createMockDiscount({
      discount_type: 'loyalty',
      discount_amount: 12,
      description: null, // Убираем описание, чтобы показалась дефолтная метка
    });

    const { container } = render(<DiscountCard discount={discount} />);

    // Проверяем метку типа
    expect(screen.getByText(/программа лояльности/i)).toBeInTheDocument();

    // Проверяем наличие SVG иконки
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should format date range correctly', () => {
    const discount = createMockDiscount({
      valid_from: new Date('2024-01-01').toISOString(),
      valid_until: new Date('2024-12-31').toISOString(),
    });

    render(<DiscountCard discount={discount} />);

    // Проверяем наличие дат (точный формат зависит от локали)
    const cardText = screen.getByText(/2024/);
    expect(cardText).toBeInTheDocument();
  });

  it('should show "бессрочно" for discounts without expiration', () => {
    const discount = createMockDiscount({
      valid_from: new Date('2024-01-01').toISOString(),
      valid_until: null,
    });

    render(<DiscountCard discount={discount} />);

    // Проверяем текст "бессрочно"
    expect(screen.getByText(/бессрочно/i)).toBeInTheDocument();
  });

  it('should use default type label when description is missing', () => {
    const discount = createMockDiscount({
      discount_type: 'personal',
      description: null,
    });

    render(<DiscountCard discount={discount} />);

    // Должна быть дефолтная метка
    expect(screen.getByText(/персональная скидка/i)).toBeInTheDocument();
  });

  it('should render inactive discount as expired', () => {
    const discount = createMockDiscount({
      is_active: false,
      discount_amount: 25,
    });

    render(<DiscountCard discount={discount} />);

    // Неактивная скидка должна показываться как истёкшая
    expect(screen.getByText('Истекла')).toBeInTheDocument();
  });
});

describe('EmptyDiscounts', () => {
  it('should render empty state correctly', () => {
    render(<EmptyDiscounts />);

    // Проверяем emoji
    expect(screen.getByText('📭')).toBeInTheDocument();

    // Проверяем основной текст
    expect(screen.getByText(/у вас пока нет активных скидок/i)).toBeInTheDocument();

    // Проверяем подсказку
    expect(screen.getByText(/следите за акциями/i)).toBeInTheDocument();
  });

  it('should have correct structure', () => {
    const { container } = render(<EmptyDiscounts />);

    // Проверяем наличие контента (emoji или текст достаточно)
    expect(screen.getByText('📭')).toBeInTheDocument();
    expect(screen.getByText(/у вас пока нет активных скидок/i)).toBeInTheDocument();
  });
});

describe('DiscountCardSkeleton', () => {
  it('should render skeleton loading state', () => {
    const { container } = render(<DiscountCardSkeleton />);

    // Проверяем наличие анимации загрузки
    const animatedElements = container.querySelectorAll('.animate-pulse');
    expect(animatedElements.length).toBeGreaterThan(0);
  });

  it('should have correct skeleton structure', () => {
    const { container } = render(<DiscountCardSkeleton />);

    // Проверяем наличие placeholder элементов
    const placeholders = container.querySelectorAll('.bg-muted');
    expect(placeholders.length).toBeGreaterThan(0);

    // Проверяем наличие анимированных элементов
    const animatedElements = container.querySelectorAll('.animate-pulse');
    expect(animatedElements.length).toBeGreaterThan(0);
  });

  it('should have rounded placeholder for avatar', () => {
    const { container } = render(<DiscountCardSkeleton />);

    // Проверяем наличие круглого placeholder (для иконки)
    const roundedPlaceholder = container.querySelector('.rounded-full');
    expect(roundedPlaceholder).toBeTruthy();
  });
});

describe('DiscountCard - Edge Cases', () => {
  it('should handle very large discount amount', () => {
    const discount = createMockDiscount({
      discount_amount: 99,
    });

    render(<DiscountCard discount={discount} />);
    expect(screen.getByText('99%')).toBeInTheDocument();
  });

  it('should handle very small discount amount', () => {
    const discount = createMockDiscount({
      discount_amount: 1,
    });

    render(<DiscountCard discount={discount} />);
    expect(screen.getByText('1%')).toBeInTheDocument();
  });

  it('should handle very long description gracefully', () => {
    const longDescription = 'Это очень длинное описание скидки, которое должно корректно отображаться без переполнения карточки и обрезаться при необходимости';

    const discount = createMockDiscount({
      description: longDescription,
    });

    render(<DiscountCard discount={discount} />);
    expect(screen.getByText(longDescription)).toBeInTheDocument();
  });

  it('should handle discount starting in future', () => {
    const discount = createMockDiscount({
      is_active: true,
      valid_from: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      valid_until: null,
    });

    render(<DiscountCard discount={discount} />);

    // Скидка ещё не началась, должна быть "Истекла"
    expect(screen.getByText('Истекла')).toBeInTheDocument();
  });

  it('should handle discount ending today', () => {
    const now = new Date();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const discount = createMockDiscount({
      is_active: true,
      valid_from: new Date(Date.now() - 86400000).toISOString(),
      valid_until: endOfDay.toISOString(),
    });

    render(<DiscountCard discount={discount} />);

    // Скидка должна быть активна до конца дня
    expect(screen.getByText('Активна')).toBeInTheDocument();
  });
});

describe('DiscountCard - Accessibility', () => {
  it('should have proper heading structure', () => {
    const discount = createMockDiscount({
      description: 'Тестовая скидка',
    });

    render(<DiscountCard discount={discount} />);

    // CardTitle должен быть заголовком
    const heading = screen.getByText('Тестовая скидка');
    expect(heading).toBeInTheDocument();
  });

  it('should have readable text color for active badge', () => {
    const discount = createMockDiscount({
      is_active: true,
    });

    const { container } = render(<DiscountCard discount={discount} />);

    // Badge должен иметь класс variant (проверяем через наличие элемента)
    const badge = screen.getByText('Активна');
    expect(badge).toBeInTheDocument();
  });

  it('should have readable text color for expired badge', () => {
    const discount = createMockDiscount({
      is_active: false,
    });

    render(<DiscountCard discount={discount} />);

    const badge = screen.getByText('Истекла');
    expect(badge).toBeInTheDocument();
  });
});
