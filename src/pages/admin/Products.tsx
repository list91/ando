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
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const { toast } = useToast();
  const { data: categories, isLoading: categoriesLoading } = useCategories();

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

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, categoryFilter]);

  const filterProducts = () => {
    let filtered = [...products];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.slug.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      if (categoryFilter === 'none') {
        filtered = filtered.filter((p) => !p.category_id);
      } else {
        filtered = filtered.filter((p) => p.category_id === categoryFilter);
      }
    }

    setFilteredProducts(filtered);
  };

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
    
    if (submitting) return; // Prevent double submission
    
    // Validation
    if (!formData.name.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Название товара обязательно',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.slug.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Slug обязателен',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast({
        title: 'Ошибка',
        description: 'Цена должна быть больше 0',
        variant: 'destructive',
      });
      return;
    }
    
    setSubmitting(true);
    try {
      // Parse sizes and colors
      const sizes = formData.available_sizes
        ? formData.available_sizes.split(',').map(s => s.trim()).filter(s => s)
        : [];
      const colors = formData.available_colors
        ? formData.available_colors.split(',').map(c => c.trim()).filter(c => c)
        : [];

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
        available_sizes: sizes.length > 0 ? sizes : null,
        available_colors: colors.length > 0 ? colors : null,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        toast({ title: 'Товар обновлен' });
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        toast({ title: 'Товар создан' });
      }

      setDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось сохранить товар',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
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
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
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
                  
                  <TabsContent value="main" className="mt-4">
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

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="is_sale"
                          checked={formData.is_sale}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, is_sale: checked as boolean })
                          }
                        />
                        <Label htmlFor="is_sale">Распродажа</Label>
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
                            {categories?.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="material">Материал</Label>
                        <Input
                          id="material"
                          value={formData.material}
                          onChange={(e) =>
                            setFormData({ ...formData, material: e.target.value })
                          }
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
                          rows={4}
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
                          rows={3}
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
                          rows={3}
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
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="available_sizes">
                          Доступные размеры (через запятую)
                        </Label>
                        <Input
                          id="available_sizes"
                          value={formData.available_sizes}
                          onChange={(e) =>
                            setFormData({ ...formData, available_sizes: e.target.value })
                          }
                          placeholder="S, M, L, XL"
                        />
                      </div>

                      <div>
                        <Label htmlFor="available_colors">
                          Доступные цвета (через запятую)
                        </Label>
                        <Input
                          id="available_colors"
                          value={formData.available_colors}
                          onChange={(e) =>
                            setFormData({ ...formData, available_colors: e.target.value })
                          }
                          placeholder="Черный, Белый, Серый"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit" disabled={submitting}>
                          {submitting 
                            ? 'Сохранение...' 
                            : editingProduct ? 'Сохранить' : 'Создать'}
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
          
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <Input
                placeholder="Поиск по названию или slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Все категории" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                <SelectItem value="none">Без категории</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery || categoryFilter !== 'all'
                ? 'Товары не найдены. Попробуйте изменить фильтры.'
                : 'Товары не созданы. Нажмите "Добавить товар" для создания.'}
            </div>
          ) : (
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
              {filteredProducts.map((product) => (
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
          )}
          
          <div className="mt-4 text-sm text-muted-foreground">
            Показано товаров: {filteredProducts.length} из {products.length}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProducts;