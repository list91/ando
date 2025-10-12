import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, GripVertical, Eye } from 'lucide-react';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

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
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: 'Ошибка',
        description: 'Файл слишком большой. Максимум 5MB',
        variant: 'destructive',
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Ошибка',
        description: 'Можно загружать только изображения',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${productId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('product-images').getPublicUrl(fileName);

      const maxOrder = images.length > 0 
        ? Math.max(...images.map(img => img.display_order))
        : -1;

      const { error: insertError } = await supabase
        .from('product_images')
        .insert({
          product_id: productId,
          image_url: publicUrl,
          alt_text: file.name.replace(/\.[^/.]+$/, ''),
          display_order: maxOrder + 1,
        });

      if (insertError) throw insertError;

      toast({ title: 'Изображение загружено' });
      fetchImages();
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить изображение',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
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

  const moveImage = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === images.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const imageToMove = images[index];
    const imageToSwap = images[newIndex];

    updateDisplayOrder(imageToMove.id, imageToSwap.display_order);
    updateDisplayOrder(imageToSwap.id, imageToMove.display_order);
  };

  if (loading) {
    return <div className="p-4">Загрузка...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="image-upload" className="block mb-2">
          Изображения товара
        </Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => document.getElementById('image-upload')?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Загрузка...' : 'Добавить изображение'}
          </Button>
          <Input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Максимальный размер: 5MB. Форматы: JPG, PNG, WEBP
        </p>
      </div>

      {images.length > 0 ? (
        <div className="grid gap-4">
          {images.map((image, index) => (
            <Card key={image.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex flex-col justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveImage(index, 'up')}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <GripVertical className="w-4 h-4 mx-auto text-muted-foreground" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveImage(index, 'down')}
                      disabled={index === images.length - 1}
                    >
                      ↓
                    </Button>
                  </div>

                  <div className="relative w-32 h-32 flex-shrink-0">
                    <img
                      src={image.image_url}
                      alt={image.alt_text || ''}
                      className="w-full h-full object-cover rounded"
                    />
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
                    <p className="text-sm text-muted-foreground">
                      Порядок отображения: {image.display_order + 1}
                    </p>
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
