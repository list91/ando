import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Download, Smartphone, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
  };

  return (
    <>
      <Helmet>
        <title>Установить приложение ANDO JV</title>
        <meta name="description" content="Установите мобильное приложение ANDO JV для удобного доступа к каталогу и офлайн-режима" />
      </Helmet>

      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Установить ANDO JV</h1>
            <p className="text-muted-foreground">
              Установите наше приложение для быстрого доступа и работы офлайн
            </p>
          </div>

          {isInstalled ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Приложение уже установлено! Откройте его с главного экрана вашего устройства.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {isIOS ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5" />
                      Установка на iOS
                    </CardTitle>
                    <CardDescription>
                      Следуйте этим шагам для установки на iPhone или iPad
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ol className="list-decimal list-inside space-y-3">
                      <li>Нажмите кнопку "Поделиться" (квадрат со стрелкой вверх) внизу Safari</li>
                      <li>Прокрутите вниз и выберите "На экран Домой"</li>
                      <li>Нажмите "Добавить" в правом верхнем углу</li>
                      <li>Приложение появится на вашем главном экране</li>
                    </ol>
                  </CardContent>
                </Card>
              ) : deferredPrompt ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5" />
                      Готово к установке
                    </CardTitle>
                    <CardDescription>
                      Установите приложение одним нажатием
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={handleInstall} size="lg" className="w-full">
                      <Download className="mr-2 h-5 w-5" />
                      Установить приложение
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Установка на Android</CardTitle>
                    <CardDescription>
                      Следуйте этим шагам для установки на Android
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ol className="list-decimal list-inside space-y-3">
                      <li>Откройте меню браузера (три точки в правом верхнем углу)</li>
                      <li>Выберите "Установить приложение" или "Добавить на главный экран"</li>
                      <li>Подтвердите установку</li>
                      <li>Приложение появится на вашем главном экране</li>
                    </ol>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Преимущества приложения</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Быстрый доступ</div>
                    <div className="text-sm text-muted-foreground">
                      Запускайте приложение прямо с главного экрана
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Работа офлайн</div>
                    <div className="text-sm text-muted-foreground">
                      Просматривайте каталог даже без интернета
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Быстрая загрузка</div>
                    <div className="text-sm text-muted-foreground">
                      Мгновенный запуск благодаря кэшированию
                    </div>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Install;
