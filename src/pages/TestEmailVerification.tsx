import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { EmailVerificationDialog } from "@/components/EmailVerificationDialog";

/**
 * Тестовая страница для П-6: Подтверждение email кодом
 *
 * Процесс:
 * 1. Пользователь вводит email и имя
 * 2. Нажимает "Отправить код"
 * 3. Получает письмо с 6-значным кодом
 * 4. Вводит код в диалоге
 * 5. После подтверждения — авторизован
 */
export default function TestEmailVerification() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const { signUpWithEmail, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !fullName) {
      toast({
        title: "Ошибка",
        description: "Заполните все поля",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await signUpWithEmail(email, fullName);

    setLoading(false);

    if (error) {
      toast({
        title: "Ошибка отправки кода",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Код отправлен!",
      description: `Проверьте почту ${email}`,
    });

    setShowVerificationDialog(true);
  };

  const handleVerified = () => {
    setShowVerificationDialog(false);
    toast({
      title: "Добро пожаловать!",
      description: `Вы успешно авторизованы как ${email}`,
    });

    // Перенаправляем на главную через 1 секунду
    setTimeout(() => {
      navigate("/");
    }, 1000);
  };

  const handleCancel = () => {
    setShowVerificationDialog(false);
    toast({
      title: "Отменено",
      description: "Вы можете отправить код повторно",
    });
  };

  if (user) {
    return (
      <div className="min-h-full flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Вы уже авторизованы</CardTitle>
            <CardDescription>
              Авторизован как: <strong>{user.email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              На главную
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-full flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Регистрация с подтверждением email</CardTitle>
          <CardDescription>
            Тест задачи П-6: Подтверждение email кодом
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Ваше имя</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Иван Иванов"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="ivan@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Отправка..." : "Отправить код на email"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Как это работает:</strong>
            </p>
            <ol className="text-sm text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
              <li>Вводите email и имя</li>
              <li>Нажимаете "Отправить код"</li>
              <li>Получаете письмо с 6-значным кодом</li>
              <li>Вводите код в диалоге</li>
              <li>Готово — вы авторизованы!</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <EmailVerificationDialog
        open={showVerificationDialog}
        email={email}
        onVerified={handleVerified}
        onCancel={handleCancel}
      />
    </div>
  );
}
