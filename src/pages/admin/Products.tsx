import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCategories } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, X, GripVertical, Settings } from 'lucide-react';
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
import { SIZE_ORDER } from '@/lib/sizeUtils';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  old_price: number | null;
  is_sale: boolean;
  is_new: boolean;
  stock_quantity: number;
  category_id: string | null;
  display_order: number;
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
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [customColorInput, setCustomColorInput] = useState('');
  const [customColorLinkInput, setCustomColorLinkInput] = useState('');
  const [draggedItem, setDraggedItem] = useState<Product | null>(null);
  const [dbColors, setDbColors] = useState<{name: string, hex_code: string}[]>([]);
  const [colorManagementOpen, setColorManagementOpen] = useState(false);
  const [newColorInput, setNewColorInput] = useState('');
  const [newColorHex, setNewColorHex] = useState('#CCCCCC');
  const { toast } = useToast();
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    article: '',
    price: '',
    old_price: '',
    is_sale: false,
    is_new: false,
    stock_quantity: '0',
    category_id: '',
    gender: '' as string,
    material: '',
    composition: '',
    description: '',
    care_instructions: '',
    delivery_info: '',
    payment_info: '',
    available_sizes: [] as string[],
    available_colors: [] as string[],
    color_links: {} as Record<string, string>,
    size_quantities: {} as Record<string, number>,
  });

  const availableSizeOptions = SIZE_ORDER;
  const availableColorOptions = dbColors.map(c => c.name);

  const fetchColors = async () => {
    const { data, error } = await supabase
      .from('colors')
      .select('name, hex_code')
      .order('display_order');
    if (!error && data) {
      setDbColors(data.map(c => ({ name: c.name, hex_code: c.hex_code || '#CCCCCC' })));
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchColors();
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
        .order('display_order', { ascending: true });

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

      // Сохраняем все color_links (даже с пустыми ссылками - они будут показаны как текст)
      const processedColorLinks: Record<string, string> = {};
      Object.entries(formData.color_links).forEach(([color, link]) => {
        processedColorLinks[color] = link?.trim() || '';
      });

      // Фильтруем size_quantities - оставляем только размеры с количеством > 0
      const processedSizeQuantities: Record<string, number> = {};
      Object.entries(formData.size_quantities).forEach(([size, qty]) => {
        if (qty > 0) {
          processedSizeQuantities[size] = qty;
        }
      });

      const productData = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        article: formData.article.trim() || null,
        price: parseFloat(formData.price),
        old_price: formData.old_price ? parseFloat(formData.old_price) : null,
        is_sale: formData.is_sale,
        is_new: formData.is_new,
        stock_quantity: parseInt(formData.stock_quantity),
        category_id: formData.category_id || null,
        gender: formData.gender || null,
        material: formData.material.trim() || null,
        composition: formData.composition.trim() || null,
        description: formData.description.trim() || null,
        care_instructions: formData.care_instructions.trim() || null,
        delivery_info: formData.delivery_info.trim() || null,
        payment_info: formData.payment_info.trim() || null,
        available_sizes: formData.available_sizes.length > 0 ? formData.available_sizes : null,
        available_colors: formData.available_colors.length > 0 ? formData.available_colors : null,
        color_links: Object.keys(processedColorLinks).length > 0 ? processedColorLinks : null,
        size_quantities: Object.keys(processedSizeQuantities).length > 0 ? processedSizeQuantities : {},
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
      is_new: false,
      stock_quantity: '0',
      category_id: '',
      gender: '',
      material: '',
      composition: '',
      description: '',
      care_instructions: '',
      delivery_info: '',
      payment_info: '',
      available_sizes: [],
      available_colors: [],
      color_links: {},
      size_quantities: {},
    });
    setEditingProduct(null);
    setCustomSizeInput('');
    setCustomColorInput('');
    setCustomColorLinkInput('');
  };

  const addCustomSize = () => {
    const trimmed = customSizeInput.trim();
    if (trimmed && !formData.available_sizes.includes(trimmed)) {
      setFormData({
        ...formData,
        available_sizes: [...formData.available_sizes, trimmed]
      });
      setCustomSizeInput('');
    }
  };

  const addCustomColor = async () => {
    const trimmed = customColorInput.trim();
    if (trimmed && !formData.available_colors.includes(trimmed)) {
      // Добавляем в форму
      setFormData({
        ...formData,
        available_colors: [...formData.available_colors, trimmed]
      });
      setCustomColorInput('');

      // Сохраняем в БД если нет такого цвета
      if (!dbColors.some(c => c.name === trimmed)) {
        const maxOrder = dbColors.length + 1;
        const { error } = await supabase
          .from('colors')
          .insert({ name: trimmed, hex_code: '#CCCCCC', display_order: maxOrder });
        if (!error) {
          setDbColors([...dbColors, { name: trimmed, hex_code: '#CCCCCC' }]);
          toast({ title: `Цвет "${trimmed}" добавлен в базу` });
        }
      }
    }
  };

  const removeSize = (size: string) => {
    setFormData({
      ...formData,
      available_sizes: formData.available_sizes.filter(s => s !== size)
    });
  };

  const removeColor = (color: string) => {
    // Удаляем ТОЛЬКО из available_colors, НЕ трогаем color_links (это разные сущности)
    setFormData({
      ...formData,
      available_colors: formData.available_colors.filter(c => c !== color)
    });
  };

  const addColorLink = (colorName: string) => {
    if (colorName && !(colorName in formData.color_links)) {
      setFormData({
        ...formData,
        color_links: {
          ...formData.color_links,
          [colorName]: ''
        }
      });
    }
  };

  const addCustomColorLink = async () => {
    const trimmed = customColorLinkInput.trim();
    if (trimmed && !(trimmed in formData.color_links)) {
      setFormData({
        ...formData,
        color_links: {
          ...formData.color_links,
          [trimmed]: ''
        }
      });
      setCustomColorLinkInput('');

      // Сохраняем в БД если нет такого цвета
      if (!dbColors.some(c => c.name === trimmed)) {
        const maxOrder = dbColors.length + 1;
        const { error } = await supabase
          .from('colors')
          .insert({ name: trimmed, hex_code: '#CCCCCC', display_order: maxOrder });
        if (!error) {
          setDbColors([...dbColors, { name: trimmed, hex_code: '#CCCCCC' }]);
          toast({ title: `Цвет "${trimmed}" добавлен в базу` });
        }
      }
    }
  };

  const removeColorLink = (color: string) => {
    const newColorLinks = { ...formData.color_links };
    delete newColorLinks[color];
    setFormData({
      ...formData,
      color_links: newColorLinks
    });
  };

  // Функции для модалки управления цветами
  const addColorToDb = async () => {
    const trimmed = newColorInput.trim();
    if (!trimmed) return;
    if (dbColors.some(c => c.name === trimmed)) {
      toast({ title: `Цвет "${trimmed}" уже существует`, variant: 'destructive' });
      return;
    }
    const maxOrder = dbColors.length + 1;
    const { error } = await supabase
      .from('colors')
      .insert({ name: trimmed, hex_code: newColorHex, display_order: maxOrder });
    if (!error) {
      setDbColors([...dbColors, { name: trimmed, hex_code: newColorHex }]);
      setNewColorInput('');
      setNewColorHex('#CCCCCC');
      toast({ title: `Цвет "${trimmed}" добавлен` });
    }
  };

  const deleteColorFromDb = async (colorName: string) => {
    // Находим товары с этим цветом
    const productsWithColor = products.filter(p =>
      (p as any).available_colors?.includes(colorName)
    );

    if (productsWithColor.length > 0) {
      const confirm = window.confirm(
        `Цвет "${colorName}" используется в ${productsWithColor.length} товар(ах). Удалить цвет везде?`
      );
      if (!confirm) return;

      // Удаляем цвет из available_colors каждого товара
      for (const product of productsWithColor) {
        const currentColors = (product as any).available_colors || [];
        const newColors = currentColors.filter((c: string) => c !== colorName);

        await supabase
          .from('products')
          .update({ available_colors: newColors })
          .eq('id', product.id);
      }

      // Обновляем локальный state
      setProducts(products.map(p => {
        const currentColors = (p as any).available_colors || [];
        if (currentColors.includes(colorName)) {
          return { ...p, available_colors: currentColors.filter((c: string) => c !== colorName) };
        }
        return p;
      }));
    }

    // Удаляем из таблицы colors
    const { error } = await supabase
      .from('colors')
      .delete()
      .eq('name', colorName);

    if (!error) {
      setDbColors(dbColors.filter(c => c.name !== colorName));
      toast({ title: `Цвет "${colorName}" полностью удалён` });
    }
  };

  const handleDragStart = (e: React.DragEvent, product: Product) => {
    setDraggedItem(product);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetProduct: Product) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.id === targetProduct.id) return;

    const draggedIndex = filteredProducts.findIndex(p => p.id === draggedItem.id);
    const targetIndex = filteredProducts.findIndex(p => p.id === targetProduct.id);

    const newOrder = [...filteredProducts];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);

    try {
      const updates = newOrder.map((product, index) => 
        supabase
          .from('products')
          .update({ display_order: index })
          .eq('id', product.id)
      );

      await Promise.all(updates);
      
      toast({ title: 'Порядок товаров обновлен' });
      fetchProducts();
    } catch (error) {
      console.error('Error updating product order:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить порядок товаров',
        variant: 'destructive',
      });
    }

    setDraggedItem(null);
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
      is_new: data.is_new || false,
      stock_quantity: (data.stock_quantity ?? 0).toString(),
      category_id: data.category_id || '',
      gender: data.gender || '',
      material: data.material || '',
      composition: data.composition || '',
      description: data.description || '',
      care_instructions: data.care_instructions || '',
      delivery_info: data.delivery_info || '',
      payment_info: data.payment_info || '',
      available_sizes: data.available_sizes || [],
      available_colors: data.available_colors || [],
      color_links: (data.color_links as Record<string, string>) || {},
      size_quantities: (data.size_quantities as Record<string, number>) || {},
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

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="is_new"
                          checked={formData.is_new}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, is_new: checked as boolean })
                          }
                        />
                        <Label htmlFor="is_new">Новинка (бейдж NEW)</Label>
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
                        <Label htmlFor="gender">Пол</Label>
                        <Select
                          value={formData.gender}
                          onValueChange={(value) =>
                            setFormData({ ...formData, gender: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите пол" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="women">Женское</SelectItem>
                            <SelectItem value="men">Мужское</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="material">Материал (для фильтров)</Label>
                        <Input
                          id="material"
                          value={formData.material}
                          onChange={(e) =>
                            setFormData({ ...formData, material: e.target.value })
                          }
                          placeholder="Хлопок, Шерсть, Лён..."
                        />
                      </div>

                      <div>
                        <Label htmlFor="composition">Состав (полное описание)</Label>
                        <Textarea
                          id="composition"
                          value={formData.composition}
                          onChange={(e) =>
                            setFormData({ ...formData, composition: e.target.value })
                          }
                          placeholder="100% хлопок, 5% эластан"
                          rows={2}
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
                        <Label>Количество по размерам</Label>
                        <p className="text-xs text-muted-foreground mt-1 mb-2">
                          Укажите количество для каждого размера. Размеры с 0 не будут показаны на сайте.
                        </p>
                        <div className="grid grid-cols-4 gap-3 mt-2 p-3 border rounded-md">
                          {availableSizeOptions.map((size) => (
                            <div key={size} className="flex items-center gap-2">
                              <span className="text-sm w-12">{size}:</span>
                              <Input
                                type="number"
                                min="0"
                                className="w-20"
                                value={formData.size_quantities[size] || ''}
                                placeholder="0"
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  setFormData({
                                    ...formData,
                                    size_quantities: {
                                      ...formData.size_quantities,
                                      [size]: value
                                    }
                                  });
                                }}
                              />
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2 mt-3">
                          <Input
                            placeholder="Добавить свой размер"
                            value={customSizeInput}
                            onChange={(e) => setCustomSizeInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (customSizeInput.trim()) {
                                  setFormData({
                                    ...formData,
                                    size_quantities: {
                                      ...formData.size_quantities,
                                      [customSizeInput.trim()]: 0
                                    }
                                  });
                                  setCustomSizeInput('');
                                }
                              }
                            }}
                          />
                          <Button type="button" variant="outline" onClick={() => {
                            if (customSizeInput.trim()) {
                              setFormData({
                                ...formData,
                                size_quantities: {
                                  ...formData.size_quantities,
                                  [customSizeInput.trim()]: 0
                                }
                              });
                              setCustomSizeInput('');
                            }
                          }}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        {Object.keys(formData.size_quantities).filter(s => !availableSizeOptions.includes(s)).length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm text-muted-foreground mb-2">Дополнительные размеры:</p>
                            <div className="flex flex-wrap gap-3">
                              {Object.entries(formData.size_quantities)
                                .filter(([size]) => !availableSizeOptions.includes(size))
                                .map(([size, qty]) => (
                                  <div key={size} className="flex items-center gap-2 bg-secondary px-2 py-1 rounded">
                                    <span className="text-sm">{size}:</span>
                                    <Input
                                      type="number"
                                      min="0"
                                      className="w-16 h-7"
                                      value={qty || ''}
                                      placeholder="0"
                                      onChange={(e) => {
                                        const value = parseInt(e.target.value) || 0;
                                        setFormData({
                                          ...formData,
                                          size_quantities: {
                                            ...formData.size_quantities,
                                            [size]: value
                                          }
                                        });
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newSizeQty = { ...formData.size_quantities };
                                        delete newSizeQty[size];
                                        setFormData({ ...formData, size_quantities: newSizeQty });
                                      }}
                                      className="hover:text-destructive"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <Label>Доступные цвета</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setColorManagementOpen(true)}
                            className="h-7 px-2 text-xs"
                          >
                            <Settings className="w-3 h-3 mr-1" />
                            Управление
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2 p-3 border rounded-md">
                          {availableColorOptions.map((color) => (
                            <label
                              key={color}
                              className="flex items-center gap-2 cursor-pointer hover:bg-muted px-3 py-1.5 rounded"
                            >
                              <Checkbox
                                checked={formData.available_colors.includes(color)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFormData({
                                      ...formData,
                                      available_colors: [...formData.available_colors, color]
                                    });
                                  } else {
                                    // Удаляем ТОЛЬКО из available_colors, color_links не трогаем
                                    setFormData({
                                      ...formData,
                                      available_colors: formData.available_colors.filter(c => c !== color)
                                    });
                                  }
                                }}
                              />
                              <span className="text-sm">{color}</span>
                            </label>
                          ))}
                        </div>
                        
                        <div className="flex gap-2 mt-3">
                          <Input
                            placeholder="Добавить свой цвет"
                            value={customColorInput}
                            onChange={(e) => setCustomColorInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addCustomColor();
                              }
                            }}
                          />
                          <Button type="button" variant="outline" onClick={addCustomColor}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        {formData.available_colors.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm text-muted-foreground mb-2">Выбрано:</p>
                            <div className="flex flex-wrap gap-2">
                              {formData.available_colors.map((color) => (
                                <div
                                  key={color}
                                  className="inline-flex items-center gap-1 bg-secondary px-2 py-1 rounded text-sm"
                                >
                                  {color}
                                  <button
                                    type="button"
                                    onClick={() => removeColor(color)}
                                    className="hover:text-destructive"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Color Links - независимая секция для ссылок на товары в других цветах */}
                      <div>
                        <Label>Ссылки на товары в других цветах</Label>
                        <p className="text-xs text-muted-foreground mt-1 mb-2">
                          Выберите цвета для ссылок на этот же товар в других цветах
                        </p>

                        {/* Чекбоксы для выбора цветов */}
                        <div className="flex flex-wrap gap-2 mt-2 p-3 border rounded-md">
                          {availableColorOptions.map((color) => (
                            <label
                              key={color}
                              className="flex items-center gap-2 cursor-pointer hover:bg-muted px-3 py-1.5 rounded"
                            >
                              <Checkbox
                                checked={color in formData.color_links}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    addColorLink(color);
                                  } else {
                                    removeColorLink(color);
                                  }
                                }}
                              />
                              <span className="text-sm">{color}</span>
                            </label>
                          ))}
                        </div>

                        {/* Input для добавления своего цвета */}
                        <div className="flex gap-2 mt-3">
                          <Input
                            placeholder="Добавить свой цвет"
                            value={customColorLinkInput}
                            onChange={(e) => setCustomColorLinkInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addCustomColorLink();
                              }
                            }}
                          />
                          <Button type="button" variant="outline" onClick={addCustomColorLink}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Выбранные цвета с полями для ссылок */}
                        {Object.keys(formData.color_links).length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm text-muted-foreground mb-2">Выбрано (укажите ссылки):</p>
                            <div className="space-y-2">
                              {Object.entries(formData.color_links).map(([color, link]) => (
                                <div key={color} className="flex items-center gap-2">
                                  <span className="text-sm w-28 shrink-0">{color}:</span>
                                  <Input
                                    placeholder="/product/..."
                                    value={link}
                                    onChange={(e) => setFormData({
                                      ...formData,
                                      color_links: {
                                        ...formData.color_links,
                                        [color]: e.target.value
                                      }
                                    })}
                                    className="flex-1"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeColorLink(color)}
                                    className="hover:text-destructive"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
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
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Название</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Цена</TableHead>
                <TableHead>Склад</TableHead>
                <TableHead>NEW</TableHead>
                <TableHead>SALE</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow 
                  key={product.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, product)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, product)}
                  className={`cursor-move ${draggedItem?.id === product.id ? 'opacity-50' : ''}`}
                >
                  <TableCell>
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {product.slug}
                  </TableCell>
                  <TableCell>{product.price} ₽</TableCell>
                  <TableCell>{product.stock_quantity}</TableCell>
                  <TableCell>{product.is_new ? '✓' : '—'}</TableCell>
                  <TableCell>{product.is_sale ? '✓' : '—'}</TableCell>
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

      {/* Модалка управления цветами */}
      <Dialog open={colorManagementOpen} onOpenChange={setColorManagementOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Управление цветами</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {dbColors.map((color) => (
                <div
                  key={color.name}
                  className="flex items-center justify-between p-2 border rounded hover:bg-muted"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: color.hex_code }}
                    />
                    <span>{color.name}</span>
                    <span className="text-xs text-muted-foreground">{color.hex_code}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteColorFromDb(color.name)}
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Новый цвет..."
                value={newColorInput}
                onChange={(e) => setNewColorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addColorToDb();
                  }
                }}
                className="flex-1"
              />
              <input
                type="color"
                value={newColorHex}
                onChange={(e) => setNewColorHex(e.target.value)}
                className="w-10 h-10 rounded border cursor-pointer"
                title="Выберите цвет"
              />
              <Button type="button" onClick={addColorToDb}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;