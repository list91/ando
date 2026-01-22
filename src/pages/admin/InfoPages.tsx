import { useState } from 'react';
import {
  useInfoPages,
  useCreateInfoPage,
  useUpdateInfoPage,
  useDeleteInfoPage,
  InfoPage,
} from '@/hooks/useInfoPages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { Loader2, Plus, Edit, Trash2, Eye, EyeOff, Save, X, Image } from 'lucide-react';

export default function InfoPages() {
  const { data: pages, isLoading } = useInfoPages();
  const createPage = useCreateInfoPage();
  const updatePage = useUpdateInfoPage();
  const deletePage = useDeleteInfoPage();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletePageId, setDeletePageId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const [formData, setFormData] = useState({
    page_key: '',
    title: '',
    content: '',
    image_url: '',
    display_order: 0,
    is_visible: true,
  });

  const resetForm = () => {
    setFormData({
      page_key: '',
      title: '',
      content: '',
      image_url: '',
      display_order: 0,
      is_visible: true,
    });
    setShowNewForm(false);
    setEditingId(null);
  };

  const handleEdit = (page: InfoPage) => {
    setFormData({
      page_key: page.page_key,
      title: page.title,
      content: page.content,
      image_url: page.image_url || '',
      display_order: page.display_order,
      is_visible: page.is_visible,
    });
    setEditingId(page.id);
    setShowNewForm(false);
  };

  const handleSave = async () => {
    if (editingId) {
      await updatePage.mutateAsync({ id: editingId, ...formData });
    } else {
      const maxOrder = pages?.reduce((max, p) => Math.max(max, p.display_order), -1) ?? -1;
      await createPage.mutateAsync({ ...formData, display_order: maxOrder + 1 });
    }
    resetForm();
  };

  const handleToggleVisibility = async (page: InfoPage) => {
    await updatePage.mutateAsync({
      id: page.id,
      is_visible: !page.is_visible,
    });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Информационные страницы</h1>
          <p className="text-muted-foreground mt-2">
            Управление страницами доставки, оплаты и другой информации
          </p>
        </div>
        <Button onClick={() => setShowNewForm(true)} disabled={showNewForm || !!editingId}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить страницу
        </Button>
      </div>

      {(showNewForm || editingId) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Редактировать страницу' : 'Новая страница'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="page-key">Ключ страницы</Label>
              <Input
                id="page-key"
                value={formData.page_key}
                onChange={(e) => setFormData({ ...formData, page_key: e.target.value })}
                placeholder="delivery, payment, etc."
                disabled={!!editingId}
              />
              <p className="text-xs text-muted-foreground">
                Уникальный идентификатор для URL (латиница, без пробелов)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Название</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Доставка и оплата"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Изображение
              </Label>
              <ImageUploader
                bucket="site-images"
                currentImageUrl={formData.image_url || undefined}
                onUploadComplete={(url) => setFormData({ ...formData, image_url: url })}
                maxSizeMB={2}
              />
              <p className="text-xs text-muted-foreground">
                Рекомендуемый размер: 1200×800 px • Макс. вес: 2 MB • Форматы: PNG, SVG, WEBP
              </p>
            </div>

            {/* Скрыто: управление видимостью
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_visible}
                onCheckedChange={(checked) => setFormData({ ...formData, is_visible: checked })}
              />
              <Label>Показывать на сайте</Label>
            </div>
            */}

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={!formData.page_key || !formData.title || !formData.image_url}
              >
                <Save className="h-4 w-4 mr-2" />
                Сохранить
              </Button>
              <Button variant="outline" onClick={resetForm}>
                <X className="h-4 w-4 mr-2" />
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {pages?.map((page) => (
          <Card key={page.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{page.title}</h3>
                    {/* Скрыто: переключатель видимости
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={page.is_visible}
                        onCheckedChange={() => handleToggleVisibility(page)}
                      />
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        {page.is_visible ? (
                          <>
                            <Eye className="h-3 w-3" />
                            Видна
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3" />
                            Скрыта
                          </>
                        )}
                      </span>
                    </div>
                    */}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Ключ: <code className="bg-muted px-1 rounded">{page.page_key}</code>
                  </p>
                  <p className="text-sm line-clamp-2">{page.content}</p>
                  {page.image_url && (
                    <div className="mt-2 flex items-center gap-2">
                      <Image className="h-4 w-4 text-muted-foreground" />
                      <img
                        src={page.image_url}
                        alt="Превью"
                        className="h-12 rounded border"
                      />
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(page)}
                    disabled={!!editingId || showNewForm}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletePageId(page.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DeleteConfirmDialog
        open={!!deletePageId}
        onOpenChange={() => setDeletePageId(null)}
        onConfirm={() => {
          if (deletePageId) {
            deletePage.mutate(deletePageId);
            setDeletePageId(null);
          }
        }}
        title="Удалить страницу?"
        itemName={pages?.find((p) => p.id === deletePageId)?.title}
      />
    </div>
  );
}
