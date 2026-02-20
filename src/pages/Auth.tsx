import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Неверный формат email'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
  fullName: z.string().min(2, 'Имя должно содержать минимум 2 символа').optional(),
});

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP verification state
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');

  const { signUp, signIn, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = isSignUp
        ? { email, password, fullName }
        : { email, password };

      authSchema.parse(data);

      if (isSignUp) {
        const { error } = await signUp(email, password, fullName);

        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'Ошибка',
              description: 'Пользователь с таким email уже зарегистрирован',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Ошибка',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          // Show OTP input after successful signup
          setPendingEmail(email);
          setShowOtpInput(true);
          toast({
            title: 'Код отправлен',
            description: 'Проверьте вашу почту и введите код подтверждения',
          });
        }
      } else {
        const { error } = await signIn(email, password);

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: 'Ошибка',
              description: 'Неверный email или пароль',
              variant: 'destructive',
            });
          } else if (error.message.includes('Email not confirmed')) {
            // User exists but email not confirmed - show OTP input
            setPendingEmail(email);
            setShowOtpInput(true);
            toast({
              title: 'Подтвердите email',
              description: 'Введите код подтверждения, отправленный на вашу почту',
            });
          } else {
            toast({
              title: 'Ошибка',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Вход выполнен',
            description: 'Вы успешно вошли в систему',
          });
          navigate('/');
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Ошибка валидации',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token: otpCode,
        type: 'signup',
      });

      if (error) {
        toast({
          title: 'Ошибка',
          description: 'Неверный код подтверждения',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Email подтверждён',
          description: 'Добро пожаловать!',
        });
        navigate('/');
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось подтвердить код',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: pendingEmail,
      });

      if (error) {
        toast({
          title: 'Ошибка',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Код отправлен',
          description: 'Проверьте вашу почту',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // OTP verification screen
  if (showOtpInput) {
    return (
      <div className="min-h-full flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Подтверждение email</CardTitle>
            <CardDescription>
              Введите 6-значный код, отправленный на {pendingEmail}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otpCode">Код подтверждения</Label>
                <Input
                  id="otpCode"
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  required
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || otpCode.length !== 6}>
                {loading ? 'Проверка...' : 'Подтвердить'}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">Не получили код?</span>
              <Button
                variant="link"
                onClick={handleResendCode}
                disabled={loading}
                className="ml-1"
              >
                Отправить повторно
              </Button>
            </div>
            <div className="mt-2 text-center">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowOtpInput(false);
                  setOtpCode('');
                  setPendingEmail('');
                }}
                className="text-sm"
              >
                ← Вернуться к регистрации
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-full flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isSignUp ? 'Регистрация' : 'Вход'}</CardTitle>
          <CardDescription>
            {isSignUp
              ? 'Создайте аккаунт для оформления заказов'
              : 'Войдите в свой аккаунт'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Полное имя</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Иван Иванов"
                  required={isSignUp}
                  maxLength={100}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                maxLength={100}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Загрузка...' : isSignUp ? 'Зарегистрироваться' : 'Войти'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {isSignUp ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}
            <Button
              variant="link"
              onClick={() => setIsSignUp(!isSignUp)}
              className="ml-1"
            >
              {isSignUp ? 'Войти' : 'Зарегистрироваться'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
