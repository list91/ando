import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const checkoutSchema = z.object({
  fullName: z.string().min(2, 'Имя должно содержать минимум 2 символа').max(100),
  email: z.string().email('Неверный формат email').max(255),
  phone: z.string().min(10, 'Введите корректный номер телефона').max(20),
  address: z.string().min(5, 'Введите адрес доставки').max(500),
  deliveryMethod: z.enum(['courier', 'pickup']),
  paymentMethod: z.enum(['card', 'cash']),
  notes: z.string().max(1000).optional(),
});

const Checkout = () => {
  const { user } = useAuth();
  const { items, totalPrice } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    deliveryMethod: 'courier',
    paymentMethod: 'card',
    notes: '',
  });

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToNewsletter, setAgreedToNewsletter] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      navigate('/catalog');
    }
  }, [items, navigate]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (data) {
          setFormData((prev) => ({
            ...prev,
            fullName: data.full_name || '',
            email: data.email || user.email || '',
            phone: data.phone || '',
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
    
    if (!user) {
      toast({
        title: 'Ошибка',
        description: 'Необходимо войти в систему',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    if (!agreedToTerms) {
      toast({
        title: 'Требуется согласие',
        description: 'Необходимо согласиться на обработку персональных данных',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      checkoutSchema.parse(formData);

      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          status: 'pending',
          total_amount: totalPrice,
          customer_name: formData.fullName,
          customer_email: formData.email,
          customer_phone: formData.phone,
          delivery_address: formData.address,
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

  if (!user || items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-full p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl tracking-[0.15em] uppercase mb-8">Оформление заказа</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Контактная информация</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Полное имя *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      required
                      maxLength={100}
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Доставка</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                          Курьер (бесплатно)
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Оплата</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Способ оплаты *</Label>
                    <RadioGroup
                      value={formData.paymentMethod}
                      onValueChange={(value) =>
                        setFormData({ ...formData, paymentMethod: value })
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="font-normal">
                          Банковская карта
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cash" id="cash" />
                        <Label htmlFor="cash" className="font-normal">
                          Наличные при получении
                        </Label>
                      </div>
                    </RadioGroup>
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

              <Card>
                <CardHeader>
                  <CardTitle>Согласия</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="terms" 
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                      required
                      aria-required="true"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="terms"
                        className="text-sm font-medium leading-relaxed cursor-pointer"
                      >
                        Я согласен(на) на обработку персональных данных *
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Ознакомьтесь с{' '}
                        <Link to="/info?section=agreement" className="underline hover:no-underline">
                          пользовательским соглашением
                        </Link>{' '}
                        и{' '}
                        <Link to="/info?section=agreement" className="underline hover:no-underline">
                          политикой конфиденциальности
                        </Link>
                      </p>
                    </div>
                  </div>
                  
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

              <Button type="submit" className="w-full" size="lg" disabled={loading || !agreedToTerms}>
                {loading ? 'Оформление...' : `Оформить заказ на ${totalPrice} ₽`}
              </Button>
            </form>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Ваш заказ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
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
                          {item.quantity} × {item.price} ₽
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-medium">
                      <span>Итого:</span>
                      <span>{totalPrice} ₽</span>
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