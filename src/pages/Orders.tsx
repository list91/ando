import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Package, User, Settings } from "lucide-react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

const Orders = () => {
  const { user, loading: authLoading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      if (data) {
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
      }
      return data;
    },
    enabled: !!user,
  });

  // Fetch user orders
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['user-orders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_name,
            quantity,
            product_price,
            size,
            color
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          phone: phone,
          email: user.email,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      toast.success("Профиль обновлен");
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Ошибка при обновлении профиля");
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <p>Загрузка...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'В обработке',
      confirmed: 'Подтвержден',
      shipped: 'Отправлен',
      delivered: 'Доставлен',
      cancelled: 'Отменен',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: 'text-yellow-600',
      confirmed: 'text-blue-600',
      shipped: 'text-purple-600',
      delivered: 'text-green-600',
      cancelled: 'text-red-600',
    };
    return colorMap[status] || 'text-muted-foreground';
  };

  return (
    <div className="container mx-auto px-4 pt-2 pb-8 max-w-6xl content-baseline">
      <h1 className="text-3xl font-light mb-8 tracking-wide">Личный кабинет</h1>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Мои заказы
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Профиль
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          {ordersLoading ? (
            <p>Загрузка заказов...</p>
          ) : orders && orders.length > 0 ? (
            orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Заказ #{order.order_number}</CardTitle>
                      <CardDescription>
                        {new Date(order.created_at).toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </CardDescription>
                    </div>
                    <span className={`font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.order_items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center py-2">
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.size && `Размер: ${item.size}`}
                            {item.size && item.color && ' • '}
                            {item.color && `Цвет: ${item.color}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{item.product_price} ₽</p>
                          <p className="text-sm text-muted-foreground">x {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between items-center font-semibold pt-2">
                      <span>Итого:</span>
                      <span>{order.total_amount} ₽</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">У вас пока нет заказов</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Настройки профиля
              </CardTitle>
              <CardDescription>
                Обновите вашу личную информацию
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={user.email || ''} 
                  disabled 
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Полное имя</Label>
                <Input 
                  id="fullName" 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Введите ваше имя"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Телефон</Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (___) ___-__-__"
                />
              </div>

              <Button onClick={handleUpdateProfile} className="w-full">
                Сохранить изменения
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Orders;
