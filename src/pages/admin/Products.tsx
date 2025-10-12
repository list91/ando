import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCategories } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductImageManager } from '@/components/admin/ProductImageManager';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  old_price: number | null;
  is_sale: boolean;
  stock_quantity: number;
  category_id: string | null;
}

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();
  const { data: categories } = useCategories();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    article: '',
    price: '',
    old_price: '',
    is_sale: false,
    stock_quantity: '0',
    category_id: '',
    material: '',
    description: '',
    care_instructions: '',
    delivery_info: '',
    payment_info: '',
    available_sizes: '',
    available_colors: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить товары',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const productData = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        article: formData.article.trim() || null,
        price: parseFloat(formData.price),
        old_price: formData.old_price ? parseFloat(formData.old_price) : null,
        is_sale: formData.is_sale,
        stock_quantity: parseInt(formData.stock_quantity),
        category_id: formData.category_id || null,
        material: formData.material.trim() || null,
        description: formData.description.trim() || null,
        care_instructions: formData.care_instructions.trim() || null,
        delivery_info: formData.delivery_info.trim() || null,
        payment_info: formData.payment_info.trim() || null,
        available_sizes: formData.available_sizes
          ? formData.available_sizes.split(',').map(s => s.trim()).filter(s => s)
          : [],
        available_colors: formData.available_colors
          ? formData.available_colors.split(',').map(c => c.trim()).filter(c => c)
          : [],
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast({ title: 'Товар обновлен' });
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);

        if (error) throw error;
        toast({ title: 'Товар создан' });
      }

      setDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить товар',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить товар?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Товар удален' });
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить товар',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      article: '',
      price: '',
      old_price: '',
      is_sale: false,
      stock_quantity: '0',
      category_id: '',
      material: '',
      description: '',
      care_instructions: '',
      delivery_info: '',
      payment_info: '',
      available_sizes: '',
      available_colors: '',
    });
    setEditingProduct(null);
  };

  const handleEdit = async (product: Product) => {
    setEditingProduct(product);
    
    // Fetch full product data including all fields
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', product.id)
      .single();
    
    if (error || !data) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные товара',
        variant: 'destructive',
      });
      return;
    }
    
    setFormData({
      name: data.name,
      slug: data.slug,
      article: data.article || '',
      price: data.price.toString(),
      old_price: data.old_price?.toString() || '',
      is_sale: data.is_sale,
      stock_quantity: data.stock_quantity.toString(),
      category_id: data.category_id || '',
      material: data.material || '',
      description: data.description || '',
      care_instructions: data.care_instructions || '',
      delivery_info: data.delivery_info || '',
      payment_info: data.payment_info || '',
      available_sizes: data.available_sizes?.join(', ') || '',
      available_colors: data.available_colors?.join(', ') || '',
    });
    setDialogOpen(true);
  };

  if (loading) {
    return <div className="p-8">Загрузка...</div>;
  }

  return (
    <div className="p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Управление товарами</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Добавить товар
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? 'Редактировать товар' : 'Новый товар'}
                </DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="main" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="main">Основная информация</TabsTrigger>
                  <TabsTrigger value="images" disabled={!editingProduct}>
                    Изображения {!editingProduct && '(сначала создайте товар)'}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="main">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Название *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug (URL) *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    required
                    maxLength={100}
                  />
                </div>
                <div>
                  <Label htmlFor="article">Артикул</Label>
                  <Input
                    id="article"
                    value={formData.article}
                    onChange={(e) =>
                      setFormData({ ...formData, article: e.target.value })
                    }
                    placeholder="ART-12345"
                    maxLength={50}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Цена *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="old_price">Старая цена</Label>
                    <Input
                      id="old_price"
                      type="number"
                      step="0.01"
                      value={formData.old_price}
                      onChange={(e) =>
                        setFormData({ ...formData, old_price: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="stock_quantity">Количество на складе</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, stock_quantity: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="category_id">Категория</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Без категории</SelectItem>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_sale"
                    checked={formData.is_sale}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_sale: checked as boolean })
                    }
                  />
                  <Label htmlFor="is_sale">Товар на распродаже</Label>
                </div>
                <div>
                  <Label htmlFor="available_sizes">Доступные размеры</Label>
                  <Input
                    id="available_sizes"
                    value={formData.available_sizes}
                    onChange={(e) =>
                      setFormData({ ...formData, available_sizes: e.target.value })
                    }
                    placeholder="XS, S, M, L, XL"
                    maxLength={200}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Через запятую
                  </p>
                </div>
                <div>
                  <Label htmlFor="available_colors">Доступные цвета</Label>
                  <Input
                    id="available_colors"
                    value={formData.available_colors}
                    onChange={(e) =>
                      setFormData({ ...formData, available_colors: e.target.value })
                    }
                    placeholder="Черный, Белый, Серый"
                    maxLength={200}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Через запятую
                  </p>
                </div>
                <div>
                  <Label htmlFor="material">Материал</Label>
                  <Input
                    id="material"
                    value={formData.material}
                    onChange={(e) =>
                      setFormData({ ...formData, material: e.target.value })
                    }
                    maxLength={200}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    maxLength={1000}
                  />
                </div>
                <div>
                  <Label htmlFor="care_instructions">Инструкции по уходу</Label>
                  <Textarea
                    id="care_instructions"
                    value={formData.care_instructions}
                    onChange={(e) =>
                      setFormData({ ...formData, care_instructions: e.target.value })
                    }
                    rows={2}
                    maxLength={500}
                  />
                </div>
                <div>
                  <Label htmlFor="delivery_info">Информация о доставке</Label>
                  <Textarea
                    id="delivery_info"
                    value={formData.delivery_info}
                    onChange={(e) =>
                      setFormData({ ...formData, delivery_info: e.target.value })
                    }
                    rows={2}
                    maxLength={500}
                  />
                </div>
                <div>
                  <Label htmlFor="payment_info">Информация об оплате</Label>
                  <Textarea
                    id="payment_info"
                    value={formData.payment_info}
                    onChange={(e) =>
                      setFormData({ ...formData, payment_info: e.target.value })
                    }
                    rows={2}
                    maxLength={500}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">
                    {editingProduct ? 'Сохранить' : 'Создать'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Отмена
                  </Button>
                </div>
              </form>
                </TabsContent>
                
                <TabsContent value="images">
                  {editingProduct && (
                    <ProductImageManager productId={editingProduct.id} />
                  )}
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Цена</TableHead>
                <TableHead>Склад</TableHead>
                <TableHead>Распродажа</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {product.slug}
                  </TableCell>
                  <TableCell>{product.price} ₽</TableCell>
                  <TableCell>{product.stock_quantity}</TableCell>
                  <TableCell>{product.is_sale ? 'Да' : 'Нет'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProducts;