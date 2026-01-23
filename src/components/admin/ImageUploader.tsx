import { useState, useId } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  bucket: string;
  onUploadComplete: (url: string) => void;
  currentImageUrl?: string;
  maxSizeMB?: number;
}

export const ImageUploader = ({
  bucket,
  onUploadComplete,
  currentImageUrl,
  maxSizeMB = 5,
}: ImageUploaderProps) => {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast({
        title: 'Ошибка',
        description: `Размер файла не должен превышать ${maxSizeMB}MB`,
        variant: 'destructive',
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, выберите изображение',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

      setPreviewUrl(data.publicUrl);
      onUploadComplete(data.publicUrl);

      toast({
        title: 'Успешно',
        description: 'Изображение загружено',
      });
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onUploadComplete('');
  };

  return (
    <div className="space-y-4">
      {/* Всегда показываем кнопку загрузки */}
      <div className="border-2 border-dashed rounded-lg p-6 text-center">
        <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
        <div className="space-y-2">
          <label htmlFor={inputId} className="cursor-pointer">
            <Button type="button" variant="outline" disabled={uploading} asChild>
              <span>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  'Выбрать изображение'
                )}
              </span>
            </Button>
          </label>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          <p className="text-sm text-muted-foreground">
            PNG, JPG, WEBP до {maxSizeMB}MB
          </p>
        </div>
      </div>

      {/* Показываем превью последней загрузки если есть */}
      {previewUrl && (
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-16 h-16 object-cover rounded border"
          />
          <div className="flex-1 text-sm text-muted-foreground">
            Последнее загруженное
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
