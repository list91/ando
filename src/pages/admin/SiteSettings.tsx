import { useState } from 'react';
import { useSiteSettings, useUpdateSiteSetting } from '@/hooks/useSiteSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save } from 'lucide-react';
import { ImageUploader } from '@/components/admin/ImageUploader';

export default function SiteSettings() {
  const { data: settings, isLoading } = useSiteSettings();
  const updateSetting = useUpdateSiteSetting();

  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleInputChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key: string) => {
    const setting = settings?.find((s) => s.key === key);
    if (!setting || !formData[key]) return;

    await updateSetting.mutateAsync({
      id: setting.id,
      value: formData[key],
    });

    setFormData((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  const getSettingValue = (key: string, defaultValue: any = '') => {
    if (formData[key] !== undefined) return formData[key];
    const setting = settings?.find((s) => s.key === key);
    return setting?.value || defaultValue;
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
        <h1 className="text-3xl font-bold">Настройки сайта</h1>
        <p className="text-muted-foreground mt-2">
          Управление основными настройками и контактной информацией
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Основная информация</CardTitle>
          <CardDescription>Название сайта и контактные данные</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="site-name">Название сайта</Label>
            <div className="flex gap-2">
              <Input
                id="site-name"
                value={getSettingValue('site_name')}
                onChange={(e) => handleInputChange('site_name', e.target.value)}
                placeholder="Введите название сайта"
              />
              <Button
                onClick={() => handleSave('site_name')}
                disabled={!formData.site_name}
              >
                <Save className="h-4 w-4 mr-2" />
                Сохранить
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-email">Email для связи</Label>
            <div className="flex gap-2">
              <Input
                id="contact-email"
                type="email"
                value={getSettingValue('contact_email')}
                onChange={(e) => handleInputChange('contact_email', e.target.value)}
                placeholder="email@example.com"
              />
              <Button
                onClick={() => handleSave('contact_email')}
                disabled={!formData.contact_email}
              >
                <Save className="h-4 w-4 mr-2" />
                Сохранить
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-phone">Телефон</Label>
            <div className="flex gap-2">
              <Input
                id="contact-phone"
                value={getSettingValue('contact_phone')}
                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                placeholder="+7 (XXX) XXX-XX-XX"
              />
              <Button
                onClick={() => handleSave('contact_phone')}
                disabled={!formData.contact_phone}
              >
                <Save className="h-4 w-4 mr-2" />
                Сохранить
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-address">Адрес</Label>
            <div className="flex gap-2">
              <Textarea
                id="contact-address"
                value={getSettingValue('contact_address')}
                onChange={(e) => handleInputChange('contact_address', e.target.value)}
                placeholder="Введите адрес"
                rows={3}
              />
              <Button
                onClick={() => handleSave('contact_address')}
                disabled={!formData.contact_address}
              >
                <Save className="h-4 w-4 mr-2" />
                Сохранить
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Логотип</CardTitle>
          <CardDescription>Загрузите логотип сайта</CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUploader
            bucket="site-images"
            currentImageUrl={getSettingValue('logo_url')}
            onUploadComplete={(url) => {
              const setting = settings?.find((s) => s.key === 'logo_url');
              if (setting) {
                updateSetting.mutate({ id: setting.id, value: url });
              }
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Социальные сети</CardTitle>
          <CardDescription>Ссылки на социальные сети</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram</Label>
            <div className="flex gap-2">
              <Input
                id="instagram"
                value={getSettingValue('social_instagram')}
                onChange={(e) => handleInputChange('social_instagram', e.target.value)}
                placeholder="https://instagram.com/..."
              />
              <Button
                onClick={() => handleSave('social_instagram')}
                disabled={!formData.social_instagram}
              >
                <Save className="h-4 w-4 mr-2" />
                Сохранить
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telegram">Telegram</Label>
            <div className="flex gap-2">
              <Input
                id="telegram"
                value={getSettingValue('social_telegram')}
                onChange={(e) => handleInputChange('social_telegram', e.target.value)}
                placeholder="https://t.me/..."
              />
              <Button
                onClick={() => handleSave('social_telegram')}
                disabled={!formData.social_telegram}
              >
                <Save className="h-4 w-4 mr-2" />
                Сохранить
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vk">VKontakte</Label>
            <div className="flex gap-2">
              <Input
                id="vk"
                value={getSettingValue('social_vk')}
                onChange={(e) => handleInputChange('social_vk', e.target.value)}
                placeholder="https://vk.com/..."
              />
              <Button
                onClick={() => handleSave('social_vk')}
                disabled={!formData.social_vk}
              >
                <Save className="h-4 w-4 mr-2" />
                Сохранить
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
