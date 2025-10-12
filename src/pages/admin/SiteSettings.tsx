import { useState } from 'react';
import { useSiteSettings, useUpdateSiteSetting } from '@/hooks/useSiteSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, Plus, Trash2 } from 'lucide-react';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { toast } from 'sonner';

export default function SiteSettings() {
  const { data: settings, isLoading } = useSiteSettings();
  const updateSetting = useUpdateSiteSetting();

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');

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

  const productColors = getSettingValue('product_colors', {}) as Record<string, string>;

  const handleAddColor = () => {
    if (!newColorName.trim() || !newColorHex) {
      toast.error('Заполните название и выберите цвет');
      return;
    }

    const setting = settings?.find((s) => s.key === 'product_colors');
    const updatedColors = {
      ...productColors,
      [newColorName.toLowerCase().trim()]: newColorHex
    };

    if (setting) {
      updateSetting.mutate(
        { id: setting.id, value: updatedColors },
        {
          onSuccess: () => {
            setNewColorName('');
            setNewColorHex('#000000');
            toast.success('Цвет добавлен');
          }
        }
      );
    }
  };

  const handleDeleteColor = (colorName: string) => {
    const setting = settings?.find((s) => s.key === 'product_colors');
    const updatedColors = { ...productColors };
    delete updatedColors[colorName];

    if (setting) {
      updateSetting.mutate(
        { id: setting.id, value: updatedColors },
        {
          onSuccess: () => {
            toast.success('Цвет удален');
          }
        }
      );
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

      <Card>
        <CardHeader>
          <CardTitle>Цвета товаров</CardTitle>
          <CardDescription>Управление доступными цветами для товаров</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color-name">Название цвета</Label>
                <Input
                  id="color-name"
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  placeholder="Например: темно-синий"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color-hex">Hex код цвета</Label>
                <div className="flex gap-2">
                  <Input
                    id="color-hex"
                    type="color"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="w-20 h-10 p-1"
                  />
                  <Input
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>
            <Button onClick={handleAddColor} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Добавить цвет
            </Button>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">Существующие цвета</p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {Object.entries(productColors).map(([name, hex]) => (
                <div key={name} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full border border-border flex-shrink-0"
                      style={{ backgroundColor: hex }}
                    />
                    <div>
                      <p className="font-medium text-sm capitalize">{name}</p>
                      <p className="text-xs text-muted-foreground">{hex}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteColor(name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
