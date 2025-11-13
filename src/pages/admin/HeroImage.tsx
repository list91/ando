import { useState, useEffect } from "react";
import { useSiteSettings, useUpdateSiteSetting, useCreateSiteSetting } from "@/hooks/useSiteSettings";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ImageUploader } from "@/components/admin/ImageUploader";

export default function HeroImage() {
  const { data: settings, isLoading } = useSiteSettings();
  const updateSetting = useUpdateSiteSetting();
  const createSetting = useCreateSiteSetting();
  const [imageUrl, setImageUrl] = useState("");
  const [settingId, setSettingId] = useState<string | null>(null);

  useEffect(() => {
    const heroImageSetting = settings?.find(s => s.key === 'hero_image');
    if (heroImageSetting) {
      setImageUrl(heroImageSetting.value as string || "");
      setSettingId(heroImageSetting.id);
    }
  }, [settings]);

  const handleSave = () => {
    if (settingId) {
      updateSetting.mutate({
        id: settingId,
        value: imageUrl,
      });
    } else {
      createSetting.mutate({
        key: 'hero_image',
        value: imageUrl,
        category: 'homepage',
        description: 'Главное изображение на главной странице'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Главное изображение</h1>
        <p className="text-muted-foreground mt-2">
          Управление главным изображением на главной странице
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Главное изображение</CardTitle>
          <CardDescription>Загрузите горизонтальную фотографию для главной страницы</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Изображение</Label>
            <ImageUploader
              bucket="site-images"
              currentImageUrl={imageUrl}
              onUploadComplete={(url) => setImageUrl(url)}
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={!imageUrl || updateSetting.isPending || createSetting.isPending}
          >
            {(updateSetting.isPending || createSetting.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Сохранить
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
