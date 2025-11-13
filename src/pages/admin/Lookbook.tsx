import { useState } from 'react';
import {
  useLookbookSeasons,
  useLookbookImages,
  useCreateLookbookSeason,
  useUpdateLookbookSeason,
  useDeleteLookbookSeason,
  useCreateLookbookImage,
  useUpdateLookbookImage,
  useDeleteLookbookImage,
  LookbookSeason,
  LookbookImage,
} from '@/hooks/useLookbook';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import { Loader2, Plus, Trash2, Eye, EyeOff, Edit2, GripVertical } from 'lucide-react';

export default function Lookbook() {
  const { data: seasons, isLoading: seasonsLoading } = useLookbookSeasons();
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | undefined>();
  const { data: images, isLoading: imagesLoading } = useLookbookImages(selectedSeasonId);
  
  const createSeason = useCreateLookbookSeason();
  const updateSeason = useUpdateLookbookSeason();
  const deleteSeason = useDeleteLookbookSeason();
  const createImage = useCreateLookbookImage();
  const updateImage = useUpdateLookbookImage();
  const deleteImage = useDeleteLookbookImage();

  // Season form state
  const [isEditingSeason, setIsEditingSeason] = useState(false);
  const [editingSeasonId, setEditingSeasonId] = useState<string | null>(null);
  const [seasonForm, setSeasonForm] = useState({
    season_name: '',
    slug: '',
    short_description: '',
    cover_image_url: '',
    title: '',
    subtitle: '',
    description: '',
  });

  // Image editing state
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [imageForm, setImageForm] = useState({
    caption: '',
    alt_text: '',
  });

  const [deleteSeasonId, setDeleteSeasonId] = useState<string | null>(null);
  const [deleteImageId, setDeleteImageId] = useState<string | null>(null);
  const [photographerCredit, setPhotographerCredit] = useState('');

  const resetSeasonForm = () => {
    setSeasonForm({
      season_name: '',
      slug: '',
      short_description: '',
      cover_image_url: '',
      title: '',
      subtitle: '',
      description: '',
    });
    setIsEditingSeason(false);
    setEditingSeasonId(null);
  };

  const handleEditSeason = (season: LookbookSeason) => {
    setSeasonForm({
      season_name: season.season_name,
      slug: season.slug,
      short_description: season.short_description || '',
      cover_image_url: season.cover_image_url || '',
      title: season.title || '',
      subtitle: season.subtitle || '',
      description: season.description || '',
    });
    setEditingSeasonId(season.id);
    setIsEditingSeason(true);
  };

  const handleSaveSeason = async () => {
    if (!seasonForm.season_name.trim() || !seasonForm.slug.trim()) return;

    if (editingSeasonId) {
      await updateSeason.mutateAsync({
        id: editingSeasonId,
        ...seasonForm,
      });
    } else {
      const maxOrder = seasons?.reduce((max, s) => Math.max(max, s.display_order), -1) ?? -1;
      await createSeason.mutateAsync({
        ...seasonForm,
        display_order: maxOrder + 1,
        is_active: true,
      });
    }
    resetSeasonForm();
  };

  const handleToggleActive = async (season: LookbookSeason) => {
    await updateSeason.mutateAsync({
      id: season.id,
      is_active: !season.is_active,
    });
  };

  const handleAddImage = async (url: string) => {
    if (!selectedSeasonId) return;

    const maxOrder = images?.reduce((max, img) => Math.max(max, img.display_order), -1) ?? -1;
    await createImage.mutateAsync({
      season_id: selectedSeasonId,
      image_url: url,
      display_order: maxOrder + 1,
      photographer_credit: photographerCredit || undefined,
      is_visible: true,
    });
    setPhotographerCredit('');
  };

  const handleEditImage = (image: LookbookImage) => {
    setEditingImageId(image.id);
    setImageForm({
      caption: image.caption || '',
      alt_text: image.alt_text || '',
    });
  };

  const handleSaveImage = async () => {
    if (!editingImageId) return;

    await updateImage.mutateAsync({
      id: editingImageId,
      ...imageForm,
    });
    setEditingImageId(null);
  };

  const handleToggleImageVisibility = async (image: LookbookImage) => {
    await updateImage.mutateAsync({
      id: image.id,
      is_visible: !image.is_visible,
    });
  };

  const handleCoverImageUpload = (url: string) => {
    setSeasonForm(prev => ({ ...prev, cover_image_url: url }));
  };

  if (seasonsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Лукбук</h1>
        <p className="text-muted-foreground mt-2">
          Управление лукбуками и изображениями
        </p>
      </div>

      {/* Season Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditingSeason ? 'Редактировать лукбук' : 'Создать лукбук'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Название*</Label>
              <Input
                value={seasonForm.season_name}
                onChange={(e) => setSeasonForm(prev => ({ ...prev, season_name: e.target.value }))}
                placeholder="Например: Весна 2024"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug (URL)*</Label>
              <Input
                value={seasonForm.slug}
                onChange={(e) => setSeasonForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                placeholder="vesna-2024"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Краткое описание для плитки</Label>
            <Textarea
              value={seasonForm.short_description}
              onChange={(e) => setSeasonForm(prev => ({ ...prev, short_description: e.target.value }))}
              placeholder="Краткое описание для списка лукбуков"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Обложка</Label>
            <ImageUploader
              bucket="site-images"
              onUploadComplete={handleCoverImageUpload}
            />
            {seasonForm.cover_image_url && (
              <img src={seasonForm.cover_image_url} alt="Cover" className="w-32 h-32 object-cover rounded" />
            )}
          </div>

          <div className="space-y-2">
            <Label>Заголовок страницы</Label>
            <Input
              value={seasonForm.title}
              onChange={(e) => setSeasonForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Заголовок на странице лукбука"
            />
          </div>

          <div className="space-y-2">
            <Label>Подзаголовок</Label>
            <Input
              value={seasonForm.subtitle}
              onChange={(e) => setSeasonForm(prev => ({ ...prev, subtitle: e.target.value }))}
              placeholder="Подзаголовок на странице лукбука"
            />
          </div>

          <div className="space-y-2">
            <Label>Описание</Label>
            <Textarea
              value={seasonForm.description}
              onChange={(e) => setSeasonForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Полное описание лукбука (можно использовать HTML)"
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSaveSeason} 
              disabled={!seasonForm.season_name.trim() || !seasonForm.slug.trim()}
            >
              {isEditingSeason ? 'Сохранить' : 'Создать'}
            </Button>
            {isEditingSeason && (
              <Button variant="outline" onClick={resetSeasonForm}>
                Отмена
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Seasons List */}
      <Card>
        <CardHeader>
          <CardTitle>Список лукбуков</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {seasons?.map((season) => (
            <div
              key={season.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <Button
                  variant={selectedSeasonId === season.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSeasonId(season.id)}
                >
                  {season.season_name}
                </Button>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={season.is_active}
                    onCheckedChange={() => handleToggleActive(season)}
                  />
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    {season.is_active ? (
                      <>
                        <Eye className="h-3 w-3" />
                        Активен
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3" />
                        Скрыт
                      </>
                    )}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEditSeason(season)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteSeasonId(season.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Images Management */}
      {selectedSeasonId && (
        <Card>
          <CardHeader>
            <CardTitle>
              Изображения - {seasons?.find((s) => s.id === selectedSeasonId)?.season_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Автор фотографий (необязательно)</Label>
              <Input
                value={photographerCredit}
                onChange={(e) => setPhotographerCredit(e.target.value)}
                placeholder="Имя фотографа"
              />
            </div>

            <ImageUploader
              bucket="site-images"
              onUploadComplete={handleAddImage}
            />

            {imagesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {images?.map((image) => (
                  <div key={image.id} className="border rounded-lg p-4 space-y-3">
                    <div className="relative group">
                      <img
                        src={image.image_url}
                        alt={image.alt_text || `Image ${image.display_order}`}
                        className="w-full aspect-video object-cover rounded"
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleToggleImageVisibility(image)}
                        >
                          {image.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setDeleteImageId(image.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {editingImageId === image.id ? (
                      <div className="space-y-2">
                        <Input
                          value={imageForm.caption}
                          onChange={(e) => setImageForm(prev => ({ ...prev, caption: e.target.value }))}
                          placeholder="Подпись к изображению"
                        />
                        <Input
                          value={imageForm.alt_text}
                          onChange={(e) => setImageForm(prev => ({ ...prev, alt_text: e.target.value }))}
                          placeholder="Alt текст"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveImage}>Сохранить</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingImageId(null)}>
                            Отмена
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm">
                          <strong>Подпись:</strong> {image.caption || 'Не указана'}
                        </p>
                        <p className="text-sm">
                          <strong>Alt:</strong> {image.alt_text || 'Не указан'}
                        </p>
                        {image.photographer_credit && (
                          <p className="text-xs text-muted-foreground">
                            Фото: {image.photographer_credit}
                          </p>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleEditImage(image)}>
                          <Edit2 className="h-3 w-3 mr-1" /> Редактировать
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <DeleteConfirmDialog
        open={!!deleteSeasonId}
        onOpenChange={() => setDeleteSeasonId(null)}
        onConfirm={() => {
          if (deleteSeasonId) {
            deleteSeason.mutate(deleteSeasonId);
            setDeleteSeasonId(null);
            if (selectedSeasonId === deleteSeasonId) {
              setSelectedSeasonId(undefined);
            }
          }
        }}
        title="Удалить лукбук?"
        description="Это также удалит все изображения этого лукбука."
        itemName={seasons?.find((s) => s.id === deleteSeasonId)?.season_name}
      />

      <DeleteConfirmDialog
        open={!!deleteImageId}
        onOpenChange={() => setDeleteImageId(null)}
        onConfirm={() => {
          if (deleteImageId) {
            deleteImage.mutate(deleteImageId);
            setDeleteImageId(null);
          }
        }}
        title="Удалить изображение?"
      />
    </div>
  );
}
