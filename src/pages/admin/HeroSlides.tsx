import { useState } from "react";
import { useHeroSlides, useUpdateHeroSlide } from "@/hooks/useHeroSlides";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ImageUploader } from "@/components/admin/ImageUploader";

export default function HeroSlides() {
  const { data: slides, isLoading } = useHeroSlides();
  const updateSlide = useUpdateHeroSlide();

  const handleUpdate = (id: string, updates: any) => {
    updateSlide.mutate({ id, ...updates });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const activeSlide = slides?.[0];

  if (!activeSlide) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Главное фото</h1>
          <p className="text-muted-foreground mt-2">
            Фоновое изображение главной страницы
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Нет данных. Обратитесь к администратору.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Главное фото</h1>
        <p className="text-muted-foreground mt-2">
          Фоновое изображение главной страницы под разные размеры экрана
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Заголовок на главной</CardTitle>
          <CardDescription>Текст, который отображается поверх фото</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Заголовок</Label>
              <Input
                value={activeSlide.title}
                onChange={(e) => handleUpdate(activeSlide.id, { title: e.target.value })}
                placeholder="FEEL THE MOMENT"
              />
            </div>

            <div className="space-y-2">
              <Label>Подзаголовок (опционально)</Label>
              <Input
                value={activeSlide.subtitle || ""}
                onChange={(e) => handleUpdate(activeSlide.id, { subtitle: e.target.value })}
                placeholder="Описание"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={activeSlide.is_active}
              onCheckedChange={(checked) => handleUpdate(activeSlide.id, { is_active: checked })}
            />
            <Label>Показывать на сайте</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Фоновые изображения</CardTitle>
          <CardDescription>
            Загрузите отдельные фото для разных устройств. Если планшет или мобильная версия не загружены — используется desktop.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-base font-medium">Desktop</Label>
              <p className="text-xs text-muted-foreground">1920×1080 px</p>
              <ImageUploader
                bucket="site-images"
                currentImageUrl={activeSlide.image_url}
                onUploadComplete={(url) => handleUpdate(activeSlide.id, { image_url: url })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-medium">Планшет</Label>
              <p className="text-xs text-muted-foreground">1024×768 px (опционально)</p>
              <ImageUploader
                bucket="site-images"
                currentImageUrl={activeSlide.image_url_tablet || ""}
                onUploadComplete={(url) => handleUpdate(activeSlide.id, { image_url_tablet: url })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-medium">Мобильный</Label>
              <p className="text-xs text-muted-foreground">480×800 px (опционально)</p>
              <ImageUploader
                bucket="site-images"
                currentImageUrl={activeSlide.image_url_mobile || ""}
                onUploadComplete={(url) => handleUpdate(activeSlide.id, { image_url_mobile: url })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
