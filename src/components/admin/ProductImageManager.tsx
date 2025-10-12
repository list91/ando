import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, GripVertical, Eye, Star } from 'lucide-react';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { Badge } from '@/components/ui/badge';

interface ProductImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  display_order: number;
}

interface ProductImageManagerProps {
  productId: string;
}

export const ProductImageManager = ({ productId }: ProductImageManagerProps) => {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingImage, setDeletingImage] = useState<ProductImage | null>(null);
  const [draggedItem, setDraggedItem] = useState<ProductImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchImages();
  }, [productId]);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить изображения',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    await uploadMultipleFiles(files);
    if (e.target) e.target.value = '';
  };

  const uploadMultipleFiles = async (files: File[]) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    // Validate all files first
    for (const file of files) {
      if (file.size > maxSize) {
        toast({
          title: 'Ошибка',
          description: `Файл ${file.name} слишком большой. Максимум 5MB`,
          variant: 'destructive',
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Ошибка',
          description: `Файл ${file.name} не является изображением`,
          variant: 'destructive',
        });
        return;
      }
    }

    setUploading(true);
    try {
      const maxOrder = images.length > 0 
        ? Math.max(...images.map(img => img.display_order))
        : -1;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${productId}/${Date.now()}-${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('product-images').getPublicUrl(fileName);

        const { error: insertError } = await supabase
          .from('product_images')
          .insert({
            product_id: productId,
            image_url: publicUrl,
            alt_text: file.name.replace(/\.[^/.]+$/, ''),
            display_order: maxOrder + 1 + i,
          });

        if (insertError) throw insertError;
      }

      toast({ 
        title: files.length === 1 
          ? 'Изображение загружено' 
          : `Загружено ${files.length} изображений` 
      });
      fetchImages();
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить изображения',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    await uploadMultipleFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDelete = async () => {
    if (!deletingImage) return;

    try {
      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('id', deletingImage.id);

      if (error) throw error;
      toast({ title: 'Изображение удалено' });
      fetchImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить изображение',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingImage(null);
    }
  };

  const openDeleteDialog = (image: ProductImage) => {
    setDeletingImage(image);
    setDeleteDialogOpen(true);
  };

  const updateAltText = async (imageId: string, altText: string) => {
    try {
      const { error } = await supabase
        .from('product_images')
        .update({ alt_text: altText })
        .eq('id', imageId);

      if (error) throw error;
      toast({ title: 'Alt-текст обновлен' });
    } catch (error) {
      console.error('Error updating alt text:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить alt-текст',
        variant: 'destructive',
      });
    }
  };

  const updateDisplayOrder = async (imageId: string, newOrder: number) => {
    try {
      const { error } = await supabase
        .from('product_images')
        .update({ display_order: newOrder })
        .eq('id', imageId);

      if (error) throw error;
      fetchImages();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось изменить порядок',
        variant: 'destructive',
      });
    }
  };

  const handleImageDragStart = (e: React.DragEvent, image: ProductImage) => {
    setDraggedItem(image);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleImageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleImageDrop = async (e: React.DragEvent, targetImage: ProductImage) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.id === targetImage.id) return;

    const draggedIndex = images.findIndex(img => img.id === draggedItem.id);
    const targetIndex = images.findIndex(img => img.id === targetImage.id);

    const newOrder = [...images];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);

    try {
      const updates = newOrder.map((img, index) => 
        supabase
          .from('product_images')
          .update({ display_order: index })
          .eq('id', img.id)
      );

      await Promise.all(updates);
      toast({ title: 'Порядок изображений обновлен' });
      fetchImages();
    } catch (error) {
      console.error('Error updating image order:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить порядок',
        variant: 'destructive',
      });
    }

    setDraggedItem(null);
  };

  const setAsPrimary = async (imageId: string) => {
    try {
      const imageToMove = images.find(img => img.id === imageId);
      if (!imageToMove) return;

      // Set this image to order 0, and shift all others down
      const updates = images.map((img) => {
        if (img.id === imageId) {
          return supabase
            .from('product_images')
            .update({ display_order: 0 })
            .eq('id', img.id);
        } else if (img.display_order < imageToMove.display_order) {
          return supabase
            .from('product_images')
            .update({ display_order: img.display_order + 1 })
            .eq('id', img.id);
        }
        return Promise.resolve();
      });

      await Promise.all(updates.filter(u => u));
      toast({ title: 'Главное изображение установлено' });
      fetchImages();
    } catch (error) {
      console.error('Error setting primary image:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось установить главное изображение',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="p-4">Загрузка...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="block mb-2">Изображения товара</Label>
        <div 
          className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm mb-2">
            Перетащите файлы сюда или
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? 'Загрузка...' : 'Выберите файлы'}
          </Button>
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <p className="text-xs text-muted-foreground mt-3">
            Максимум 5MB на файл. Форматы: JPG, PNG, WEBP. Можно загрузить несколько файлов.
          </p>
        </div>
      </div>

      {images.length > 0 ? (
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            Первое изображение используется как главное. Перетаскивайте для изменения порядка.
          </p>
          <div className="grid gap-4">
            {images.map((image, index) => (
              <Card 
                key={image.id}
                draggable
                onDragStart={(e) => handleImageDragStart(e, image)}
                onDragOver={handleImageDragOver}
                onDrop={(e) => handleImageDrop(e, image)}
                className={`cursor-move ${draggedItem?.id === image.id ? 'opacity-50' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="flex flex-col justify-center">
                      <GripVertical className="w-5 h-5 mx-auto text-muted-foreground" />
                    </div>

                    <div className="relative w-32 h-32 flex-shrink-0">
                      <img
                        src={image.image_url}
                        alt={image.alt_text || ''}
                        className="w-full h-full object-cover rounded"
                      />
                      {index === 0 && (
                        <Badge className="absolute top-1 left-1 bg-primary">
                          <Star className="w-3 h-3 mr-1" />
                          Главное
                        </Badge>
                      )}
                      <a
                        href={image.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-1 right-1 p-1 bg-background/80 rounded hover:bg-background"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                    </div>

                    <div className="flex-1 space-y-2">
                      <div>
                        <Label htmlFor={`alt-${image.id}`}>Alt-текст</Label>
                        <Input
                          id={`alt-${image.id}`}
                          defaultValue={image.alt_text || ''}
                          onBlur={(e) =>
                            updateAltText(image.id, e.target.value)
                          }
                          placeholder="Описание изображения для SEO"
                          maxLength={200}
                        />
                      </div>
                      <div className="flex gap-2">
                        {index !== 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setAsPrimary(image.id)}
                          >
                            <Star className="w-4 h-4 mr-1" />
                            Сделать главным
                          </Button>
                        )}
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteDialog(image)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          Изображения не загружены. Добавьте первое изображение.
        </div>
      )}

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Удалить изображение?"
        description="Это действие нельзя отменить."
      />
    </div>
  );
};
