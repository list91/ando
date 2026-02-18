import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// Mock data stores
const mockUser = vi.hoisted(() => ({
  user: null as { id: string; email: string } | null,
}));

const mockCart = vi.hoisted(() => ({
  items: [] as any[],
  totalPrice: 0,
}));

const mockToast = vi.hoisted(() => ({
  toast: vi.fn(),
}));

const mockNavigate = vi.fn();

const mockSupabaseData = vi.hoisted(() => ({
  profileData: null as any,
  orderInsertError: null as Error | null,
  orderItemsInsertError: null as Error | null,
  insertedOrder: { id: 'order-1' },
}));

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockImplementation(() =>
            Promise.resolve({ data: mockSupabaseData.profileData, error: null })
          ),
        };
      }
      if (table === 'orders') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockImplementation(() =>
                Promise.resolve({
                  data: mockSupabaseData.insertedOrder,
                  error: mockSupabaseData.orderInsertError,
                })
              ),
            }),
          }),
        };
      }
      if (table === 'order_items') {
        return {
          insert: vi.fn().mockImplementation(() =>
            Promise.resolve({ error: mockSupabaseData.orderItemsInsertError })
          ),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(() => Promise.resolve({ data: null, error: null })),
      };
    }),
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUser,
}));

vi.mock('@/contexts/CartContext', () => ({
  useCart: () => mockCart,
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => mockToast,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock fetch for email notification
global.fetch = vi.fn().mockResolvedValue({ ok: true });

import Checkout from '../Checkout';

const renderCheckout = () => {
  return render(
    <MemoryRouter>
      <Checkout />
    </MemoryRouter>
  );
};

describe('Checkout Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser.user = null;
    mockCart.items = [
      {
        id: 'prod-1',
        name: 'Test Product',
        price: 1000,
        quantity: 2,
        size: 'M',
        color: 'black',
        image: '/img.jpg',
      },
    ];
    mockCart.totalPrice = 2000;
    mockSupabaseData.profileData = null;
    mockSupabaseData.orderInsertError = null;
    mockSupabaseData.orderItemsInsertError = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Empty Cart Redirect', () => {
    it('should redirect to catalog when cart is empty', async () => {
      mockCart.items = [];
      mockCart.totalPrice = 0;

      renderCheckout();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/catalog');
      });
    });
  });

  describe('Initial Render', () => {
    it('should render checkout form', () => {
      renderCheckout();

      expect(screen.getByText('Оформление заказа')).toBeInTheDocument();
    });

    it('should render contact information section', () => {
      renderCheckout();

      expect(screen.getByText('Контактная информация')).toBeInTheDocument();
      expect(screen.getByLabelText(/Имя/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Фамилия/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Телефон/)).toBeInTheDocument();
    });

    it('should render delivery section', () => {
      renderCheckout();

      expect(screen.getByText('Доставка')).toBeInTheDocument();
      expect(screen.getByLabelText(/Курьер/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Самовывоз/)).toBeInTheDocument();
    });

    it('should render payment section', () => {
      renderCheckout();

      expect(screen.getByText('Оплата')).toBeInTheDocument();
      expect(screen.getByLabelText(/Банковская карта/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Наличные при получении/)).toBeInTheDocument();
    });

    it('should render consent checkboxes', () => {
      renderCheckout();

      expect(screen.getByText('Согласия')).toBeInTheDocument();
      expect(screen.getByLabelText(/обработку персональных данных/)).toBeInTheDocument();
      expect(screen.getByLabelText(/передачу данных третьим лицам/)).toBeInTheDocument();
      expect(screen.getByLabelText(/новости и специальные предложения/)).toBeInTheDocument();
    });

    it('should render order summary', () => {
      renderCheckout();

      expect(screen.getByText('Ваш заказ')).toBeInTheDocument();
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      // Price is displayed in multiple places
      expect(screen.getAllByText(/₽/).length).toBeGreaterThan(0);
    });
  });

  describe('Guest User Prompts', () => {
    it('should show login prompt for guests', () => {
      mockUser.user = null;

      renderCheckout();

      expect(screen.getByText('Уже есть аккаунт?')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Войти' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Регистрация' })).toBeInTheDocument();
    });

    it('should show registration promo for guests', () => {
      mockUser.user = null;

      renderCheckout();

      expect(
        screen.getByText(/Зарегистрируйтесь и получите скидку 5%/)
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Получить скидку' })).toBeInTheDocument();
    });

    it('should hide promo on close button click', async () => {
      mockUser.user = null;

      renderCheckout();

      const closeButton = screen.getByLabelText('Закрыть');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(
          screen.queryByText(/Зарегистрируйтесь и получите скидку/)
        ).not.toBeInTheDocument();
      });
    });

    it('should not show prompts for logged in users', () => {
      mockUser.user = { id: 'user-1', email: 'test@test.com' };

      renderCheckout();

      expect(screen.queryByText('Уже есть аккаунт?')).not.toBeInTheDocument();
      expect(
        screen.queryByText(/Зарегистрируйтесь и получите скидку/)
      ).not.toBeInTheDocument();
    });
  });

  describe('Form Prefill for Logged Users', () => {
    it('should prefill form from profile data', async () => {
      mockUser.user = { id: 'user-1', email: 'user@test.com' };
      mockSupabaseData.profileData = {
        full_name: 'John Doe',
        email: 'profile@test.com',
        phone: '+79991234567',
      };

      renderCheckout();

      await waitFor(() => {
        expect(screen.getByLabelText(/Имя/)).toHaveValue('John');
        expect(screen.getByLabelText(/Фамилия/)).toHaveValue('Doe');
        expect(screen.getByLabelText(/Email/)).toHaveValue('profile@test.com');
        expect(screen.getByLabelText(/Телефон/)).toHaveValue('+79991234567');
      });
    });
  });

  describe('Delivery Method Toggle', () => {
    it('should show address field for courier delivery', () => {
      renderCheckout();

      const courierRadio = screen.getByLabelText(/Курьер/);
      fireEvent.click(courierRadio);

      expect(screen.getByLabelText(/Адрес доставки/)).toBeInTheDocument();
    });

    it('should hide address field for pickup', async () => {
      renderCheckout();

      const pickupRadio = screen.getByLabelText(/Самовывоз/);
      fireEvent.click(pickupRadio);

      await waitFor(() => {
        expect(screen.queryByLabelText(/Адрес доставки/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should disable submit button without consents', () => {
      renderCheckout();

      const submitButton = screen.getByText(/ОПЛАТИТЬ/);
      expect(submitButton).toBeDisabled();
    });

    it('should still be disabled with only one consent', () => {
      renderCheckout();

      // Check only personal data consent
      const personalDataCheckbox = screen.getByLabelText(/обработку персональных данных/);
      fireEvent.click(personalDataCheckbox);

      const submitButton = screen.getByText(/ОПЛАТИТЬ/);
      expect(submitButton).toBeDisabled();
    });

    it('should enable button when both consents checked', () => {
      renderCheckout();

      const personalDataCheckbox = screen.getByLabelText(/обработку персональных данных/);
      const dataSharingCheckbox = screen.getByLabelText(/передачу данных третьим лицам/);

      fireEvent.click(personalDataCheckbox);
      fireEvent.click(dataSharingCheckbox);

      const submitButton = screen.getByText(/ОПЛАТИТЬ/);
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Order Submission', () => {
    // Note: Full form submission tests are simplified due to Radix UI Select complexity in test environment
    // For comprehensive E2E testing, use Playwright or Cypress
    const fillBasicForm = () => {
      // Select pickup to avoid address validation
      const pickupRadio = screen.getByLabelText(/Самовывоз/);
      fireEvent.click(pickupRadio);

      fireEvent.change(screen.getByLabelText(/Имя/), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText(/Фамилия/), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByLabelText(/Email/), {
        target: { value: 'test@test.com' },
      });
      fireEvent.change(screen.getByLabelText(/Телефон/), {
        target: { value: '+79991234567' },
      });

      // Check consents
      const personalDataCheckbox = screen.getByLabelText(/обработку персональных данных/);
      const dataSharingCheckbox = screen.getByLabelText(/передачу данных третьим лицам/);
      fireEvent.click(personalDataCheckbox);
      fireEvent.click(dataSharingCheckbox);
    };

    it('should enable submit button after checking consents', () => {
      renderCheckout();

      fillBasicForm();

      const submitButton = screen.getByText(/ОПЛАТИТЬ/);
      // Button should be enabled after consents are checked
      expect(submitButton).not.toBeDisabled();
    });

    it('should validate form fields are filled', () => {
      renderCheckout();

      fillBasicForm();

      // Verify fields have values
      expect(screen.getByLabelText(/Имя/)).toHaveValue('John');
      expect(screen.getByLabelText(/Фамилия/)).toHaveValue('Doe');
      expect(screen.getByLabelText(/Email/)).toHaveValue('test@test.com');
      expect(screen.getByLabelText(/Телефон/)).toHaveValue('+79991234567');
    });

    // Note: Full order submission tests require E2E testing due to Radix UI Select complexity
  });

  describe('Order Summary', () => {
    it('should display cart items', () => {
      mockCart.items = [
        {
          id: 'prod-1',
          name: 'Product One',
          price: 500,
          quantity: 2,
          size: 'M',
          color: 'black',
          image: '/img1.jpg',
        },
        {
          id: 'prod-2',
          name: 'Product Two',
          price: 800,
          quantity: 1,
          size: 'L',
          color: 'white',
          image: '/img2.jpg',
        },
      ];
      mockCart.totalPrice = 1800;

      renderCheckout();

      expect(screen.getByText('Product One')).toBeInTheDocument();
      expect(screen.getByText('Product Two')).toBeInTheDocument();
      expect(screen.getByText('Размер: M')).toBeInTheDocument();
      expect(screen.getByText('Размер: L')).toBeInTheDocument();
    });

    it('should display subtotal and total', () => {
      mockCart.totalPrice = 2000;

      renderCheckout();

      expect(screen.getByText(/Подытог:/)).toBeInTheDocument();
      expect(screen.getByText('Бесплатно')).toBeInTheDocument();
      expect(screen.getByText('Итого:')).toBeInTheDocument();
    });
  });

  describe('Country Selection', () => {
    it('should render country label', () => {
      renderCheckout();

      expect(screen.getByText(/Страна/)).toBeInTheDocument();
    });

    // Note: Full Select interaction tests require E2E testing due to Radix UI complexity
  });

  describe('Date of Birth Field', () => {
    it('should render date of birth input', () => {
      renderCheckout();

      expect(screen.getByLabelText(/Дата рождения/)).toBeInTheDocument();
    });
  });

  describe('Notes Field', () => {
    it('should render notes textarea', () => {
      renderCheckout();

      expect(screen.getByLabelText(/Комментарий к заказу/)).toBeInTheDocument();
    });

    it('should allow entering notes', () => {
      renderCheckout();

      const notesField = screen.getByLabelText(/Комментарий к заказу/);
      fireEvent.change(notesField, { target: { value: 'Please deliver after 6pm' } });

      expect(notesField).toHaveValue('Please deliver after 6pm');
    });
  });

  describe('Newsletter Checkbox', () => {
    it('should render newsletter checkbox', () => {
      renderCheckout();

      expect(
        screen.getByLabelText(/Подписаться на новости и специальные предложения/)
      ).toBeInTheDocument();
    });

    it('should allow toggling newsletter subscription', () => {
      renderCheckout();

      const newsletterCheckbox = screen.getByLabelText(
        /Подписаться на новости и специальные предложения/
      );
      fireEvent.click(newsletterCheckbox);

      expect(newsletterCheckbox).toBeChecked();
    });
  });

  describe('Payment Button State', () => {
    it('should be disabled when consents not checked', () => {
      renderCheckout();

      const submitButton = screen.getByText(/ОПЛАТИТЬ/);
      expect(submitButton).toBeDisabled();
    });

    it('should be enabled when both consents checked', async () => {
      renderCheckout();

      const personalDataCheckbox = screen.getByLabelText(/обработку персональных данных/);
      const dataSharingCheckbox = screen.getByLabelText(/передачу данных третьим лицам/);

      fireEvent.click(personalDataCheckbox);
      fireEvent.click(dataSharingCheckbox);

      await waitFor(() => {
        const submitButton = screen.getByText(/ОПЛАТИТЬ/);
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should display total in button text', () => {
      mockCart.totalPrice = 2500;

      renderCheckout();

      expect(screen.getByText(/ОПЛАТИТЬ 2500 ₽/)).toBeInTheDocument();
    });
  });

  describe('Privacy Policy Links', () => {
    it('should render privacy policy link', () => {
      renderCheckout();

      expect(screen.getByText('политикой конфиденциальности')).toBeInTheDocument();
    });

    it('should render user agreement link', () => {
      renderCheckout();

      expect(screen.getByText('пользовательским соглашением')).toBeInTheDocument();
    });
  });

  describe('Courier Address Validation', () => {
    it('should show address field when courier selected', () => {
      renderCheckout();

      // Courier is default
      expect(screen.getByLabelText(/Адрес доставки/)).toBeInTheDocument();
    });

    it('should hide address field when pickup selected', async () => {
      renderCheckout();

      const pickupRadio = screen.getByLabelText(/Самовывоз/);
      fireEvent.click(pickupRadio);

      await waitFor(() => {
        expect(screen.queryByLabelText(/Адрес доставки/)).not.toBeInTheDocument();
      });
    });
  });
});
