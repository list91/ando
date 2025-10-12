import { useState } from "react";
import { useHeroSlides, useCreateHeroSlide, useUpdateHeroSlide, useDeleteHeroSlide } from "@/hooks/useHeroSlides";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash2, GripVertical } from "lucide-react";
import { ImageUploader } from "@/components/admin/ImageUploader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function HeroSlides() {
  const { data: slides, isLoading } = useHeroSlides();
  const createSlide = useCreateHeroSlide();
  const updateSlide = useUpdateHeroSlide();
  const deleteSlide = useDeleteHeroSlide();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [slideToDelete, setSlideToDelete] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    image_url: "",
    display_order: 0,
    is_active: true,
  });

  const handleCreate = () => {
    createSlide.mutate(formData, {
      onSuccess: () => {
        setFormData({
          title: "",
          subtitle: "",
          image_url: "",
          display_order: slides?.length || 0,
          is_active: true,
        });
      },
    });
  };

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Слайды главной страницы</h1>
        <p className="text-muted-foreground mt-2">
          Управление слайдами в шапке главной страницы
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Добавить новый слайд</CardTitle>
          <CardDescription>Создайте новый слайд для главной страницы</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Заголовок</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="THE ROW"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Подзаголовок</Label>
            <Input
              id="subtitle"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="Описание слайда"
            />
          </div>

          <div className="space-y-2">
            <Label>Изображение</Label>
            <ImageUploader
              bucket="site-images"
              currentImageUrl={formData.image_url}
              onUploadComplete={(url) => setFormData({ ...formData, image_url: url })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="active">Активен</Label>
          </div>

          <Button
            onClick={handleCreate}
            disabled={!formData.title || !formData.image_url || createSlide.isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            Добавить слайд
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Существующие слайды</h2>
        {slides?.map((slide) => (
          <Card key={slide.id}>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex items-center">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>

                {slide.image_url && (
                  <img
                    src={slide.image_url}
                    alt={slide.title}
                    className="w-32 h-20 object-cover rounded"
                  />
                )}

                <div className="flex-1 space-y-3">
                  <div className="space-y-2">
                    <Label>Заголовок</Label>
                    <Input
                      value={slide.title}
                      onChange={(e) => handleUpdate(slide.id, { title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Подзаголовок</Label>
                    <Input
                      value={slide.subtitle || ""}
                      onChange={(e) => handleUpdate(slide.id, { subtitle: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Порядок отображения</Label>
                    <Input
                      type="number"
                      value={slide.display_order}
                      onChange={(e) => handleUpdate(slide.id, { display_order: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={slide.is_active}
                        onCheckedChange={(checked) => handleUpdate(slide.id, { is_active: checked })}
                      />
                      <Label>Активен</Label>
                    </div>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSlideToDelete(slide.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Удалить
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить слайд?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (slideToDelete) {
                  deleteSlide.mutate(slideToDelete);
                  setDeleteDialogOpen(false);
                  setSlideToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
