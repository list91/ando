import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { API_CONFIG } from '@/config/api';

const checkoutSchema = z.object({
  firstName: z.string().min(2, 'Имя должно содержать минимум 2 символа').max(50),
  lastName: z.string().min(2, 'Фамилия должна содержать минимум 2 символа').max(50),
  email: z.string().email('Неверный формат email').max(255),
  phone: z.string().min(10, 'Введите корректный номер телефона').max(20),
  dateOfBirth: z.string().optional(),
  country: z.string().min(1, 'Выберите страну'),
  address: z.string().max(500).optional(),
  deliveryMethod: z.enum(['courier', 'pickup']),
  paymentMethod: z.enum(['card', 'cash']),
  notes: z.string().max(1000).optional(),
}).refine((data) => {
  if (data.deliveryMethod === 'courier') {
    return data.address && data.address.length >= 5;
  }
  return true;
}, {
  message: 'Введите адрес доставки (минимум 5 символов)',
  path: ['address'],
});

const COUNTRIES = [
  { value: 'RU', label: 'Россия' },
  { value: 'BY', label: 'Беларусь' },
  { value: 'KZ', label: 'Казахстан' },
  { value: 'UA', label: 'Украина' },
  { value: 'AM', label: 'Армения' },
  { value: 'AZ', label: 'Азербайджан' },
  { value: 'GE', label: 'Грузия' },
  { value: 'KG', label: 'Киргизия' },
  { value: 'MD', label: 'Молдова' },
  { value: 'TJ', label: 'Таджикистан' },
  { value: 'TM', label: 'Туркменистан' },
  { value: 'UZ', label: 'Узбекистан' },
];

const DELIVERY_COST = 0; // Free delivery

// P3: Payment methods array - if only one, hide selector
const PAYMENT_METHODS = [
  { value: 'card', label: 'Банковская карта' },
  { value: 'cash', label: 'Наличные при получении' },
] as const;

const Checkout = () => {
  const { user } = useAuth();
  const { items, totalPrice } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // ЛК-5: Promocode states
  const [promocodeInput, setPromocodeInput] = useState('');
  const [appliedPromocode, setAppliedPromocode] = useState<{code: string, discount_percent: number} | null>(null);
  const [promocodeError, setPromocodeError] = useState('');
  const [promocodeLoading, setPromocodeLoading] = useState(false);

  // P7: Query to check if user has any orders (for first order discount)
  const { data: userOrdersCount = 0 } = useQuery({
    queryKey: ['user-orders-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (error) {
        console.error('Error fetching orders count:', error);
        return 0;
      }
      return count || 0;
    },
    enabled: !!user?.id,
  });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    country: '',
    address: '',
    deliveryMethod: 'courier',
    paymentMethod: PAYMENT_METHODS[0].value,
    notes: '',
  });

  const [personalDataProcessing, setPersonalDataProcessing] = useState(false);
  const [dataSharing, setDataSharing] = useState(false);
  const [agreedToNewsletter, setAgreedToNewsletter] = useState(false);
  const [showRegistrationPromo, setShowRegistrationPromo] = useState(true);

  const subtotal = totalPrice;
  const deliveryCost = formData.deliveryMethod === 'courier' ? DELIVERY_COST : 0;
  // P7: 5% discount for first order of registered users (only if no promocode applied)
  // ЛК-5: Promocode takes priority over first order discount
  const isFirstOrderDiscount = user && userOrdersCount === 0 && !appliedPromocode;
  const firstOrderDiscount = isFirstOrderDiscount ? Math.round(subtotal * 0.05) : 0;
  const promocodeDiscount = appliedPromocode ? Math.round(subtotal * appliedPromocode.discount_percent / 100) : 0;
  const totalDiscount = firstOrderDiscount + promocodeDiscount;
  const total = subtotal + deliveryCost - totalDiscount;

  // ЛК-5: Validate promocode function
  const validatePromocode = async () => {
    if (!promocodeInput.trim()) return;
    setPromocodeLoading(true);
    setPromocodeError('');

    const { data, error } = await supabase
      .from('promocodes')
      .select('*')
      .eq('code', promocodeInput.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !data) {
      setPromocodeError('Промокод не найден или неактивен');
      setAppliedPromocode(null);
    } else if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
      setPromocodeError('Срок действия промокода истёк');
      setAppliedPromocode(null);
    } else if (data.max_uses && data.used_count >= data.max_uses) {
      setPromocodeError('Лимит использований промокода исчерпан');
      setAppliedPromocode(null);
    } else {
      setAppliedPromocode({ code: data.code, discount_percent: data.discount_percent });
      setPromocodeError('');
      toast({ title: 'Промокод применён!', description: `Скидка ${data.discount_percent}%` });
    }
    setPromocodeLoading(false);
  };

  useEffect(() => {
    if (items.length === 0) {
      navigate('/catalog');
    }
  }, [items, navigate]);


  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (data) {
          // Split full_name into firstName and lastName
          const nameParts = (data.full_name || '').split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          setFormData((prev) => ({
            ...prev,
            firstName,
            lastName,
            email: data.email || user.email || '',
            phone: data.phone || '',
            // ЛК-2: Auto-fill delivery address from profile
            address: data.delivery_address || prev.address || '',
          }));
        }
      };

      setTimeout(() => {
        fetchProfile();
      }, 0);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!personalDataProcessing) {
      toast({
        title: 'Требуется согласие',
        description: 'Необходимо согласиться на обработку персональных данных',
        variant: 'destructive',
      });
      return;
    }

    if (!dataSharing) {
      toast({
        title: 'Требуется согласие',
        description: 'Необходимо согласиться на передачу данных третьим лицам',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      checkoutSchema.parse(formData);

      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id || null,
          order_number: orderNumber,
          status: 'pending',
          total_amount: total,
          customer_name: fullName,
          customer_email: formData.email,
          customer_phone: formData.phone,
          delivery_address: formData.deliveryMethod === 'courier' ? formData.address : null,
          delivery_method: formData.deliveryMethod === 'courier' ? 'Курьер' : 'Самовывоз',
          payment_method: formData.paymentMethod === 'card' ? 'Карта' : 'Наличные',
          notes: formData.notes,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.id.toString(),
        product_name: item.name,
        product_price: item.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Send email notification to order@andojv.com
      try {
        await fetch(API_CONFIG.ORDER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderNumber,
            customerName: fullName,
            customerEmail: formData.email,
            customerPhone: formData.phone,
            dateOfBirth: formData.dateOfBirth,
            country: formData.country,
            address: formData.address,
            deliveryMethod: formData.deliveryMethod === 'courier' ? 'Курьер' : 'Самовывоз',
            paymentMethod: formData.paymentMethod === 'card' ? 'Карта' : 'Наличные',
            notes: formData.notes,
            totalAmount: total,
            deliveryCost,
            subscribedToNewsletter: agreedToNewsletter,
            items: items.map((item) => ({
              name: item.name,
              size: item.size,
              color: item.color,
              quantity: item.quantity,
              price: item.price,
            })),
          }),
        });
      } catch (emailError) {
        // Don't fail the order if email fails
        console.error('Failed to send order email:', emailError);
      }

      toast({
        title: 'Заказ оформлен!',
        description: `Номер заказа: ${orderNumber}`,
      });

      navigate('/order-success', { state: { orderNumber, orderId: order.id } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Ошибка валидации',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        console.error('Checkout error:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось оформить заказ. Попробуйте еще раз.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-full p-4 sm:p-8 pt-2 content-baseline">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl tracking-[0.15em] uppercase mb-6 sm:mb-8">Оформление заказа</h1>

        {/* T8: Authorization prompt for guests */}
        {!user && (
          <Card className="mb-6 border-dashed">
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="font-medium">Уже есть аккаунт?</p>
                  <p className="text-sm text-muted-foreground">
                    Войдите, чтобы использовать сохраненные данные и отслеживать заказы
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="outline" asChild>
                    <Link to="/auth?redirect=/checkout">Войти</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/auth?redirect=/checkout">Регистрация</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* T11: Registration promo block with 5% discount for guests */}
        {/* ДОР-11: верхняя плашка чёрная (белый текст), нижняя белая (чёрный текст), круг красный */}
        {!user && showRegistrationPromo && (
          <div className="mb-6 relative overflow-hidden">
            {/* Верхняя плашка - чёрная с белым текстом */}
            <div className="bg-black text-white p-4 pr-10 flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-red-500 text-white flex-shrink-0">
                <span className="text-lg font-bold">%</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base">
                  Зарегистрируйтесь и получите скидку 5% на первый заказ!
                </p>
              </div>
              <button
                className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-white hover:text-gray-300 rounded-full hover:bg-gray-800"
                onClick={() => setShowRegistrationPromo(false)}
                aria-label="Закрыть"
              >
                <span className="text-lg leading-none">&times;</span>
              </button>
            </div>
            {/* Нижняя плашка - белая с чёрным текстом */}
            <div className="bg-white text-black border border-t-0 border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs sm:text-sm text-gray-700">
                Создайте аккаунт прямо сейчас и экономьте
              </p>
              <Button
                className="bg-black hover:bg-gray-800 text-white flex-shrink-0 w-full sm:w-auto"
                asChild
              >
                <Link to="/auth?redirect=/checkout">Получить скидку</Link>
              </Button>
            </div>
          </div>
        )}

        {/* ДОР-10: Левая часть прокручивается, правая (summary) фиксирована */}
        <div className="lg:flex lg:gap-8">
          {/* Левая колонка - форма */}
          <div className="flex-1 lg:flex-[2]">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Контактная информация</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* T3: Split fullName into firstName + lastName */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">Имя *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({ ...formData, firstName: e.target.value })
                        }
                        required
                        maxLength={50}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Фамилия *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        required
                        maxLength={50}
                      />
                    </div>
                  </div>

                  {/* T4: Date of birth field */}
                  <div>
                    <Label htmlFor="dateOfBirth">Дата рождения</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) =>
                        setFormData({ ...formData, dateOfBirth: e.target.value })
                      }
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                      maxLength={255}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Телефон *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+7 (999) 123-45-67"
                      required
                      maxLength={20}
                    />
                  </div>

                  {/* T5: Country dropdown */}
                  <div>
                    <Label htmlFor="country">Страна *</Label>
                    <Select
                      value={formData.country}
                      onValueChange={(value) =>
                        setFormData({ ...formData, country: value })
                      }
                    >
                      <SelectTrigger id="country">
                        <SelectValue placeholder="Выберите страну" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country.value} value={country.value}>
                            {country.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Доставка</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* T6: Delivery method selector - address shown only for courier */}
                  <div>
                    <Label>Способ доставки *</Label>
                    <RadioGroup
                      value={formData.deliveryMethod}
                      onValueChange={(value) =>
                        setFormData({ ...formData, deliveryMethod: value })
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="courier" id="courier" />
                        <Label htmlFor="courier" className="font-normal">
                          Курьер
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pickup" id="pickup" />
                        <Label htmlFor="pickup" className="font-normal">
                          Самовывоз
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* T6: Address textarea only appears for courier delivery */}
                  {formData.deliveryMethod === 'courier' && (
                    <div>
                      <Label htmlFor="address">Адрес доставки *</Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        placeholder="Улица, дом, квартира"
                        required
                        maxLength={500}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ЛК-5: Promocode section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Промокод</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Введите промокод"
                      value={promocodeInput}
                      onChange={(e) => setPromocodeInput(e.target.value.toUpperCase())}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={validatePromocode}
                      disabled={promocodeLoading || !promocodeInput.trim()}
                    >
                      {promocodeLoading ? 'Проверка...' : 'Применить'}
                    </Button>
                  </div>
                  {promocodeError && <p className="text-sm text-red-500 mt-2">{promocodeError}</p>}
                  {appliedPromocode && (
                    <div className="flex items-center justify-between mt-2 p-2 bg-green-50 rounded">
                      <span className="text-sm text-green-700">Применён: {appliedPromocode.code} (-{appliedPromocode.discount_percent}%)</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setAppliedPromocode(null)}>
                        Убрать
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Оплата</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* P3: Hide selector if only one payment method */}
                  <div>
                    <Label>Способ оплаты *</Label>
                    {PAYMENT_METHODS.length === 1 ? (
                      <p className="text-sm text-muted-foreground mt-1">
                        {PAYMENT_METHODS[0].label}
                      </p>
                    ) : (
                      <RadioGroup
                        value={formData.paymentMethod}
                        onValueChange={(value) =>
                          setFormData({ ...formData, paymentMethod: value })
                        }
                      >
                        {PAYMENT_METHODS.map((method) => (
                          <div key={method.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={method.value} id={method.value} />
                            <Label htmlFor={method.value} className="font-normal">
                              {method.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="notes">Комментарий к заказу</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder="Дополнительная информация"
                      maxLength={1000}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* T7: Consent checkboxes */}
              <Card>
                <CardHeader>
                  <CardTitle>Согласия</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* T7: personalDataProcessing - required */}
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="personalDataProcessing"
                      checked={personalDataProcessing}
                      onCheckedChange={(checked) => setPersonalDataProcessing(checked as boolean)}
                      required
                      aria-required="true"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="personalDataProcessing"
                        className="text-sm font-medium leading-relaxed cursor-pointer"
                      >
                        Я согласен(на) на обработку персональных данных *
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Ознакомьтесь с{' '}
                        <Link to="/info?section=privacy" className="underline hover:no-underline">
                          политикой конфиденциальности
                        </Link>
                      </p>
                    </div>
                  </div>

                  {/* T7: dataSharing - required */}
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="dataSharing"
                      checked={dataSharing}
                      onCheckedChange={(checked) => setDataSharing(checked as boolean)}
                      required
                      aria-required="true"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="dataSharing"
                        className="text-sm font-medium leading-relaxed cursor-pointer"
                      >
                        Я согласен(на) на передачу данных третьим лицам для обработки заказа *
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Ознакомьтесь с{' '}
                        <Link to="/info?section=agreement" className="underline hover:no-underline">
                          пользовательским соглашением
                        </Link>
                      </p>
                    </div>
                  </div>

                  {/* T7: newsletter - optional (already existed as agreedToNewsletter) */}
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="newsletter"
                      checked={agreedToNewsletter}
                      onCheckedChange={(checked) => setAgreedToNewsletter(checked as boolean)}
                    />
                    <label
                      htmlFor="newsletter"
                      className="text-sm font-medium leading-relaxed cursor-pointer"
                    >
                      Подписаться на новости и специальные предложения
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* ДОР-10: Mobile order summary - показывается только на мобильных */}
              <Card className="lg:hidden">
                <CardHeader>
                  <CardTitle>Ваш заказ</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={`${item.id}-${item.size}-mobile`} className="flex gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-20 object-cover"
                        />
                        <div className="flex-1 text-sm">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-muted-foreground">
                            Размер: {item.size}
                          </p>
                          <p className="text-muted-foreground">
                            {item.quantity} x {item.price} ₽
                          </p>
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Подытог:</span>
                        <span>{subtotal} ₽</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Доставка:</span>
                        <span>{formData.deliveryMethod === 'courier' ? 'Курьер' : 'Самовывоз'}</span>
                      </div>
                      {/* P7: Show discount line for first order */}
                      {firstOrderDiscount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Скидка 5% (первый заказ):</span>
                          <span>-{firstOrderDiscount} ₽</span>
                        </div>
                      )}
                      {/* ЛК-5: Show promocode discount */}
                      {promocodeDiscount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Промокод {appliedPromocode?.code} (-{appliedPromocode?.discount_percent}%):</span>
                          <span>-{promocodeDiscount} ₽</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-medium pt-2 border-t">
                        <span>Итого:</span>
                        <span>{total} ₽</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ДОР-12: Кнопка "Оформить заказ" */}
              <Button
                type="submit"
                className="w-full bg-black hover:bg-gray-800 text-white"
                size="lg"
                disabled={loading || !personalDataProcessing || !dataSharing}
              >
                {loading ? 'Оформление...' : 'Оформить заказ'}
              </Button>
            </form>
          </div>

          {/* T9: Sidebar with order summary */}
          {/* ДОР-10: Summary фиксирована при скролле - только на десктопе */}
          <div className="hidden lg:block lg:flex-1 lg:min-w-[280px] lg:max-w-[350px]">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Ваш заказ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* T9: Items list */}
                  {items.map((item) => (
                    <div key={`${item.id}-${item.size}`} className="flex gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-20 object-cover"
                      />
                      <div className="flex-1 text-sm">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-muted-foreground">
                          Размер: {item.size}
                        </p>
                        <p className="text-muted-foreground">
                          {item.quantity} x {item.price} ₽
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* T9: Subtotal, delivery cost, total */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Подытог:</span>
                      <span>{subtotal} ₽</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Доставка:</span>
                      <span>{formData.deliveryMethod === 'courier' ? 'Курьер' : 'Самовывоз'}</span>
                    </div>
                    {/* P7: Show discount line for first order */}
                    {firstOrderDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Скидка 5% (первый заказ):</span>
                        <span>-{firstOrderDiscount} ₽</span>
                      </div>
                    )}
                    {/* ЛК-5: Show promocode discount */}
                    {promocodeDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Промокод {appliedPromocode?.code} (-{appliedPromocode?.discount_percent}%):</span>
                        <span>-{promocodeDiscount} ₽</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-medium pt-2 border-t">
                      <span>Итого:</span>
                      <span>{total} ₽</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
