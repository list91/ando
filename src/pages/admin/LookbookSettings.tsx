import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { 
  useSiteSettings, 
  useCreateSiteSetting, 
  useUpdateSiteSetting 
} from "@/hooks/useSiteSettings";

export default function LookbookSettings() {
  const { data: settings, isLoading } = useSiteSettings("lookbook");
  const createSetting = useCreateSiteSetting();
  const updateSetting = useUpdateSiteSetting();

  const [showIntro, setShowIntro] = useState(true);
  const [introTitle, setIntroTitle] = useState("");
  const [introDescription, setIntroDescription] = useState("");

  useEffect(() => {
    if (settings) {
      const showIntroSetting = settings.find(s => s.key === "lookbook_show_intro");
      const titleSetting = settings.find(s => s.key === "lookbook_intro_title");
      const descriptionSetting = settings.find(s => s.key === "lookbook_intro_description");

      setShowIntro(showIntroSetting?.value === true);
      setIntroTitle(titleSetting?.value as string || "");
      setIntroDescription(descriptionSetting?.value as string || "");
    }
  }, [settings]);

  const handleSave = async () => {
    const showIntroSetting = settings?.find(s => s.key === "lookbook_show_intro");
    const titleSetting = settings?.find(s => s.key === "lookbook_intro_title");
    const descriptionSetting = settings?.find(s => s.key === "lookbook_intro_description");

    try {
      // Show intro toggle
      if (showIntroSetting) {
        await updateSetting.mutateAsync({
          id: showIntroSetting.id,
          value: showIntro,
        });
      } else {
        await createSetting.mutateAsync({
          key: "lookbook_show_intro",
          value: showIntro,
          category: "lookbook",
          description: "Показывать вводный текст на странице лукбуков",
        });
      }

      // Intro title
      if (titleSetting) {
        await updateSetting.mutateAsync({
          id: titleSetting.id,
          value: introTitle,
        });
      } else {
        await createSetting.mutateAsync({
          key: "lookbook_intro_title",
          value: introTitle,
          category: "lookbook",
          description: "Заголовок вводного блока",
        });
      }

      // Intro description
      if (descriptionSetting) {
        await updateSetting.mutateAsync({
          id: descriptionSetting.id,
          value: introDescription,
        });
      } else {
        await createSetting.mutateAsync({
          key: "lookbook_intro_description",
          value: introDescription,
          category: "lookbook",
          description: "Описание вводного блока",
        });
      }
    } catch (error) {
      console.error("Error saving lookbook settings:", error);
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
        <h1 className="text-3xl font-bold">Настройки страницы лукбуков</h1>
        <p className="text-muted-foreground mt-2">
          Управление вводным блоком на странице списка лукбуков
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Вводный блок</CardTitle>
          <CardDescription>
            Текстовый блок, который отображается вверху страницы со списком лукбуков
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-intro"
              checked={showIntro}
              onCheckedChange={setShowIntro}
            />
            <Label htmlFor="show-intro">Показывать вводный блок</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="intro-title">Заголовок</Label>
            <Input
              id="intro-title"
              value={introTitle}
              onChange={(e) => setIntroTitle(e.target.value)}
              placeholder="Например: Наши коллекции"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="intro-description">Описание</Label>
            <Textarea
              id="intro-description"
              value={introDescription}
              onChange={(e) => setIntroDescription(e.target.value)}
              placeholder="Краткое описание раздела лукбуков"
              rows={4}
            />
          </div>

          <Button onClick={handleSave} className="w-full md:w-auto">
            Сохранить настройки
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
