import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAboutPage, useUpdateAboutSection } from "@/hooks/useAboutPage";
import { Loader2 } from "lucide-react";
import { ImageUploader } from "@/components/admin/ImageUploader";

const AboutPage = () => {
  const { data: sections, isLoading } = useAboutPage();
  const updateSection = useUpdateAboutSection();
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    title?: string;
    content?: string;
    image_url?: string;
  }>({});

  const handleEdit = (section: any) => {
    setEditingSection(section.id);
    setFormData({
      title: section.title || "",
      content: section.content || "",
      image_url: section.image_url || "",
    });
  };

  const handleSave = (sectionId: string) => {
    updateSection.mutate(
      { id: sectionId, updates: formData },
      {
        onSuccess: () => {
          setEditingSection(null);
          setFormData({});
        },
      }
    );
  };

  const handleCancel = () => {
    setEditingSection(null);
    setFormData({});
  };

  const getSectionLabel = (sectionKey: string) => {
    const labels: Record<string, string> = {
      brand_title: "Название бренда",
      description_1: "Описание 1",
      description_2: "Описание 2",
      description_3: "Описание 3",
      philosophy: "Философия",
      production: "Производство",
      contacts: "Контакты",
      founder_image: "Фото основателей",
    };
    return labels[sectionKey] || sectionKey;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Страница "О бренде"</h1>
        <p className="text-muted-foreground mt-2">
          Управление контентом страницы "О бренде"
        </p>
      </div>

      <div className="grid gap-6">
        {sections?.map((section) => {
          const isEditing = editingSection === section.id;

          return (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle>{getSectionLabel(section.section_key)}</CardTitle>
                <CardDescription>
                  {section.section_key === "founder_image"
                    ? "Изображение основателей бренда"
                    : "Редактируйте текстовое содержимое секции"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    {section.section_key !== "founder_image" && section.title !== null && (
                      <div className="space-y-2">
                        <Label>Заголовок</Label>
                        <Input
                          value={formData.title || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                        />
                      </div>
                    )}

                    {section.section_key !== "founder_image" && (
                      <div className="space-y-2">
                        <Label>Содержимое</Label>
                        <Textarea
                          value={formData.content || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, content: e.target.value })
                          }
                          rows={6}
                        />
                      </div>
                    )}

                    {section.section_key === "founder_image" && (
                      <div className="space-y-2">
                        <Label>Изображение</Label>
                        <ImageUploader
                          bucket="site-images"
                          currentImageUrl={formData.image_url}
                          onUploadComplete={(url) =>
                            setFormData({ ...formData, image_url: url })
                          }
                        />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSave(section.id)}
                        disabled={updateSection.isPending}
                      >
                        {updateSection.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Сохранение...
                          </>
                        ) : (
                          "Сохранить"
                        )}
                      </Button>
                      <Button variant="outline" onClick={handleCancel}>
                        Отмена
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {section.title && (
                      <div>
                        <p className="text-sm text-muted-foreground">Заголовок:</p>
                        <p className="font-medium">{section.title}</p>
                      </div>
                    )}

                    {section.content && (
                      <div>
                        <p className="text-sm text-muted-foreground">Содержимое:</p>
                        <p className="whitespace-pre-wrap">{section.content}</p>
                      </div>
                    )}

                    {section.image_url && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Изображение:</p>
                        <img
                          src={section.image_url}
                          alt={section.title || ""}
                          className="max-w-md rounded-lg"
                        />
                      </div>
                    )}

                    <Button onClick={() => handleEdit(section)}>
                      Редактировать
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AboutPage;
