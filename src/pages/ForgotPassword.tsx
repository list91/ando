import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type Step = 'email' | 'otp' | 'newPassword';

const ForgotPassword = () => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: 'Ошибка', description: 'Введите email', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) {
        toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      } else {
        setStep('otp');
        toast({ title: 'Код отправлен', description: 'Проверьте почту' });
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось отправить запрос', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      toast({ title: 'Ошибка', description: 'Введите 6-значный код', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpCode,
        type: 'recovery',
      });
      if (error) {
        toast({ title: 'Ошибка', description: 'Неверный или просроченный код', variant: 'destructive' });
      } else {
        setStep('newPassword');
        toast({ title: 'Код подтверждён', description: 'Введите новый пароль' });
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось проверить код', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: 'Ошибка', description: 'Пароль минимум 6 символов', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Ошибка', description: 'Пароли не совпадают', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Пароль изменён', description: 'Войдите с новым паролем' });
        navigate('/auth');
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось изменить пароль', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) {
        toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Код отправлен', description: 'Проверьте почту' });
      }
    } finally {
      setLoading(false);
    }
  };

  if (step === 'email') {
    return (
      <div className="min-h-full flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Забыли пароль?</CardTitle>
            <CardDescription>Введите email для восстановления</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" required maxLength={255} autoFocus />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Отправка...' : 'Отправить код'}</Button>
            </form>
            <div className="mt-4 text-center">
              <Link to="/auth"><Button variant="link"><ArrowLeft className="w-4 h-4 mr-1" />Вернуться ко входу</Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'otp') {
    return (
      <div className="min-h-full flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Введите код</CardTitle>
            <CardDescription>Код отправлен на {email}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otpCode">Код подтверждения</Label>
                <Input id="otpCode" type="text" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" required maxLength={6} className="text-center text-2xl tracking-widest" autoFocus />
              </div>
              <Button type="submit" className="w-full" disabled={loading || otpCode.length !== 6}>{loading ? 'Проверка...' : 'Подтвердить'}</Button>
            </form>
            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">Не получили?</span>
              <Button variant="link" onClick={handleResendCode} disabled={loading} className="ml-1">Отправить повторно</Button>
            </div>
            <div className="mt-2 text-center">
              <Button variant="ghost" onClick={() => { setStep('email'); setOtpCode(''); }} className="text-sm">← Изменить email</Button>
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
          <CardTitle>Новый пароль</CardTitle>
          <CardDescription>Придумайте новый пароль</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Новый пароль</Label>
              <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" required minLength={6} maxLength={100} autoFocus />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required minLength={6} maxLength={100} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить пароль'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
